package com.optionlens.service;

import com.optionlens.options.model.OptionLeg;
import com.optionlens.options.model.OptionType;
import com.optionlens.options.model.PositionSide;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Service
public class PayoffCalculator {

    public BigDecimal calculateLegProfitLoss(
            OptionLeg leg,
            BigDecimal underlyingPriceAtExpiration) {

        Objects.requireNonNull(leg, "Option leg is required");
        Objects.requireNonNull(
                underlyingPriceAtExpiration,
                "Underlying price is required");

        if (underlyingPriceAtExpiration.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Underlying price cannot be negative");
        }

        BigDecimal intrinsicValue;

        if (leg.type() == OptionType.CALL) {
            intrinsicValue = underlyingPriceAtExpiration
                    .subtract(leg.strike())
                    .max(BigDecimal.ZERO);
        } else {
            intrinsicValue = leg.strike()
                    .subtract(underlyingPriceAtExpiration)
                    .max(BigDecimal.ZERO);
        }

        BigDecimal profitPerUnit;

        if (leg.side() == PositionSide.LONG) {
            profitPerUnit = intrinsicValue.subtract(leg.premium());
        } else {
            profitPerUnit = leg.premium().subtract(intrinsicValue);
        }

        return profitPerUnit
                .multiply(BigDecimal.valueOf(leg.quantity()))
                .multiply(leg.multiplier());
    }

    public BigDecimal calculateStrategyProfitLoss(
            List<OptionLeg> legs,
            BigDecimal underlyingPriceAtExpiration) {

        Objects.requireNonNull(legs, "Option legs are required");
        Objects.requireNonNull(
                underlyingPriceAtExpiration,
                "Underlying price is required");

        if (legs.isEmpty()) {
            throw new IllegalArgumentException(
                    "Strategy must contain at least one option leg");
        }

        BigDecimal totalProfitLoss = BigDecimal.ZERO;

        for (OptionLeg leg : legs) {
            totalProfitLoss = totalProfitLoss.add(
                    calculateLegProfitLoss(
                            leg,
                            underlyingPriceAtExpiration));
        }

        return totalProfitLoss;
    }
}
