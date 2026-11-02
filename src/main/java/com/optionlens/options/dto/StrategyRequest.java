package com.optionlens.options.dto;

import com.optionlens.options.model.OptionLeg;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record StrategyRequest(

        @NotEmpty(message = "At least one option leg is required")
        List<@NotNull @Valid OptionLeg> legs,

        @NotNull(message = "Underlying price is required")
        @DecimalMin(
                value = "0.0",
                inclusive = true,
                message = "Underlying price cannot be negative")
        BigDecimal underlyingPriceAtExpiration

) {
}
