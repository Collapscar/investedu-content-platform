package com.investedu.platform.config;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
  @Value("${content.storage.root:storage}")
  private String storageRoot;

  @Value("${app.cors.allowed-origins:http://localhost:5173}")
  private String allowedOrigins;

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    Path root = Paths.get(storageRoot).toAbsolutePath().normalize();
    registry.addResourceHandler("/api/v1/storage/**")
        .addResourceLocations(root.toUri().toString() + "/");
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    String[] origins = Arrays.stream(allowedOrigins.split(","))
        .map(String::trim)
        .filter(value -> !value.isBlank())
        .toArray(String[]::new);

    registry.addMapping("/api/**")
        .allowedOrigins(origins)
        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .allowedHeaders("*")
        .exposedHeaders("Content-Disposition");
  }
}
