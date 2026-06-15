package com.investedu.platform.dto;

import jakarta.validation.constraints.NotBlank;

public record AssetUpsertRequest(
    String id,
    @NotBlank String title,
    @NotBlank String cat,
    String question,
    String summary,
    String risk,
    String cover,
    String scene,
    String updated,
    String audience,
    String useWhen,
    String talkTip,
    Long downloads
) {
}
