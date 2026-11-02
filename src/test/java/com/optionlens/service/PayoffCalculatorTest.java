package com.optionlens.service;

import com.optionlens.options.model.OptionLeg;
import com.optionlens.options.model.OptionType;
import com.optionlens.options.model.PositionSide;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PayoffCalculatorTest {

    private final PayoffCalculator calculator = new PayoffCalculator();

    private OptionLeg leg(
            OptionType type,
            PositionSide side,
            String strike,
            String premium,
            int quantity,
            String multiplier) {

        return new OptionLeg(
                type,
                side,
                new BigDecimal(strike),
                new BigDecimal(premium),
                quantity,
                new BigDecimal(multiplier));
    }

    @Test
    void longCallWithPositiveProfit() {
        OptionLeg call = leg(
                OptionType.CALL, PositionSide.LONG,
                "100", "10", 1, "1");

        BigDecimal result = calculator.calculateLegProfitLoss(
                call, new BigDecimal("125"));

        assertEquals(new BigDecimal("15"), result);
    }

    @Test
    void longCallExpiresOutOfTheMoney() {
        OptionLeg call = leg(
                OptionType.CALL, PositionSide.LONG,
                "100", "10", 1, "1");

        BigDecimal result = calculator.calculateLegProfitLoss(
                call, new BigDecimal("90"));

        assertEquals(new BigDecimal("-10"), result);
    }

    @Test
    void longPutWithPositiveProfit() {
        OptionLeg put = leg(
                OptionType.PUT, PositionSide.LONG,
                "100", "10", 1, "1");

        BigDecimal result = calculator.calculateLegProfitLoss(
                put, new BigDecimal("75"));

        assertEquals(new BigDecimal("15"), result);
    }

    @Test
    void shortCallProducesLossWhenPriceRisesAboveBreakEven() {
        OptionLeg call = leg(
                OptionType.CALL, PositionSide.SHORT,
                "100", "10", 1, "1");

        BigDecimal result = calculator.calculateLegProfitLoss(
                call, new BigDecimal("125"));

        assertEquals(new BigDecimal("-15"), result);
    }

    @Test
    void quantityAndMultiplierAreApplied() {
        OptionLeg call = leg(
                OptionType.CALL, PositionSide.LONG,
                "100", "10", 2, "100");

        BigDecimal result = calculator.calculateLegProfitLoss(
                call, new BigDecimal("125"));

        assertEquals(new BigDecimal("3000"), result);
    }

    @Test
    void negativeUnderlyingPriceIsRejected() {
        OptionLeg call = leg(
                OptionType.CALL, PositionSide.LONG,
                "100", "10", 1, "1");

        assertThrows(
                IllegalArgumentException.class,
                () -> calculator.calculateLegProfitLoss(
                        call, new BigDecimal("-1")));
    }

    @Test
    void strategyProfitLossCombinesMultipleLegs() {
        OptionLeg longCall = leg(
                OptionType.CALL, PositionSide.LONG,
                "100", "10", 1, "1");

        OptionLeg shortCall = leg(
                OptionType.CALL, PositionSide.SHORT,
                "120", "5", 1, "1");

        BigDecimal result = calculator.calculateStrategyProfitLoss(
                List.of(longCall, shortCall),
                new BigDecimal("125"));

        assertEquals(new BigDecimal("15"), result);
    }

    @Test
    void strategyProfitLossRejectsEmptyLegList() {
        assertThrows(
                IllegalArgumentException.class,
                () -> calculator.calculateStrategyProfitLoss(
                        List.of(),
                        new BigDecimal("100")));
    }
}
