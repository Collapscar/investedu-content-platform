package com.investedu.platform.controller;

import com.investedu.platform.dto.AssetDto;
import com.investedu.platform.dto.AssetUpsertRequest;
import com.investedu.platform.dto.FileUploadResponse;
import com.investedu.platform.dto.TopicDto;
import com.investedu.platform.dto.TopicUpsertRequest;
import com.investedu.platform.service.ContentService;
import com.investedu.platform.storage.LocalStorageService;
import jakarta.validation.Valid;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {
  private final ContentService contentService;
  private final LocalStorageService storageService;

  public AdminController(ContentService contentService, LocalStorageService storageService) {
    this.contentService = contentService;
    this.storageService = storageService;
  }

  @PostMapping("/assets")
  @ResponseStatus(HttpStatus.CREATED)
  public AssetDto createAsset(@Valid @RequestBody AssetUpsertRequest request) {
    return contentService.createAsset(request);
  }

  @PutMapping("/assets/{id}")
  public AssetDto updateAsset(@PathVariable String id, @Valid @RequestBody AssetUpsertRequest request) {
    return contentService.updateAsset(id, request);
  }

  @DeleteMapping("/assets/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteAsset(@PathVariable String id) {
    contentService.deleteAsset(id);
  }

  @PostMapping("/topics")
  @ResponseStatus(HttpStatus.CREATED)
  public TopicDto createTopic(@Valid @RequestBody TopicUpsertRequest request) {
    return contentService.createTopic(request);
  }

  @PutMapping("/topics/{id}")
  public TopicDto updateTopic(@PathVariable String id, @Valid @RequestBody TopicUpsertRequest request) {
    return contentService.updateTopic(id, request);
  }

  @DeleteMapping("/topics/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteTopic(@PathVariable String id) {
    contentService.deleteTopic(id);
  }

  @PostMapping(value = "/files/covers", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public FileUploadResponse uploadCover(@RequestParam("file") MultipartFile file) throws IOException {
    return new FileUploadResponse(storageService.storeCover(file));
  }
}
