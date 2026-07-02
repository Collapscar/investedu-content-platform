package com.investedu.platform.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.investedu.platform.dto.AssetDescriptionRequest;
import com.investedu.platform.dto.AssetDescriptionSuggestion;
import com.investedu.platform.dto.TopicAssetSummary;
import com.investedu.platform.dto.TopicDescriptionRequest;
import com.investedu.platform.dto.TopicDescriptionSuggestion;
import com.investedu.platform.storage.LocalStorageService;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AiDescriptionService {
  private static final List<String> SCENES = List.of("客户咨询", "主题宣传", "风险教育", "节日活动");

  private final ObjectMapper objectMapper;
  private final LocalStorageService storageService;
  private final HttpClient httpClient;
  private final String apiKey;
  private final String baseUrl;
  private final String model;

  public AiDescriptionService(
      ObjectMapper objectMapper,
      LocalStorageService storageService,
      @Value("${OPENAI_API_KEY:${openai.api-key:}}") String apiKey,
      @Value("${DEEPSEEK_BASE_URL:https://api.deepseek.com}") String baseUrl,
      @Value("${DEEPSEEK_MODEL:deepseek-v4-pro}") String model
  ) {
    this.objectMapper = objectMapper;
    this.storageService = storageService;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
    this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();
  }

  public AssetDescriptionSuggestion suggestAsset(AssetDescriptionRequest request) {
    String prompt = """
        你是银行金融投教内容运营助手。请根据上传长图和管理员已填写信息，为素材生成客户经理可直接使用的说明文字。
        要求：
        1. 使用中文，口径稳健、合规，不承诺收益，不给买卖点，不替客户决策。
        2. 字段简洁，适合后台表单保存。
        3. scene 必须从：客户咨询、主题宣传、风险教育、节日活动 中选择一个。
        4. 只返回 JSON，不要 Markdown。
        JSON 字段：title, question, summary, audience, useWhen, talkTip, risk, scene。

        管理员已填信息：
        品类：%s
        使用场景：%s
        文件名：%s
        标题：%s
        客户问题：%s
        核心摘要：%s
        适用对象：%s
        使用时机：%s
        讲解提示：%s
        风险提示：%s
        """.formatted(
        nvl(request.cat()), nvl(request.scene()), nvl(request.fileName()), nvl(request.title()),
        nvl(request.question()), nvl(request.summary()), nvl(request.audience()), nvl(request.useWhen()),
        nvl(request.talkTip()), nvl(request.risk())
    );
    String json = completeJson(prompt, imageDataUrl(request.cover()));
    AssetDescriptionSuggestion suggestion = read(json, AssetDescriptionSuggestion.class);
    return new AssetDescriptionSuggestion(
        trim(suggestion.title()),
        trim(suggestion.question()),
        trim(suggestion.summary()),
        trim(suggestion.audience()),
        trim(suggestion.useWhen()),
        trim(suggestion.talkTip()),
        trim(suggestion.risk()),
        normalizeScene(suggestion.scene(), request.scene())
    );
  }

  public TopicDescriptionSuggestion suggestTopic(TopicDescriptionRequest request) {
    String prompt = """
        你是银行金融投教专题包运营助手。请根据已选择素材，为专题包生成客户经理可直接使用的说明文字。
        要求：
        1. 使用中文，口径稳健、合规，不承诺收益，不给买卖点，不替客户决策。
        2. 专题包说明要体现这些素材为什么放在一起、适合什么客户、建议怎样发送。
        3. sendMode 只能是：一次发送 或 分次发送。
        4. scene 必须从：客户咨询、主题宣传、风险教育、节日活动 中选择一个。
        5. sceneGroup 必须从：小白入门、进阶理解、高层管理 中选择一个。
        6. 只返回 JSON，不要 Markdown。
        JSON 字段：name, tagline, audience, goal, combineReason, sendMode, sendOrder, talkBoundary, scene, sceneGroup。

        管理员已填信息：
        专题名称：%s
        品类：%s
        使用场景：%s
        分层分类：%s
        适用对象：%s
        内容目标：%s
        解决问题：%s
        组合说明：%s
        推荐方式：%s
        推荐顺序：%s
        讲解边界：%s

        已选择素材：
        %s
        """.formatted(
        nvl(request.name()), nvl(request.channel()), nvl(request.scene()), nvl(request.sceneGroup()),
        nvl(request.audience()), nvl(request.goal()), nvl(request.tagline()), nvl(request.combineReason()),
        nvl(request.sendMode()), nvl(request.sendOrder()), nvl(request.talkBoundary()), assetLines(request.assets())
    );
    String json = completeJson(prompt, null);
    TopicDescriptionSuggestion suggestion = read(json, TopicDescriptionSuggestion.class);
    return new TopicDescriptionSuggestion(
        trim(suggestion.name()),
        trim(suggestion.tagline()),
        trim(suggestion.audience()),
        trim(suggestion.goal()),
        trim(suggestion.combineReason()),
        "分次发送".equals(suggestion.sendMode()) ? "分次发送" : "一次发送",
        trim(suggestion.sendOrder()),
        trim(suggestion.talkBoundary()),
        normalizeScene(suggestion.scene(), request.scene()),
        normalizeSceneGroup(suggestion.sceneGroup(), request.sceneGroup())
    );
  }

  private String completeJson(String prompt, String imageDataUrl) {
    if (apiKey == null || apiKey.isBlank()) {
      throw new IllegalStateException("未配置 OPENAI_API_KEY，无法调用 DeepSeek 生成说明");
    }
    ObjectNode payload = objectMapper.createObjectNode();
    payload.put("model", model);
    payload.put("temperature", 0.3);
    payload.putObject("thinking").put("type", "disabled");
    ObjectNode responseFormat = payload.putObject("response_format");
    responseFormat.put("type", "json_object");
    ArrayNode messages = payload.putArray("messages");
    messages.addObject()
        .put("role", "system")
        .put("content", "你只输出可解析 JSON。内容用于银行金融投教后台，必须合规、克制、无收益承诺。");
    ObjectNode user = messages.addObject().put("role", "user");
    if (imageDataUrl == null || imageDataUrl.isBlank()) {
      user.put("content", prompt);
      return postChatCompletion(payload);
    }
    ArrayNode content = user.putArray("content");
    content.addObject().put("type", "text").put("text", prompt);
    ObjectNode imagePart = content.addObject().put("type", "image_url");
    imagePart.putObject("image_url").put("url", imageDataUrl);
    try {
      return postChatCompletion(payload);
    } catch (IllegalStateException ex) {
      user.remove("content");
      user.put("content", prompt + "\n\n提示：图片输入不可用，已根据文件名和已填字段生成。");
      return postChatCompletion(payload);
    }
  }

  private String postChatCompletion(ObjectNode payload) {
    try {
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(trimTrailingSlash(baseUrl) + "/chat/completions"))
          .timeout(Duration.ofSeconds(60))
          .header("Authorization", "Bearer " + apiKey)
          .header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
          .build();
      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() >= 400) {
        throw new IllegalStateException("DeepSeek 生成失败：" + response.statusCode() + " " + response.body());
      }
      JsonNode root = objectMapper.readTree(response.body());
      String content = root.path("choices").path(0).path("message").path("content").asText();
      if (content == null || content.isBlank()) {
        throw new IllegalStateException("DeepSeek 未返回有效内容");
      }
      return stripJsonFence(content);
    } catch (IOException ex) {
      throw new IllegalStateException("DeepSeek 响应解析失败：" + ex.getMessage(), ex);
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("DeepSeek 请求被中断", ex);
    }
  }

  private String imageDataUrl(String cover) {
    Path path = storageService.resolveFromPublicUrl(cover);
    if (!storageService.exists(path)) {
      return null;
    }
    try {
      String mime = Files.probeContentType(path);
      if (mime == null || !mime.startsWith("image/")) {
        mime = "image/png";
      }
      return "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(storageService.readAllBytes(path));
    } catch (IOException ex) {
      return null;
    }
  }

  private String assetLines(List<TopicAssetSummary> assets) {
    if (assets == null || assets.isEmpty()) {
      return "未选择素材";
    }
    return assets.stream()
        .map(asset -> "- %s｜%s｜%s｜客户问题：%s｜摘要：%s".formatted(
            nvl(asset.id()), nvl(asset.cat()), nvl(asset.title()), nvl(asset.question()), nvl(asset.summary())
        ))
        .reduce((a, b) -> a + "\n" + b)
        .orElse("未选择素材");
  }

  private <T> T read(String json, Class<T> type) {
    try {
      return objectMapper.readValue(json, type);
    } catch (JsonProcessingException ex) {
      throw new IllegalStateException("AI 返回内容不是有效 JSON：" + json, ex);
    }
  }

  private String normalizeScene(String scene, String fallback) {
    if (SCENES.contains(scene)) {
      return scene;
    }
    return SCENES.contains(fallback) ? fallback : "客户咨询";
  }

  private String normalizeSceneGroup(String sceneGroup, String fallback) {
    if (List.of("小白入门", "进阶理解", "高层管理").contains(sceneGroup)) {
      return sceneGroup;
    }
    return List.of("小白入门", "进阶理解", "高层管理").contains(fallback) ? fallback : "小白入门";
  }

  private String stripJsonFence(String content) {
    String trimmed = content.trim();
    if (trimmed.startsWith("```")) {
      trimmed = trimmed.replaceFirst("^```(?:json)?\\s*", "");
      trimmed = trimmed.replaceFirst("\\s*```$", "");
    }
    return trimmed.trim();
  }

  private String trim(String value) {
    return value == null ? "" : value.trim();
  }

  private String nvl(String value) {
    return value == null ? "" : value;
  }

  private String trimTrailingSlash(String value) {
    return value == null || value.isBlank() ? "https://api.deepseek.com" : value.replaceFirst("/+$", "");
  }
}
