package com.investedu.platform.dto;

public record AssetDescriptionRequest(
    String title,
    String cat,
    String scene,
    String fileName,
    String cover,
    String question,
    String summary,
    String audience,
    String useWhen,
    String talkTip,
    String risk
) {
}
