export type OptionType = "CALL" | "PUT";
export type PositionSide = "LONG" | "SHORT";

export interface StrategyLegRequest {
  type: OptionType;
  side: PositionSide;
  strike: number;
  premium: number;
  quantity: number;
  multiplier: number;
}

export interface StrategyCalculationRequest {
  legs: StrategyLegRequest[];
  underlyingPriceAtExpiration: number;
}

export async function calculateStrategy(
  request: StrategyCalculationRequest,
): Promise<unknown> {
  const response = await fetch("/api/strategies/calculate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(request),
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    let message = `Calculation failed (HTTP ${response.status})`;

    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
    ) {
      message = data.message;
    }

    throw new Error(message);
  }

  return data;
}
