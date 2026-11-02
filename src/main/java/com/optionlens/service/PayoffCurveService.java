package com.optionlens.service;

import com.optionlens.options.dto.PayoffPoint;
import com.optionlens.options.dto.PayoffCurveRequest;
import com.optionlens.options.dto.PayoffCurveResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class PayoffCurveService {

    private final PayoffCalculator payoffCalculator;

    public PayoffCurveService(PayoffCalculator payoffCalculator) {
        this.payoffCalculator = payoffCalculator;
    }

    public PayoffCurveResponse generateCurve(PayoffCurveRequest request) {

        BigDecimal minimum = request.minimumPrice();
        BigDecimal maximum = request.maximumPrice();
        BigDecimal step = request.priceStep();

        List<PayoffPoint> points = new ArrayList<>();

        BigDecimal price = minimum;

        while (price.compareTo(maximum) <= 0) {

            BigDecimal profitLoss =
                    payoffCalculator.calculateStrategyProfitLoss(
                            request.legs(), price);

            points.add(new PayoffPoint(price, profitLoss));

            if (points.size() > 1000) {
                throw new IllegalArgumentException(
                        "Payoff curve cannot contain more than 1000 points");
            }

            price = price.add(step);
        }

        return new PayoffCurveResponse("success", points);
    }
}