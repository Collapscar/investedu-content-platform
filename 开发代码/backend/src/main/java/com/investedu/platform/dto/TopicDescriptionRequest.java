package com.investedu.platform.dto;

import java.util.List;

public record TopicDescriptionRequest(
    String name,
    String channel,
    String scene,
    String sceneGroup,
    String audience,
    String goal,
    String tagline,
    String combineReason,
    String sendMode,
    String sendOrder,
    String talkBoundary,
    List<TopicAssetSummary> assets
) {
}
