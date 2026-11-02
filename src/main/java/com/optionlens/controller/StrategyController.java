package com.optionlens.controller;

import com.optionlens.options.dto.StrategyRequest;
import com.optionlens.options.dto.StrategyResponse;
import com.optionlens.options.dto.PayoffCurveRequest;
import com.optionlens.options.dto.PayoffCurveResponse;
import com.optionlens.options.dto.BreakevenResponse;

import com.optionlens.service.PayoffCalculator;
import com.optionlens.service.PayoffCurveService;
import com.optionlens.service.BreakevenService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/strategies")
public class StrategyController {

    private final PayoffCalculator payoffCalculator;
    private final PayoffCurveService payoffCurveService;
    private final BreakevenService breakevenService;

    public StrategyController(
            PayoffCalculator payoffCalculator,
            PayoffCurveService payoffCurveService,
            BreakevenService breakevenService) {

        this.payoffCalculator = payoffCalculator;
        this.payoffCurveService = payoffCurveService;
        this.breakevenService = breakevenService;
    }

    @PostMapping("/calculate")
    public ResponseEntity<StrategyResponse> calculateStrategy(
            @Valid @RequestBody StrategyRequest request) {

        BigDecimal totalProfitLoss =
                payoffCalculator.calculateStrategyProfitLoss(
                        request.legs(),
                        request.underlyingPriceAtExpiration());

        String message;

        if (totalProfitLoss.compareTo(BigDecimal.ZERO) > 0) {
            message = "The strategy has a positive profit at expiration.";
        } else if (totalProfitLoss.compareTo(BigDecimal.ZERO) < 0) {
            message = "The strategy has a loss at expiration.";
        } else {
            message = "The strategy breaks even at expiration.";
        }

        StrategyResponse response = new StrategyResponse(
                "success",
                request.underlyingPriceAtExpiration(),
                totalProfitLoss,
                message);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/payoff-curve")
    public ResponseEntity<PayoffCurveResponse> generatePayoffCurve(
            @Valid @RequestBody PayoffCurveRequest request) {

        return ResponseEntity.ok(
                payoffCurveService.generateCurve(request));
    }

    @PostMapping("/breakeven")
    public ResponseEntity<BreakevenResponse> calculateBreakeven(
            @Valid @RequestBody StrategyRequest request) {

        return ResponseEntity.ok(
                breakevenService.calculateBreakeven(request.legs()));
    }
}
