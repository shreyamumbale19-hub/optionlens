package com.optionlens.service;

import com.optionlens.options.dto.BreakevenResponse;
import com.optionlens.options.model.OptionLeg;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.TreeSet;

@Service
public class BreakevenService {

    private static final int SCALE = 12;

    private final PayoffCalculator payoffCalculator;

    public BreakevenService(PayoffCalculator payoffCalculator) {
        this.payoffCalculator = payoffCalculator;
    }

    public BreakevenResponse calculateBreakeven(List<OptionLeg> legs) {

        if (legs == null || legs.isEmpty()) {
            throw new IllegalArgumentException(
                    "At least one option leg is required");
        }

        TreeSet<BigDecimal> strikes = new TreeSet<>();

        for (OptionLeg leg : legs) {
            if (leg == null) {
                throw new IllegalArgumentException(
                        "Option leg cannot be null");
            }
            strikes.add(leg.strike());
        }

        List<BigDecimal> prices = new ArrayList<>(strikes);
        TreeSet<BigDecimal> breakevenPrices = new TreeSet<>();

        // Check exact breakeven prices at strike points.
        for (BigDecimal price : prices) {

            BigDecimal pnl =
                    payoffCalculator.calculateStrategyProfitLoss(
                            legs, price);

            if (pnl.compareTo(BigDecimal.ZERO) == 0) {
                breakevenPrices.add(price);
            }
        }

        // Check intervals between consecutive strikes.
        for (int i = 0; i < prices.size() - 1; i++) {

            BigDecimal low = prices.get(i);
            BigDecimal high = prices.get(i + 1);

            BigDecimal lowPnl =
                    payoffCalculator.calculateStrategyProfitLoss(
                            legs, low);

            BigDecimal highPnl =
                    payoffCalculator.calculateStrategyProfitLoss(
                            legs, high);

            addRootIfCrossed(
                    low, high, lowPnl, highPnl, breakevenPrices);
        }

        // Check the interval below the lowest strike.
        BigDecimal lowestStrike = prices.get(0);

        BigDecimal pnlAtZero =
                payoffCalculator.calculateStrategyProfitLoss(
                        legs, BigDecimal.ZERO);

        BigDecimal pnlAtLowest =
                payoffCalculator.calculateStrategyProfitLoss(
                        legs, lowestStrike);

        addRootIfCrossed(
                BigDecimal.ZERO,
                lowestStrike,
                pnlAtZero,
                pnlAtLowest,
                breakevenPrices
        );

        // Check the unbounded interval above the highest strike.
        BigDecimal highestStrike =
                prices.get(prices.size() - 1);

        BigDecimal priceAbove =
                highestStrike.add(BigDecimal.ONE);

        BigDecimal pnlAtHighest =
                payoffCalculator.calculateStrategyProfitLoss(
                        legs, highestStrike);

        BigDecimal pnlAbove =
                payoffCalculator.calculateStrategyProfitLoss(
                        legs, priceAbove);

        BigDecimal slope = pnlAbove.subtract(pnlAtHighest);

        if (slope.compareTo(BigDecimal.ZERO) != 0) {

            BigDecimal distance = pnlAtHighest.negate()
                    .divide(slope, SCALE, RoundingMode.HALF_UP);

            BigDecimal breakeven =
                    highestStrike.add(distance);

            if (breakeven.compareTo(highestStrike) > 0) {
                breakevenPrices.add(breakeven);
            }
        }

        List<BigDecimal> result =
                new ArrayList<>(breakevenPrices);

        String message = result.isEmpty()
                ? "No breakeven price found."
                : "Breakeven prices calculated successfully.";

        return new BreakevenResponse(
                "success",
                result,
                message
        );
    }

    private void addRootIfCrossed(
            BigDecimal low,
            BigDecimal high,
            BigDecimal lowPnl,
            BigDecimal highPnl,
            TreeSet<BigDecimal> results) {

        if (lowPnl.signum() * highPnl.signum() < 0) {

            BigDecimal difference =
                    highPnl.subtract(lowPnl);

            BigDecimal fraction = lowPnl.negate()
                    .divide(difference, SCALE, RoundingMode.HALF_UP);

            BigDecimal breakeven = low.add(
                    high.subtract(low).multiply(fraction));

            results.add(breakeven);
        }
    }
}
