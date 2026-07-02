package com.investedu.platform.dto;

import jakarta.validation.constraints.NotBlank;

public record CategoryUpsertRequest(
    @NotBlank String name,
    @NotBlank String coverageContent
) {
}
