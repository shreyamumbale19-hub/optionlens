package com.optionlens.options.dto;

import java.math.BigDecimal;

public record PayoffPoint(
        BigDecimal underlyingPrice,
        BigDecimal profitLoss
) {
}