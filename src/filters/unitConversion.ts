import { OneTokenInfo } from "@/store/modules/account";
import bigDecimal from "js-big-decimal";
import { nameOmit } from "./nameConversion";

export function demojo(mojo: null | number | bigint, token: OneTokenInfo | null = null, digits = -1): string {
  let unit = "XCH";
  let decimal = 12;
  if (token != null && typeof token == "object") {
    unit = nameOmit(token.unit, true);
    decimal = token.decimal;
    digits = digits == -1 ? token.decimal : digits;
  }
  else {
    digits = digits == -1 ? 12 : digits;
  }

  if (!mojo) return "0.0 " + unit;
  const num = mojo.toString();
  const bnum = bigDecimal.divide(num, Math.pow(10, decimal), digits);
  const fnum = bnum.replace(/\.?0+$/, '');

  return fnum + " " + unit;
}

export default { demojo };