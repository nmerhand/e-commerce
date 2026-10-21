export function toCents(amount: string) {
  const match = /^(\d+)\.(\d{2})$/.exec(amount);

  if (!match) {
    throw new Error("Expected a decimal amount with two fractional digits");
  }

  const cents = Number(match[1]) * 100 + Number(match[2]);

  if (!Number.isSafeInteger(cents)) {
    throw new Error("Amount exceeds the safe integer range");
  }

  return cents;
}

export function fromCents(cents: number) {
  if (!Number.isSafeInteger(cents)) {
    throw new Error("Amount exceeds the safe integer range");
  }

  const sign = cents < 0 ? "-" : "";
  const absoluteCents = Math.abs(cents);
  const whole = Math.floor(absoluteCents / 100);
  const fraction = String(absoluteCents % 100).padStart(2, "0");

  return `${sign}${whole}.${fraction}`;
}
