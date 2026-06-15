package com.investedu.platform.dto;

import java.util.List;

public record TopicDto(
    String id,
    String name,
    String channel,
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
    long downloads
) {
}
