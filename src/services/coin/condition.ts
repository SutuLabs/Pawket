import { Bytes, bigint_to_bytes } from "clvm";
import { ConditionOpcode } from "./opcode";

export class CoinConditions {
  public static CREATE_COIN(puzzlehash: string, amount: bigint): string[] {
    return [ConditionOpcode.CREATE_COIN.toString(), prefix0x(puzzlehash), formatAmount(amount)];
  }
  public static CREATE_COIN_Extend(puzzlehash: string, amount: bigint, memos: string[]): (string | string[])[] {
    return [...this.CREATE_COIN(puzzlehash, amount), ...((memos && memos.length > 0) ? [memos] : [])];
  }
  public static CREATE_COIN_ANNOUNCEMENT(message: string): string[] {
    return [ConditionOpcode.CREATE_COIN_ANNOUNCEMENT.toString(), message];
  }
  public static ASSERT_COIN_ANNOUNCEMENT(announcementId: string): string[] {
    return [ConditionOpcode.ASSERT_COIN_ANNOUNCEMENT.toString(), announcementId];
  }
}

export function prefix0x(str: string): string {
  return str.startsWith("0x") ? str : "0x" + str;
}

export function formatAmount(amount: bigint): string {
  return prefix0x(Bytes.from(bigint_to_bytes(amount, { signed: true })).hex());
}