package com.optionlens.options.dto;

import java.util.List;

public record PayoffCurveResponse(
        String status,
        List<PayoffPoint> points
) {
}