package com.optionlens.options.dto;

import com.optionlens.options.model.OptionLeg;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;

public record PayoffCurveRequest(

        @NotEmpty(message = "At least one option leg is required")
        List<@NotNull @Valid OptionLeg> legs,

        @NotNull
        @DecimalMin("0.0")
        BigDecimal minimumPrice,

        @NotNull
        @DecimalMin("0.0")
        BigDecimal maximumPrice,

        @NotNull
        @Positive
        BigDecimal priceStep

) {
    public PayoffCurveRequest {
        if (minimumPrice != null && maximumPrice != null
                && minimumPrice.compareTo(maximumPrice) >= 0) {
            throw new IllegalArgumentException(
                    "Maximum price must be greater than minimum price");
        }

        if (priceStep != null && priceStep.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Price step must be positive");
        }
    }
}