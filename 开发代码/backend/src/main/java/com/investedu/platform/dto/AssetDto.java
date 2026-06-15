package com.investedu.platform.dto;

public record AssetDto(
    String id,
    String title,
    String cat,
    String question,
    String summary,
    String risk,
    String cover,
    String scene,
    String updated,
    String audience,
    String useWhen,
    String talkTip,
    long downloads
) {
}
