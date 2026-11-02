package com.optionlens.service;

import com.optionlens.options.dto.PayoffCurveRequest;
import com.optionlens.options.dto.PayoffCurveResponse;
import com.optionlens.options.model.OptionLeg;
import com.optionlens.options.model.OptionType;
import com.optionlens.options.model.PositionSide;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PayoffCurveServiceTest {

    private PayoffCurveService payoffCurveService;

    @BeforeEach
    void setUp() {
        payoffCurveService =
                new PayoffCurveService(new PayoffCalculator());
    }

    @Test
    void shouldGenerateCorrectBullCallSpreadCurve() {

        List<OptionLeg> legs = List.of(
                new OptionLeg(
                        OptionType.CALL,
                        PositionSide.LONG,
                        new BigDecimal("100"),
                        new BigDecimal("10"),
                        1,
                        new BigDecimal("100")
                ),
                new OptionLeg(
                        OptionType.CALL,
                        PositionSide.SHORT,
                        new BigDecimal("110"),
                        new BigDecimal("5"),
                        1,
                        new BigDecimal("100")
                )
        );

        PayoffCurveRequest request = new PayoffCurveRequest(
                legs,
                new BigDecimal("90"),
                new BigDecimal("120"),
                new BigDecimal("5")
        );

        PayoffCurveResponse response =
                payoffCurveService.generateCurve(request);

        assertEquals("success", response.status());
        assertEquals(7, response.points().size());

        assertEquals(
                new BigDecimal("-500"),
                response.points().get(0).profitLoss()
        );

        assertEquals(
                new BigDecimal("0"),
                response.points().get(3).profitLoss()
        );

        assertEquals(
                new BigDecimal("500"),
                response.points().get(6).profitLoss()
        );
    }

    @Test
    void shouldRejectCurveWithMoreThan1000Points() {

        PayoffCurveRequest request = new PayoffCurveRequest(
                List.of(
                        new OptionLeg(
                                OptionType.CALL,
                                PositionSide.LONG,
                                new BigDecimal("100"),
                                new BigDecimal("10"),
                                1,
                                new BigDecimal("100")
                        )
                ),
                BigDecimal.ZERO,
                new BigDecimal("1000"),
                BigDecimal.ONE
        );

        assertThrows(
                IllegalArgumentException.class,
                () -> payoffCurveService.generateCurve(request)
        );
    }
}
