package com.investedu.platform.service;

import com.investedu.platform.dto.AssetDto;
import com.investedu.platform.dto.AssetUpsertRequest;
import com.investedu.platform.dto.CategoryDto;
import com.investedu.platform.dto.CategoryUpsertRequest;
import com.investedu.platform.dto.DownloadResponse;
import com.investedu.platform.dto.SearchResponse;
import com.investedu.platform.dto.TopicDto;
import com.investedu.platform.dto.TopicUpsertRequest;
import com.investedu.platform.entity.AssetEntity;
import com.investedu.platform.entity.CategoryEntity;
import com.investedu.platform.entity.DownloadRecordEntity;
import com.investedu.platform.entity.TopicAssetEntity;
import com.investedu.platform.entity.TopicEntity;
import com.investedu.platform.exception.NotFoundException;
import com.investedu.platform.repository.AssetRepository;
import com.investedu.platform.repository.CategoryRepository;
import com.investedu.platform.repository.DownloadRecordRepository;
import com.investedu.platform.repository.TopicRepository;
import com.investedu.platform.storage.LocalStorageService;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContentService {
  private static final String ASSET_PACKAGE_URL = "/api/v1/assets/%s/package";
  private static final String TOPIC_PACKAGE_URL = "/api/v1/topics/%s/package";

  private static final Map<String, String> PREFIX_BY_CAT = Map.of(
      "基金", "FUND",
      "理财", "WM",
      "保险", "INS",
      "信贷", "CREDIT",
      "养老", "PENSION",
      "黄金", "GOLD",
      "代发", "PAYROLL"
  );

  private final AssetRepository assetRepository;
  private final TopicRepository topicRepository;
  private final CategoryRepository categoryRepository;
  private final DownloadRecordRepository downloadRecordRepository;
  private final LocalStorageService storageService;

  public ContentService(
      AssetRepository assetRepository,
      TopicRepository topicRepository,
      CategoryRepository categoryRepository,
      DownloadRecordRepository downloadRecordRepository,
      LocalStorageService storageService
  ) {
    this.assetRepository = assetRepository;
    this.topicRepository = topicRepository;
    this.categoryRepository = categoryRepository;
    this.downloadRecordRepository = downloadRecordRepository;
    this.storageService = storageService;
  }

  @Transactional(readOnly = true)
  public List<CategoryDto> listCategories() {
    return categoryRepository.findAllByOrderByDisplayOrderAscNameAsc().stream()
        .map(this::toDto)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<AssetDto> listAssets(String keyword, String cat, String scene) {
    return assetRepository.findAll().stream()
        .filter(asset -> isBlank(keyword)
            || contains(asset.getTitle(), keyword)
            || contains(asset.getQuestion(), keyword)
            || contains(asset.getSummary(), keyword))
        .filter(asset -> isBlank(cat) || Objects.equals(asset.getCat(), cat))
        .filter(asset -> isBlank(scene) || Objects.equals(asset.getScene(), scene))
        .sorted(Comparator.comparing(AssetEntity::getUpdated, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
        .map(this::toDto)
        .toList();
  }

  @Transactional(readOnly = true)
  public AssetDto getAsset(String id) {
    return toDto(findAsset(id));
  }

  @Transactional(readOnly = true)
  public List<TopicDto> listTopics(String keyword, String channel, String scene) {
    return topicRepository.findAll().stream()
        .filter(topic -> isBlank(keyword)
            || contains(topic.getName(), keyword)
            || contains(topic.getTagline(), keyword)
            || contains(topic.getGoal(), keyword))
        .filter(topic -> isBlank(channel) || Objects.equals(topic.getChannel(), channel))
        .filter(topic -> isBlank(scene) || Objects.equals(topic.getScene(), scene))
        .sorted(Comparator.comparing(TopicEntity::getUpdated, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
        .map(this::toDto)
        .toList();
  }

  @Transactional(readOnly = true)
  public TopicDto getTopic(String id) {
    return toDto(findTopic(id));
  }

  @Transactional(readOnly = true)
  public SearchResponse search(String keyword) {
    if (isBlank(keyword)) {
      return new SearchResponse(List.of(), List.of());
    }
    return new SearchResponse(
        listAssets(keyword, null, null).stream().limit(10).toList(),
        listTopics(keyword, null, null).stream().limit(10).toList()
    );
  }

  @Transactional
  public DownloadResponse downloadAsset(String id) {
    AssetEntity asset = findAsset(id);
    asset.setDownloads(asset.getDownloads() + 1);
    assetRepository.save(asset);
    saveDownload("asset", id);
    return new DownloadResponse(id, "asset", ASSET_PACKAGE_URL.formatted(id), asset.getDownloads());
  }

  @Transactional
  public DownloadResponse downloadTopic(String id) {
    TopicEntity topic = findTopic(id);
    topic.setDownloads(topic.getDownloads() + 1);
    topicRepository.save(topic);
    saveDownload("topic", id);
    return new DownloadResponse(id, "topic", TOPIC_PACKAGE_URL.formatted(id), topic.getDownloads());
  }

  @Transactional
  public CategoryDto createCategory(CategoryUpsertRequest request) {
    CategoryEntity category = categoryRepository.findByName(request.name()).orElseGet(CategoryEntity::new);
    apply(category, request);
    if (category.getDisplayOrder() == 0) {
      category.setDisplayOrder((int) categoryRepository.count() + 1);
    }
    return toDto(categoryRepository.save(category));
  }

  @Transactional
  public CategoryDto updateCategory(String name, CategoryUpsertRequest request) {
    CategoryEntity category = findCategory(name);
    String oldName = category.getName();
    boolean nameTaken = !Objects.equals(oldName, request.name()) && categoryRepository.existsByName(request.name());
    if (nameTaken) {
      throw new IllegalArgumentException("品类已存在: " + request.name());
    }
    apply(category, request);
    CategoryEntity saved = categoryRepository.save(category);
    renameCategoryReferences(oldName, saved.getName());
    return toDto(saved);
  }

  @Transactional
  public void deleteCategory(String name) {
    CategoryEntity category = findCategory(name);
    categoryRepository.delete(category);
  }

  @Transactional
  public AssetDto createAsset(AssetUpsertRequest request) {
    AssetEntity asset = new AssetEntity();
    asset.setId(isBlank(request.id()) ? nextAssetId(request.cat()) : request.id());
    apply(asset, request);
    return toDto(assetRepository.save(asset));
  }

  @Transactional
  public AssetDto updateAsset(String id, AssetUpsertRequest request) {
    AssetEntity asset = findAsset(id);
    apply(asset, request);
    return toDto(assetRepository.save(asset));
  }

  @Transactional
  public void deleteAsset(String id) {
    if (!assetRepository.existsById(id)) {
      throw new NotFoundException("素材不存在: " + id);
    }
    topicRepository.findAll().forEach(topic -> {
      List<String> assetIds = topic.getAssets().stream()
          .map(TopicAssetEntity::getAssetId)
          .filter(assetId -> !Objects.equals(assetId, id))
          .toList();
      topic.replaceAssetIds(assetIds);
      topicRepository.save(topic);
    });
    assetRepository.deleteById(id);
  }

  @Transactional
  public TopicDto createTopic(TopicUpsertRequest request) {
    TopicEntity topic = new TopicEntity();
    topic.setId(isBlank(request.id()) ? nextTopicId() : request.id());
    apply(topic, request);
    return toDto(topicRepository.save(topic));
  }

  @Transactional
  public TopicDto updateTopic(String id, TopicUpsertRequest request) {
    TopicEntity topic = findTopic(id);
    apply(topic, request);
    return toDto(topicRepository.save(topic));
  }

  @Transactional
  public void deleteTopic(String id) {
    if (!topicRepository.existsById(id)) {
      throw new NotFoundException("专题包不存在: " + id);
    }
    topicRepository.deleteById(id);
  }

  @Transactional(readOnly = true)
  public void writeAssetPackage(String id, OutputStream outputStream) throws IOException {
    AssetEntity asset = findAsset(id);
    try (ZipOutputStream zip = new ZipOutputStream(outputStream, StandardCharsets.UTF_8)) {
      addText(zip, "内容说明.txt", """
          素材编号：%s
          素材标题：%s
          所属品类：%s
          客户问题：%s
          核心摘要：%s
          适用场景：%s
          适用对象：%s
          更新时间：%s
          """.formatted(
          asset.getId(), asset.getTitle(), asset.getCat(), nvl(asset.getQuestion()), nvl(asset.getSummary()),
          nvl(asset.getScene()), nvl(asset.getAudience()), asset.getUpdated()
      ));
      addText(zip, "推荐转发文案.txt", forwardText(asset));
      addText(zip, "风险提示与免责声明.txt", nvl(asset.getRisk()) + "\n本资料仅用于投资者教育，不构成投资建议；投资有风险，决策需谨慎。");
      addCover(zip, asset.getCover(), asset.getId() + ".png");
    }
  }

  @Transactional(readOnly = true)
  public void writeTopicPackage(String id, OutputStream outputStream) throws IOException {
    TopicEntity topic = findTopic(id);
    try (ZipOutputStream zip = new ZipOutputStream(outputStream, StandardCharsets.UTF_8)) {
      addText(zip, "专题说明.txt", """
          专题编号：%s
          专题名称：%s
          所属品类：%s
          适用场景：%s
          适用对象：%s
          内容目标：%s
          组合说明：%s
          推荐使用方式：%s
          推荐使用顺序：%s
          讲解边界：%s
          """.formatted(
          topic.getId(), topic.getName(), topic.getChannel(), nvl(topic.getScene()), nvl(topic.getAudience()),
          nvl(topic.getGoal()), nvl(topic.getCombineReason()), nvl(topic.getSendMode()), nvl(topic.getSendOrder()),
          nvl(topic.getTalkBoundary())
      ));

      for (TopicAssetEntity item : topic.getAssets()) {
        AssetEntity asset = assetRepository.findById(item.getAssetId()).orElse(null);
        if (asset != null) {
          addCover(zip, asset.getCover(), "素材-" + item.getAssetOrder() + "-" + asset.getId() + ".png");
        }
      }
      addText(zip, "配套转发文案.txt", topic.getName() + "\n" + nvl(topic.getTagline()));
      addText(zip, "风险提示与免责声明.txt", "本资料仅用于投资者教育，不构成投资建议；投资有风险，决策需谨慎。");
    }
  }

  public AssetDto toDto(AssetEntity asset) {
    return new AssetDto(
        asset.getId(),
        asset.getTitle(),
        asset.getCat(),
        nvl(asset.getQuestion()),
        nvl(asset.getSummary()),
        nvl(asset.getRisk()),
        nvl(asset.getCover()),
        nvl(asset.getScene()),
        asset.getUpdated() == null ? "" : asset.getUpdated().toString(),
        nvl(asset.getAudience()),
        nvl(asset.getUseWhen()),
        nvl(asset.getTalkTip()),
        asset.getDownloads()
    );
  }

  public TopicDto toDto(TopicEntity topic) {
    List<String> assetIds = topic.getAssets().stream()
        .map(TopicAssetEntity::getAssetId)
        .toList();
    return new TopicDto(
        topic.getId(),
        topic.getName(),
        topic.getChannel(),
        assetIds,
        nvl(topic.getScene()),
        nvl(topic.getAudience()),
        nvl(topic.getGoal()),
        nvl(topic.getTagline()),
        topic.getUpdated() == null ? "" : topic.getUpdated().toString(),
        nvl(topic.getUrl()),
        nvl(topic.getCombineReason()),
        nvl(topic.getSendMode()),
        nvl(topic.getSendOrder()),
        nvl(topic.getTalkBoundary()),
        topic.getCoverId(),
        nvl(topic.getSceneGroup()),
        topic.getDownloads()
    );
  }

  public CategoryDto toDto(CategoryEntity category) {
    return new CategoryDto(category.getName(), nvl(category.getCoverageContent()));
  }

  private CategoryEntity findCategory(String name) {
    return categoryRepository.findByName(name).orElseThrow(() -> new NotFoundException("品类不存在: " + name));
  }

  private AssetEntity findAsset(String id) {
    return assetRepository.findById(id).orElseThrow(() -> new NotFoundException("素材不存在: " + id));
  }

  private TopicEntity findTopic(String id) {
    return topicRepository.findById(id).orElseThrow(() -> new NotFoundException("专题包不存在: " + id));
  }

  private void apply(AssetEntity asset, AssetUpsertRequest request) {
    asset.setTitle(request.title());
    asset.setCat(request.cat());
    asset.setQuestion(nvl(request.question()));
    asset.setSummary(nvl(request.summary()));
    asset.setRisk(nvl(request.risk()));
    asset.setCover(nvl(request.cover()));
    asset.setScene(isBlank(request.scene()) ? "客户咨询" : request.scene());
    asset.setUpdated(parseDate(request.updated(), LocalDate.now()));
    asset.setAudience(nvl(request.audience()));
    asset.setUseWhen(nvl(request.useWhen()));
    asset.setTalkTip(nvl(request.talkTip()));
    if (request.downloads() != null) {
      asset.setDownloads(request.downloads());
    }
  }

  private void apply(TopicEntity topic, TopicUpsertRequest request) {
    topic.setName(request.name());
    topic.setChannel(request.channel());
    topic.setScene(isBlank(request.scene()) ? "客户咨询" : request.scene());
    topic.setAudience(nvl(request.audience()));
    topic.setGoal(nvl(request.goal()));
    topic.setTagline(nvl(request.tagline()));
    topic.setUpdated(parseDate(request.updated(), LocalDate.now()));
    topic.setUrl(isBlank(request.url()) ? "https://h5.invested.cn/t/" + topic.getId().toLowerCase() : request.url());
    topic.setCombineReason(nvl(request.combineReason()));
    topic.setSendMode(isBlank(request.sendMode()) ? "一次发送" : request.sendMode());
    topic.setSendOrder(nvl(request.sendOrder()));
    topic.setTalkBoundary(nvl(request.talkBoundary()));
    topic.setCoverId(request.coverId());
    topic.setSceneGroup(isBlank(request.sceneGroup()) ? topic.getScene() : request.sceneGroup());
    if (request.downloads() != null) {
      topic.setDownloads(request.downloads());
    }
    topic.replaceAssetIds(request.assetIds() == null ? List.of() : request.assetIds());
  }

  private void apply(CategoryEntity category, CategoryUpsertRequest request) {
    category.setName(request.name());
    category.setCoverageContent(nvl(request.coverageContent()));
  }

  private void renameCategoryReferences(String oldName, String newName) {
    if (Objects.equals(oldName, newName)) {
      return;
    }
    assetRepository.findAll().stream()
        .filter(asset -> Objects.equals(asset.getCat(), oldName))
        .forEach(asset -> {
          asset.setCat(newName);
          assetRepository.save(asset);
        });
    topicRepository.findAll().stream()
        .filter(topic -> Objects.equals(topic.getChannel(), oldName))
        .forEach(topic -> {
          topic.setChannel(newName);
          topicRepository.save(topic);
        });
  }

  private String nextAssetId(String cat) {
    String prefix = PREFIX_BY_CAT.getOrDefault(cat, "AST");
    int next = 1;
    while (assetRepository.existsById(prefix + "-" + String.format("%03d", next))) {
      next++;
    }
    return prefix + "-" + String.format("%03d", next);
  }

  private String nextTopicId() {
    int next = 1;
    while (topicRepository.existsById("T" + String.format("%03d", next))) {
      next++;
    }
    return "T" + String.format("%03d", next);
  }

  private void saveDownload(String targetType, String targetId) {
    DownloadRecordEntity record = new DownloadRecordEntity();
    record.setTargetType(targetType);
    record.setTargetId(targetId);
    record.setCreatedAt(Instant.now());
    downloadRecordRepository.save(record);
  }

  private void addCover(ZipOutputStream zip, String cover, String fileName) throws IOException {
    Path path = storageService.resolveFromPublicUrl(cover);
    if (!storageService.exists(path)) {
      return;
    }
    zip.putNextEntry(new ZipEntry(fileName));
    zip.write(storageService.readAllBytes(path));
    zip.closeEntry();
  }

  private void addText(ZipOutputStream zip, String fileName, String content) throws IOException {
    zip.putNextEntry(new ZipEntry(fileName));
    zip.write(content.getBytes(StandardCharsets.UTF_8));
    zip.closeEntry();
  }

  private String forwardText(AssetEntity asset) {
    String riskLead = nvl(asset.getRisk()).split("；")[0];
    return "【" + asset.getTitle() + "】\n"
        + nvl(asset.getSummary()) + "\n"
        + "「" + nvl(asset.getQuestion()) + "」——点开这张图，一看就懂。\n"
        + "（" + riskLead + "。）";
  }

  private boolean contains(String source, String keyword) {
    return source != null && keyword != null && source.contains(keyword);
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }

  private String nvl(String value) {
    return value == null ? "" : value;
  }

  private LocalDate parseDate(String value, LocalDate fallback) {
    if (isBlank(value)) {
      return fallback;
    }
    return LocalDate.parse(value);
  }
}
