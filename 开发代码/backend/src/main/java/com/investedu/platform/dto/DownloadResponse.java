package com.investedu.platform.dto;

public record DownloadResponse(
    String id,
    String type,
    String downloadUrl,
    long downloads
) {
}
