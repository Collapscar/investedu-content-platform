package com.investedu.platform.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record TopicUpsertRequest(
    String id,
    @NotBlank String name,
    @NotBlank String channel,
    List<String> assetIds,
    String scene,
    String audience,
    String goal,
    String tagline,
    String updated,
    String url,
    String combineReason,
    String sendMode,
    String sendOrder,
    String talkBoundary,
    String coverId,
    String sceneGroup,
    Long downloads
) {
}
