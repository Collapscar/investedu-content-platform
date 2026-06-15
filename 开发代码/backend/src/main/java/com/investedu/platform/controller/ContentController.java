package com.investedu.platform.controller;

import com.investedu.platform.dto.AssetDto;
import com.investedu.platform.dto.DownloadResponse;
import com.investedu.platform.dto.SearchResponse;
import com.investedu.platform.dto.TopicDto;
import com.investedu.platform.service.ContentService;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ContentController {
  private final ContentService contentService;

  public ContentController(ContentService contentService) {
    this.contentService = contentService;
  }

  @GetMapping("/assets")
  public List<AssetDto> listAssets(
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) String cat,
      @RequestParam(required = false) String scene
  ) {
    return contentService.listAssets(keyword, cat, scene);
  }

  @GetMapping("/assets/{id}")
  public AssetDto getAsset(@PathVariable String id) {
    return contentService.getAsset(id);
  }

  @GetMapping("/topics")
  public List<TopicDto> listTopics(
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) String channel,
      @RequestParam(required = false) String scene
  ) {
    return contentService.listTopics(keyword, channel, scene);
  }

  @GetMapping("/topics/{id}")
  public TopicDto getTopic(@PathVariable String id) {
    return contentService.getTopic(id);
  }

  @GetMapping("/search")
  public SearchResponse search(@RequestParam String keyword) {
    return contentService.search(keyword);
  }

  @PostMapping("/assets/{id}/download")
  public DownloadResponse downloadAsset(@PathVariable String id) {
    return contentService.downloadAsset(id);
  }

  @PostMapping("/topics/{id}/download")
  public DownloadResponse downloadTopic(@PathVariable String id) {
    return contentService.downloadTopic(id);
  }

  @GetMapping(value = "/assets/{id}/package", produces = "application/zip")
  public void assetPackage(@PathVariable String id, HttpServletResponse response) throws IOException {
    prepareZip(response, id + "-素材包.zip");
    contentService.writeAssetPackage(id, response.getOutputStream());
  }

  @GetMapping(value = "/topics/{id}/package", produces = "application/zip")
  public void topicPackage(@PathVariable String id, HttpServletResponse response) throws IOException {
    prepareZip(response, id + "-专题包.zip");
    contentService.writeTopicPackage(id, response.getOutputStream());
  }

  private void prepareZip(HttpServletResponse response, String fileName) {
    String encoded = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");
    String fallback = fileName.replaceAll("[^A-Za-z0-9._-]+", "_");
    response.setContentType("application/zip");
    response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fallback + "\"; filename*=UTF-8''" + encoded);
    response.setHeader("X-Content-Type-Options", "nosniff");
  }
}
