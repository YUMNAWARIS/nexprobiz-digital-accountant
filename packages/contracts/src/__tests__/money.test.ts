import {
  add,
  allocate,
  applyRate,
  eq,
  isMoney,
  money,
  moneyFromDb,
  MoneyError,
  MoneySchema,
  mulQty,
  PositiveMoneySchema,
  qty,
  rate,
  sub,
  sum,
  toDecimal,
  ZERO,
} from '../money';

describe('money() construction', () => {
  it('normalizes to exactly 2dp with HALF_UP rounding', () => {
    expect(money('100')).toBe('100.00');
    expect(money('1.005')).toBe('1.01'); // HALF_UP, not banker's — JS toFixed would give 1.00
    expect(money('1.004')).toBe('1.00');
    expect(money('-0.005')).toBe('-0.01');
    expect(money(0.1 + 0.2)).toBe('0.30'); // float garbage is cleaned at the edge
  });
  it('rejects garbage', () => {
    expect(() => money('abc')).toThrow(MoneyError);
    expect(() => money('1,00')).toThrow(MoneyError); // German comma is a UI concern, not a wire format
    expect(() => money(NaN)).toThrow(MoneyError);
    expect(() => money(Infinity)).toThrow(MoneyError);
    expect(() => money('99999999999999.00')).toThrow(/NUMERIC\(15,2\)/);
  });
  it('isMoney only accepts the canonical shape', () => {
    expect(isMoney('119.00')).toBe(true);
    expect(isMoney('119')).toBe(false);
    expect(isMoney('119.000')).toBe(false);
    expect(isMoney(119)).toBe(false);
  });
  it('moneyFromDb normalizes an integer-looking NUMERIC result', () => {
    expect(moneyFromDb('119')).toBe('119.00');
    expect(moneyFromDb('119.00')).toBe('119.00');
    expect(() => moneyFromDb(null)).toThrow(MoneyError);
  });
});

describe('arithmetic is exact', () => {
  it('add/sub/sum never drift', () => {
    expect(add(money('0.10'), money('0.20'))).toBe('0.30');
    expect(sub(money('1.00'), money('0.90'))).toBe('0.10');
    // 0.1 + 0.2 + ... ten times in float = 0.9999999999999999
    expect(sum(Array.from({ length: 10 }, () => money('0.10')))).toBe('1.00');
    expect(sum([])).toBe(ZERO);
  });
  it('mulQty rounds once, HALF_UP', () => {
    expect(mulQty(money('80.00'), qty('10'))).toBe('800.00');
    expect(mulQty(money('19.99'), qty('3'))).toBe('59.97');
    expect(mulQty(money('0.10'), qty('3.3333'))).toBe('0.33');
    expect(mulQty(money('33.335'), qty('1'))).toBe('33.34');
  });
});

describe('VAT via applyRate — TEST-ACC-002 / 003 / 004', () => {
  it('19%: net 100 → tax 19 → gross 119', () => {
    const net = money('100');
    const tax = applyRate(net, rate('0.19'));
    expect(tax).toBe('19.00');
    expect(add(net, tax)).toBe('119.00');
  });
  it('7%: net 100 → tax 7 → gross 107', () => {
    const net = money('100');
    const tax = applyRate(net, rate('0.07'));
    expect(tax).toBe('7.00');
    expect(add(net, tax)).toBe('107.00');
  });
  it('§19 Kleinunternehmer: rate 0 → tax 0 → gross 100', () => {
    const net = money('100');
    const tax = applyRate(net, rate('0'));
    expect(tax).toBe('0.00');
    expect(add(net, tax)).toBe('100.00');
  });
  it('rounds HALF_UP at the cent', () => {
    expect(applyRate(money('10.05'), rate('0.19'))).toBe('1.91'); // 1.9095
    expect(applyRate(money('0.03'), rate('0.19'))).toBe('0.01'); // 0.0057
    expect(applyRate(money('0.02'), rate('0.19'))).toBe('0.00'); // 0.0038
  });
});

describe('allocate — largest remainder, zero drift', () => {
  it('sums exactly to the total', () => {
    const parts = allocate(money('19.00'), [money('33.33'), money('33.33'), money('33.34')]);
    expect(parts).toEqual(['6.33', '6.33', '6.34']);
    expect(sum(parts)).toBe('19.00');
  });
  it('handles the classic 1/3 split', () => {
    const parts = allocate(money('1.00'), [money('1'), money('1'), money('1')]);
    expect(parts).toEqual(['0.34', '0.33', '0.33']);
    expect(sum(parts)).toBe('1.00');
  });
  it('handles negative totals (reversals)', () => {
    const parts = allocate(money('-1.00'), [money('1'), money('1'), money('1')]);
    expect(sum(parts)).toBe('-1.00');
  });
  it('all-zero weights push everything to the first part', () => {
    expect(allocate(money('5.00'), [ZERO, ZERO])).toEqual(['5.00', '0.00']);
  });
  it('property: any allocation sums to its total', () => {
    for (let i = 0; i < 200; i++) {
      const total = money((Math.random() * 1000).toFixed(2));
      const weights = Array.from({ length: 1 + (i % 7) }, () =>
        money((Math.random() * 100).toFixed(2)),
      );
      const parts = allocate(total, weights);
      expect(eq(sum(parts), total)).toBe(true);
    }
  });
});

describe('group-VAT ≠ per-line-VAT — why we round per group', () => {
  it('per-line rounding drifts, per-group does not', () => {
    const nets = [money('0.03'), money('0.03'), money('0.03')];
    const perLine = sum(nets.map((n) => applyRate(n, rate('0.19')))); // 0.01 × 3
    const perGroup = applyRate(sum(nets), rate('0.19')); // 0.09 × 0.19 = 0.0171 → 0.02
    expect(perLine).toBe('0.03');
    expect(perGroup).toBe('0.02');
    expect(perLine).not.toBe(perGroup);
  });
});

describe('Zod edge', () => {
  it('MoneySchema parses and brands', () => {
    expect(MoneySchema.parse('12.5')).toBe('12.50');
    expect(MoneySchema.parse(' 12.50 ')).toBe('12.50');
    expect(MoneySchema.safeParse('12.505').success).toBe(false); // > 2dp is rejected, not rounded
    expect(MoneySchema.safeParse(12.5).success).toBe(false); // numbers are rejected
  });
  it('PositiveMoneySchema enforces > 0', () => {
    expect(PositiveMoneySchema.safeParse('0.00').success).toBe(false);
    expect(PositiveMoneySchema.safeParse('0.01').success).toBe(true);
  });
  it('toDecimal round-trips', () => {
    expect(toDecimal(money('119.00')).toString()).toBe('119');
  });
});
