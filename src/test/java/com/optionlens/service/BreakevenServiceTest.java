package com.optionlens.service;

import com.optionlens.options.dto.BreakevenResponse;
import com.optionlens.options.model.OptionLeg;
import com.optionlens.options.model.OptionType;
import com.optionlens.options.model.PositionSide;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class BreakevenServiceTest {

    private BreakevenService breakevenService;

    @BeforeEach
    void setUp() {
        breakevenService =
                new BreakevenService(new PayoffCalculator());
    }

    @Test
    void shouldCalculateBullCallSpreadBreakeven() {

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

        BreakevenResponse response =
                breakevenService.calculateBreakeven(legs);

        assertEquals("success", response.status());
        assertEquals(1, response.breakevenPrices().size());

        assertEquals(
                0,
                new BigDecimal("105").compareTo(
                        response.breakevenPrices().get(0))
        );
    }

    @Test
    void shouldRejectEmptyOptionLegs() {

        assertThrows(
                IllegalArgumentException.class,
                () -> breakevenService.calculateBreakeven(List.of())
        );
    }

    
@Test
void shouldCalculateLongCallBreakevenAboveStrike() {

    List<OptionLeg> legs = List.of(
            new OptionLeg(
                    OptionType.CALL,
                    PositionSide.LONG,
                    new BigDecimal("100"),
                    new BigDecimal("10"),
                    1,
                    new BigDecimal("100")
            )
    );

    BreakevenResponse response =
            breakevenService.calculateBreakeven(legs);

    assertEquals(1, response.breakevenPrices().size());

    assertEquals(
            0,
            new BigDecimal("110").compareTo(
                    response.breakevenPrices().get(0))
    );
}

@Test
void shouldCalculateLongPutBreakevenBelowStrike() {

    List<OptionLeg> legs = List.of(
            new OptionLeg(
                    OptionType.PUT,
                    PositionSide.LONG,
                    new BigDecimal("100"),
                    new BigDecimal("10"),
                    1,
                    new BigDecimal("100")
            )
    );

    BreakevenResponse response =
            breakevenService.calculateBreakeven(legs);

    assertEquals(1, response.breakevenPrices().size());

    assertEquals(
            0,
            new BigDecimal("90").compareTo(
                    response.breakevenPrices().get(0))
    );
}

    @Test
    void shouldCalculateTwoBreakevenPricesForLongCallButterfly() {

        List<OptionLeg> legs = List.of(
                new OptionLeg(
                        OptionType.CALL,
                        PositionSide.LONG,
                        new BigDecimal("90"),
                        new BigDecimal("15"),
                        1,
                        new BigDecimal("100")
                ),
                new OptionLeg(
                        OptionType.CALL,
                        PositionSide.SHORT,
                        new BigDecimal("100"),
                        new BigDecimal("8"),
                        2,
                        new BigDecimal("100")
                ),
                new OptionLeg(
                        OptionType.CALL,
                        PositionSide.LONG,
                        new BigDecimal("110"),
                        new BigDecimal("4"),
                        1,
                        new BigDecimal("100")
                )
        );

        BreakevenResponse response =
                breakevenService.calculateBreakeven(legs);

        assertEquals("success", response.status());
        assertEquals(2, response.breakevenPrices().size());

        assertEquals(
                0,
                new BigDecimal("93").compareTo(
                        response.breakevenPrices().get(0))
        );

        assertEquals(
                0,
                new BigDecimal("107").compareTo(
                        response.breakevenPrices().get(1))
        );
    }


}
