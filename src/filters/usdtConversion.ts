import bigDecimal from "js-big-decimal";

export function xchToUsdt(mojo: null | number | bigint, rate = -1, digits = -1): string {
  const unit = "USDT";
  const decimal = 12;
  if (rate == -1) {
    return "-1 " + unit;
  }
  digits = digits == -1 ? 12 : digits;

  if (!mojo) return "0.0 " + unit;
  const num = mojo.toString();
  const bnum = bigDecimal.divide(num, Math.pow(10, decimal), digits);
  const value = bigDecimal.multiply(bnum, rate);
  const fnum = value.replace(/\.?0+$/, "");

  return fnum + " " + unit;
}

export default { xchToUsdt };
