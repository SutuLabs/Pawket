import bigDecimal from "js-big-decimal";

export function xchToUsdt(mojo: null | number | bigint, rate = -1, digits = -1): string {
  const symbol = "$";
  const decimal = 12;
  if (rate == -1) {
    return "-1";
  }
  digits = digits == -1 ? 12 : digits;

  if (!mojo || mojo < 0) return symbol + "0.0";
  const num = mojo.toString();
  const bnum = bigDecimal.divide(num, Math.pow(10, decimal), digits);
  const value = bigDecimal.multiply(bnum, rate);
  const fnum = value.replace(/\.?0+$/, "");

  return symbol + fnum;
}

export default { xchToUsdt };
