package com.optionlens.options.model;

import java.math.BigDecimal;
import java.util.Objects;

public record OptionLeg(
        OptionType type,
        PositionSide side,
        BigDecimal strike,
        BigDecimal premium,
        int quantity,
        BigDecimal multiplier
) {
    public OptionLeg {
        Objects.requireNonNull(type, "Option type is required");
        Objects.requireNonNull(side, "Position side is required");
        Objects.requireNonNull(strike, "Strike price is required");
        Objects.requireNonNull(premium, "Premium is required");
        Objects.requireNonNull(multiplier, "Contract multiplier is required");

        if (strike.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Strike price must be positive");
        }

        if (premium.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Premium cannot be negative");
        }

        if (quantity <= 0) {
            throw new IllegalArgumentException(
                    "Quantity must be greater than zero");
        }

        if (multiplier.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Multiplier must be positive");
        }
    }
}
