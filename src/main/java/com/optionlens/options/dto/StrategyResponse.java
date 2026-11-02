package com.optionlens.options.dto;

import java.math.BigDecimal;

public record StrategyResponse(
        String status,
        BigDecimal underlyingPriceAtExpiration,
        BigDecimal totalProfitLoss,
        String message
) {
}
