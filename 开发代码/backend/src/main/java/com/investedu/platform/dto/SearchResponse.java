package com.investedu.platform.dto;

import java.util.List;

public record SearchResponse(
    List<AssetDto> assets,
    List<TopicDto> topics
) {
}
