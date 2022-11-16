import { Bytes, bigint_to_bytes } from "clvm";
import { ConditionOpcode } from "./opcode";
import { SExp } from "clvm";
import { disassemble } from "clvm_tools";
import { ConditionArgs } from "../crypto/puzzle";

export interface ConditionInfo {
  name: string;
  id: number;
  args: string;
  desc: string;
}

export type ConditionType = (string | string[])[];

export class CoinConditions {
  public static CREATE_COIN(puzzlehash: Hex0x, amount: bigint): ConditionType {
    return [ConditionOpcode.CREATE_COIN.toString(), puzzlehash, formatAmount(amount)];
  }
  public static CREATE_COIN_Extend(puzzlehash: Hex0x, amount: bigint, memos: string[]): ConditionType {
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

export type Hex = string;

export type Hex0x = "()" | `0x${string}`;

export function prefix0x(str: string): Hex0x {
  if (!str) return "()";
  if (str == "()") return str;
  return str.startsWith("0x") ? (str as Hex0x) : `0x${str}`;
}

export function unprefix0x(str: Hex0x | string | undefined): string {
  return str && str.startsWith("0x") ? str.substring(2) : (str ?? "");
}

export function skipFirstByte0x(str: string): Hex0x {
  return "0x" + (str.slice(str.startsWith("0x") ? 4 : 2)) as Hex0x;
}

export function formatAmount(amount: bigint): Hex0x {
  return prefix0x(Bytes.from(bigint_to_bytes(amount, { signed: true })).hex());
}

export function getNumber(str: string): bigint {
  try {
    if (str == "()") return 0n;
    if (str == "0x") return 0n;
    if (str == "") return 0n;
    if (str.startsWith("0x")) return BigInt(prefix0x(Bytes.from(str, "hex").hex()));
    else return BigInt(str);
  } catch {
    return -1n;
  }
}

export function toNumberString(number: bigint): string {
  if (!number) return "()";
  return disassemble(SExp.to(number));
}

export function getFirstLevelArg(args: ConditionArgs): Uint8Array {
  if (Array.isArray(args)) throw new Error("Unexpected array met in processing announcement.");
  if (!args) throw new Error("Unexpected empty arg met in processing announcement");
  return args;
}

export function getFirstLevelArgMsg(args: ConditionArgs): string {
  return prefix0x(Bytes.from(getFirstLevelArg(args)).hex());
}

export function getArgMsg(arg: ConditionArgs): string {
  if (!arg) return "";
  if (Array.isArray(arg)) {
    return `(${arg.map((_) => getArgMsg(_)).join(" ")})`;
  }
  return prefix0x(Bytes.from(arg).hex());
}

export const conditionInfos: ConditionInfo[] = [
  {
    name: "AGG_SIG_UNSAFE",
    id: 49,
    args: "(49 pubkey message)",
    desc: "This spend is only valid if the attached aggregated signature contains a signature from the given public key of the given message. This is labeled unsafe because if you sign a message once, any other coins you have that require that signature may potentially also be unlocked. It's probably better just to use AGG_SIG_ME because of the natural entropy introduced by the coin ID.",
  },
  {
    name: "AGG_SIG_ME",
    id: 50,
    args: "(50 pubkey message)",
    desc: "This spend is only valid if the attached aggregated signature contains a signature from the specified public key of that message concatenated with the coin's ID and the network's genesis challenge.",
  },
  {
    name: "CREATE_COIN",
    id: 51,
    args: "(51 puzzlehash amount)",
    desc: "If this spend is valid, then create a new coin with the given puzzlehash and amount.",
  },
  {
    name: "RESERVE_FEE",
    id: 52,
    args: "(52 amount)",
    desc: "This spend is only valid if there is unused value in this transaction greater than or equal to amount, which is explicitly to be used as the fee.",
  },
  {
    name: "CREATE_COIN_ANNOUNCEMENT",
    id: 60,
    args: "(60 message)",
    desc: "If this spend is valid, this creates an ephemeral announcement with an ID dependent on the coin that creates it. Other coins can then assert an announcement exists for inter-coin communication inside a block.",
  },
  {
    name: "ASSERT_COIN_ANNOUNCEMENT",
    id: 61,
    args: "(61 announcementID)",
    desc: "This spend is only valid if there was an announcement in this block matching the announcementID. The announcementID is the hash of the message that was announced concatenated with the coin ID of the coin that announced it announcementID == sha256(coinID + message).",
  },
  {
    name: "CREATE_PUZZLE_ANNOUNCEMENT",
    id: 62,
    args: "(62 message)",
    desc: "If this spend is valid, this creates an ephemeral announcement with an ID dependent on the puzzle that creates it. Other coins can then assert an announcement exists for inter-coin communication inside a block.",
  },
  {
    name: "ASSERT_PUZZLE_ANNOUNCEMENT",
    id: 63,
    args: "(63 announcementID)",
    desc: "This spend is only valid if there was an announcement in this block matching the announcementID. The announcementID is the message that was announced concatenated with the puzzle hash of the coin that announced it announcementID == sha256(puzzle_hash + message).",
  },
  {
    name: "ASSERT_MY_COIN_ID",
    id: 70,
    args: "(70 coinID)",
    desc: "This spend is only valid if the presented coin ID is exactly the same as the ID of the coin that contains this puzzle.",
  },
  {
    name: "ASSERT_MY_PARENT_ID",
    id: 71,
    args: "(71 parentID)",
    desc: "This spend is only valid if the presented parent coin info is exactly the same as the parent coin info of the coin that contains this puzzle.",
  },
  {
    name: "ASSERT_MY_PUZZLEHASH",
    id: 72,
    args: "(72 puzzlehash)",
    desc: "This spend is only valid if the presented puzzle hash is exactly the same as the puzzle hash of the coin that contains this puzzle.",
  },
  {
    name: "ASSERT_MY_AMOUNT",
    id: 73,
    args: "(73 amount)",
    desc: "This spend is only valid if the presented amount is exactly the same as the amount of the coin that contains this puzzle.",
  },
  {
    name: "ASSERT_SECONDS_RELATIVE",
    id: 80,
    args: "(80 seconds)",
    desc: "This spend is only valid if the given time has passed since this coin was created. The coin's creation time or\"birthday\" is defined by the timestamp of the previous block not the actual block in which it was created. Similarly, the previous block's timestamp is used as the current time when evaluating these time locks.",
  },
  {
    name: "ASSERT_SECONDS_ABSOLUTE",
    id: 81,
    args: "(81 time)",
    desc: "This spend is only valid if the timestamp on this block is greater than the specified timestamp. Again, the coin's birthday and the current time are defined by the timestamp of the previous block.",
  },
  {
    name: "ASSERT_HEIGHT_RELATIVE",
    id: 82,
    args: "(82 block_age)",
    desc: "This spend is only valid if the specified number of blocks have passed since this coin was created.",
  },
  {
    name: "ASSERT_HEIGHT_ABSOLUTE",
    id: 83,
    args: "(83 block_height)",
    desc: "This spend is only valid if the given block_height has been reached.",
  },
];

export const conditionDict: { [id: number]: ConditionInfo } = conditionInfos
  .reduce((arr, cur) => ({ ...arr, [cur.id]: cur }), {});