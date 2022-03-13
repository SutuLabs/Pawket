import { Bytes, bigint_to_bytes } from "clvm";
import { ConditionOpcode } from "./opcode";

export type ConditionType = (string | string[])[];

export class CoinConditions {
  public static CREATE_COIN(puzzlehash: string, amount: bigint): ConditionType {
    return [ConditionOpcode.CREATE_COIN.toString(), prefix0x(puzzlehash), formatAmount(amount)];
  }
  public static CREATE_COIN_Extend(puzzlehash: string, amount: bigint, memos: string[]): ConditionType {
    return [...this.CREATE_COIN(puzzlehash, amount), ...((memos && memos.length > 0) ? [memos] : [])];
  }
  public static CREATE_COIN_ANNOUNCEMENT(message: string): ConditionType {
    return [ConditionOpcode.CREATE_COIN_ANNOUNCEMENT.toString(), message];
  }
  public static ASSERT_COIN_ANNOUNCEMENT(announcementId: string): ConditionType {
    return [ConditionOpcode.ASSERT_COIN_ANNOUNCEMENT.toString(), announcementId];
  }
  public static ASSERT_PUZZLE_ANNOUNCEMENT(announcementId: string): ConditionType {
    return [ConditionOpcode.ASSERT_PUZZLE_ANNOUNCEMENT.toString(), announcementId];
  }
}

export function prefix0x(str: string): string {
  return str.startsWith("0x") ? str : "0x" + str;
}

export function formatAmount(amount: bigint): string {
  return prefix0x(Bytes.from(bigint_to_bytes(amount, { signed: true })).hex());
}