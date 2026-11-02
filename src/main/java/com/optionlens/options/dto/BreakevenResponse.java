package com.optionlens.options.dto;

import java.math.BigDecimal;
import java.util.List;

public record BreakevenResponse(
        String status,
        List<BigDecimal> breakevenPrices,
        String message
) {}
