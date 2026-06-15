package com.investedu.platform.storage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LocalStorageService {
  private final Path root;

  public LocalStorageService(@Value("${content.storage.root:storage}") String storageRoot) {
    this.root = Paths.get(storageRoot).toAbsolutePath().normalize();
  }

  public Path root() {
    return root;
  }

  public Path resolveFromPublicUrl(String publicUrl) {
    if (publicUrl == null || !publicUrl.startsWith("/api/v1/storage/")) {
      return null;
    }
    String relative = publicUrl.replaceFirst("^/api/v1/storage/", "");
    Path file = root.resolve(relative).normalize();
    if (!file.startsWith(root)) {
      return null;
    }
    return file;
  }

  public boolean exists(Path file) {
    return file != null && Files.exists(file) && Files.isRegularFile(file);
  }

  public byte[] readAllBytes(Path file) throws IOException {
    return Files.readAllBytes(file);
  }

  public String storeCover(MultipartFile file) throws IOException {
    if (file == null || file.isEmpty()) {
      throw new IOException("上传文件不能为空");
    }
    Files.createDirectories(root.resolve("covers"));
    String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
    String ext = original.toLowerCase().endsWith(".jpg") || original.toLowerCase().endsWith(".jpeg") ? ".jpg" : ".png";
    String filename = "custom-" + UUID.randomUUID() + ext;
    Path target = root.resolve("covers").resolve(filename).normalize();
    if (!target.startsWith(root.resolve("covers").normalize())) {
      throw new IOException("Invalid file path");
    }
    file.transferTo(target);
    return "/api/v1/storage/covers/" + filename;
  }
}
