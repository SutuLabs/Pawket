import { CurrencyType } from "@/services/exchange/currencyType";
import bigDecimal from "js-big-decimal";

const CurrencySymbol: Map<CurrencyType, string> = new Map<CurrencyType, string>([
  [CurrencyType.USDT, "$"],
  [CurrencyType.CNY, "¥"],
]);

export function xchToCurrency(mojo: null | number | bigint, rate = -1, currency: CurrencyType = CurrencyType.USDT): string {
  const symbol = CurrencySymbol.get(currency);
  const decimal = 12;
  if (rate == -1) {
    return "";
  }
  const digits = 2;

  if (!mojo || mojo < 0) return symbol + "0.00";
  const num = mojo.toString();
  const bnum = bigDecimal.divide(num, Math.pow(10, decimal), digits);
  const value = bigDecimal.multiply(bnum, rate);
  const fnum = bigDecimal.round(value, digits, bigDecimal.RoundingModes.HALF_UP);
  const pnum = bigDecimal.getPrettyValue(fnum, 3, ",");

  return symbol + pnum;
}

export default { xchToCurrency };
