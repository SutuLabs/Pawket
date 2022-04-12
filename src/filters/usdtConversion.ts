import bigDecimal from "js-big-decimal";

export function xchToUsdt(mojo: null | number | bigint, rate = -1): string {
  const symbol = "$";
  const decimal = 12;
  if (rate == -1) {
    return "-1";
  }
  const digits = 2;

  if (!mojo || mojo < 0) return symbol + "0.00";
  const num = mojo.toString();
  const bnum = bigDecimal.divide(num, Math.pow(10, decimal), digits);
  const value = bigDecimal.multiply(bnum, rate);
  const fnum = bigDecimal.round(value, digits, bigDecimal.RoundingModes.HALF_UP);
  const pnum = bigDecimal.getPrettyValue(fnum, 3, ',');

  return symbol + pnum;
}

export default { xchToUsdt };
