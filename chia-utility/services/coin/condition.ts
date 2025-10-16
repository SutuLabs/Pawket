import { ConditionOpcode } from "./opcode";
import { ConditionArgs } from "../crypto/puzzle";
import { Program, fromHex, toHex } from "chia-wallet-sdk-bundle";
import { assemble, disassemble } from "services/crypto/clvm";

export interface ConditionInfo {
  name: string;
  id: number;
  args: string;
  desc: string;
  arguments: {
    name: string;
    type: "Bytes32" | "Unsigned Int" | "PublicKey" | "Bytes" | "Any" | "Binary";
  }[];
}

export type ConditionType = (string | string[])[];

export class CoinConditions {
  public static CREATE_COIN(puzzlehash: Hex0x, amount: bigint): ConditionType {
    return [ConditionOpcode.CREATE_COIN.toString(), puzzlehash, formatAmount(amount)];
  }
  public static CREATE_COIN_Extend(puzzlehash: Hex0x, amount: bigint, memos: string[]): ConditionType {
    return [...this.CREATE_COIN(puzzlehash, amount), ...(memos && memos.length > 0 ? [memos] : [])];
  }
  public static CREATE_COIN_ANNOUNCEMENT(message: string): ConditionType {
    return [ConditionOpcode.CREATE_COIN_ANNOUNCEMENT.toString(), prefix0x(message)];
  }
  public static ASSERT_COIN_ANNOUNCEMENT(announcementId: string): ConditionType {
    return [ConditionOpcode.ASSERT_COIN_ANNOUNCEMENT.toString(), prefix0x(announcementId)];
  }
  public static ASSERT_PUZZLE_ANNOUNCEMENT(announcementId: string): ConditionType {
    return [ConditionOpcode.ASSERT_PUZZLE_ANNOUNCEMENT.toString(), prefix0x(announcementId)];
  }
  // `-10` is the change owner magic condition
  public static NFT_CHANGE_OWNER(didLauncherId?: Hex0x, didInnerPuzzleHash?: Hex0x): ConditionType {
    return ["-10", didLauncherId ?? "", "", didInnerPuzzleHash ?? ""];
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
  return str && str.startsWith("0x") ? str.substring(2) : str ?? "";
}

export function skipFirstByte0x(str: string): Hex0x {
  return ("0x" + str.slice(str.startsWith("0x") ? 4 : 2)) as Hex0x;
}

export function formatAmount(amount: bigint): Hex0x {
  return prefix0x(fromHex(bigint_to_bytes(amount, { signed: true })));
}

export function getNumber(str: string): bigint {
  try {
    if (str == "()") return 0n;
    if (str == "0x") return 0n;
    if (str == "") return 0n;
    if (str.startsWith("0x")) return BigInt(prefix0x(toHex(fromHex(str))));
    else return BigInt(str);
  } catch {
    return -1n;
  }
}

export function toNumberString(number: bigint): string {
  if (!number) return "()";
  return disassemble(assemble(number.toString()));
}

export function getFirstLevelArg(args: ConditionArgs): Uint8Array {
  if (Array.isArray(args)) throw new Error("Unexpected array met in processing announcement.");
  if (!args) throw new Error("Unexpected empty arg met in processing announcement");
  return args;
}

export function getFirstLevelArgMsg(args: ConditionArgs): Hex0x {
  return prefix0x(toHex(getFirstLevelArg(args)));
}

export function getArgMsg(arg: ConditionArgs): string {
  if (!arg) return "";
  if (Array.isArray(arg)) {
    return `(${arg.map((_) => getArgMsg(_)).join(" ")})`;
  }
  return prefix0x(toHex(arg));
}

export function conditionsToTextList(conditions: ConditionType[]): string {
  return conditions
    .map((_) => "(" + _.map((_) => (typeof _ === "object" ? "(" + _.join(" ") + ")" : _ ? _ : "()")).join(" ") + ")")
    .join(" ");
}

export const conditionInfos: ConditionInfo[] = [
  {
    name: "REMARK",
    id: 1,
    args: "(1)",
    arguments: [],
    desc: "This condition is always considered valid by the mempool. This condition has no parameters.",
  },
  {
    name: "AGG_SIG_PARENT",
    id: 43,
    args: "(43 public_key message)",
    arguments: [
      { name: "public_key", type: "PublicKey" },
      { name: "message", type: "Bytes" },
    ],
    desc: "(CHIP-0011) Verifies a signature for a given message which is concatenated with the parent coin id and domain string sha256(genesis_id + 43).",
  },
  {
    name: "AGG_SIG_PUZZLE",
    id: 44,
    args: "(44 public_key message)",
    arguments: [
      { name: "public_key", type: "PublicKey" },
      { name: "message", type: "Bytes" },
    ],
    desc: "(CHIP-0011) Verifies a signature for a given message which is concatenated with the puzzle hash and domain string sha256(genesis_id + 44).",
  },
  {
    name: "AGG_SIG_AMOUNT",
    id: 45,
    args: "(45 public_key message)",
    arguments: [
      { name: "public_key", type: "PublicKey" },
      { name: "message", type: "Bytes" },
    ],
    desc: "(CHIP-0011) Verifies a signature for a given message which is concatenated with the amount and domain string sha256(genesis_id + 45).",
  },
  {
    name: "AGG_SIG_PUZZLE_AMOUNT",
    id: 46,
    args: "(46 public_key message)",
    arguments: [
      { name: "public_key", type: "PublicKey" },
      { name: "message", type: "Bytes" },
    ],
    desc: "(CHIP-0011) Verifies a signature for a given message which is concatenated with the puzzle hash, amount and domain string sha256(genesis_id + 46).",
  },
  {
    name: "AGG_SIG_PARENT_AMOUNT",
    id: 47,
    args: "(47 public_key message)",
    arguments: [
      { name: "public_key", type: "PublicKey" },
      { name: "message", type: "Bytes" },
    ],
    desc: "(CHIP-0011) Verifies a signature for a given message which is concatenated with the parent coin id, amount and domain string sha256(genesis_id + 47).",
  },
  {
    name: "AGG_SIG_PARENT_PUZZLE",
    id: 48,
    args: "(48 public_key message)",
    arguments: [
      { name: "public_key", type: "PublicKey" },
      { name: "message", type: "Bytes" },
    ],
    desc: "(CHIP-0011) Verifies a signature for a given message which is concatenated with the parent coin id, puzzle hash and domain string sha256(genesis_id + 48).",
  },
  {
    name: "AGG_SIG_UNSAFE",
    id: 49,
    args: "(49 public_key message)",
    arguments: [
      { name: "public_key", type: "PublicKey" },
      { name: "message", type: "Bytes" },
    ],
    desc: "Verifies a signature for a given message. For security reasons, domain strings are not permitted at the end of AGG_SIG_UNSAFE messages.",
  },
  {
    name: "AGG_SIG_ME",
    id: 50,
    args: "(50 public_key message)",
    arguments: [
      { name: "public_key", type: "PublicKey" },
      { name: "message", type: "Bytes" },
    ],
    desc: "Verifies a signature for a given message which is concatenated with the coin id and domain string genesis_id. Recommended for requiring signatures as it prevents signature reuse.",
  },
  {
    name: "CREATE_COIN",
    id: 51,
    args: "(51 puzzle_hash amount (...memos)?)",
    arguments: [
      { name: "puzzle_hash", type: "Bytes32" },
      { name: "amount", type: "Unsigned Int" },
      { name: "memos", type: "Any" },
    ],
    desc: "Creates a new coin output with a given puzzle hash and amount. This coin is its parent. Optional memos parameter for additional data.",
  },
  {
    name: "RESERVE_FEE",
    id: 52,
    args: "(52 amount)",
    arguments: [{ name: "amount", type: "Unsigned Int" }],
    desc: "Requires that the total amount remaining in the transaction after all outputs have been created is no less than the reserved fee amount.",
  },
  {
    name: "CREATE_COIN_ANNOUNCEMENT",
    id: 60,
    args: "(60 message)",
    arguments: [{ name: "message", type: "Bytes" }],
    desc: "Creates an announcement of a given message, tied to this coin's id. No longer recommended, consider using SEND_MESSAGE instead.",
  },
  {
    name: "ASSERT_COIN_ANNOUNCEMENT",
    id: 61,
    args: "(61 announcementID)",
    arguments: [{ name: "announcementID", type: "Bytes32" }],
    desc: "Asserts an announcement with a given id, calculated as sha256(coin_id + message). No longer recommended, consider using RECEIVE_MESSAGE instead.",
  },
  {
    name: "CREATE_PUZZLE_ANNOUNCEMENT",
    id: 62,
    args: "(62 message)",
    arguments: [{ name: "message", type: "Bytes" }],
    desc: "Creates an announcement of a given message, tied to this coin's puzzle hash. No longer recommended, consider using SEND_MESSAGE instead.",
  },
  {
    name: "ASSERT_PUZZLE_ANNOUNCEMENT",
    id: 63,
    args: "(63 announcementID)",
    arguments: [{ name: "announcementID", type: "Bytes32" }],
    desc: "Asserts an announcement with a given id, calculated as sha256(puzzle_hash + message). No longer recommended, consider using RECEIVE_MESSAGE instead.",
  },
  {
    name: "ASSERT_CONCURRENT_SPEND",
    id: 64,
    args: "(64 coin_id)",
    arguments: [{ name: "coin_id", type: "Bytes32" }],
    desc: "(CHIP-0014) Asserts that this coin is spent within the same block as the spend of a given coin.",
  },
  {
    name: "ASSERT_CONCURRENT_PUZZLE",
    id: 65,
    args: "(65 puzzle_hash)",
    arguments: [{ name: "puzzle_hash", type: "Bytes32" }],
    desc: "Asserts that this coin is in the same block as the spend of another coin with a given puzzle hash.",
  },
  {
    name: "SEND_MESSAGE",
    id: 66,
    args: "(66 mode message ...)",
    arguments: [
      { name: "mode", type: "Binary" },
      { name: "message", type: "Bytes" },
    ],
    desc: "(CHIP-0025) Sends a message using the specified mode and parameters. Message must be received in same block and size <= 1024 bytes.",
  },
  {
    name: "RECEIVE_MESSAGE",
    id: 67,
    args: "(67 mode message ...)",
    arguments: [
      { name: "mode", type: "Binary" },
      { name: "message", type: "Bytes" },
    ],
    desc: "(CHIP-0025) Asserts that exactly one of the source coin issues exactly one corresponding SEND_MESSAGE condition.",
  },
  {
    name: "ASSERT_MY_COIN_ID",
    id: 70,
    args: "(70 coin_id)",
    arguments: [{ name: "coin_id", type: "Bytes32" }],
    desc: "Asserts that id of this coin matches a given value.",
  },
  {
    name: "ASSERT_MY_PARENT_ID",
    id: 71,
    args: "(71 parent_id)",
    arguments: [{ name: "parent_id", type: "Bytes32" }],
    desc: "Asserts that the parent id of this coin matches a given value.",
  },
  {
    name: "ASSERT_MY_PUZZLEHASH",
    id: 72,
    args: "(72 puzzle_hash)",
    arguments: [{ name: "puzzle_hash", type: "Bytes32" }],
    desc: "Asserts that the puzzle hash of this coin matches a given value.",
  },
  {
    name: "ASSERT_MY_AMOUNT",
    id: 73,
    args: "(73 amount)",
    arguments: [{ name: "amount", type: "Unsigned Int" }],
    desc: "Asserts that the amount of this coin matches a given value.",
  },
  {
    name: "ASSERT_MY_BIRTH_SECONDS",
    id: 74,
    args: "(74 seconds)",
    arguments: [{ name: "seconds", type: "Unsigned Int" }],
    desc: "(CHIP-0014) Asserts that this coin was created at a given timestamp.",
  },
  {
    name: "ASSERT_MY_BIRTH_HEIGHT",
    id: 75,
    args: "(75 block_height)",
    arguments: [{ name: "block_height", type: "Unsigned Int" }],
    desc: "(CHIP-0014) Asserts that this coin was created at a given block height.",
  },
  {
    name: "ASSERT_EPHEMERAL",
    id: 76,
    args: "(76)",
    arguments: [],
    desc: "(CHIP-0014) Asserts that this coin was created within the current block.",
  },
  {
    name: "ASSERT_SECONDS_RELATIVE",
    id: 80,
    args: "(80 seconds_passed)",
    arguments: [{ name: "seconds_passed", type: "Unsigned Int" }],
    desc: "Asserts that the previous transaction block was created at least a given number of seconds after this coin was created.",
  },
  {
    name: "ASSERT_SECONDS_ABSOLUTE",
    id: 81,
    args: "(81 seconds)",
    arguments: [{ name: "seconds", type: "Unsigned Int" }],
    desc: "Asserts that the previous transaction block was created at at least a given timestamp, in seconds.",
  },
  {
    name: "ASSERT_HEIGHT_RELATIVE",
    id: 82,
    args: "(82 block_height_passed)",
    arguments: [{ name: "block_height_passed", type: "Unsigned Int" }],
    desc: "Asserts that the previous transaction block was created at least a given number of blocks after this coin was created.",
  },
  {
    name: "ASSERT_HEIGHT_ABSOLUTE",
    id: 83,
    args: "(83 block_height)",
    arguments: [{ name: "block_height", type: "Unsigned Int" }],
    desc: "Asserts that the previous transaction block was created at at least a given height.",
  },
  {
    name: "ASSERT_BEFORE_SECONDS_RELATIVE",
    id: 84,
    args: "(84 seconds_passed)",
    arguments: [{ name: "seconds_passed", type: "Unsigned Int" }],
    desc: "(CHIP-0014) Asserts that the previous transaction block was created before a given number of seconds after this coin was created.",
  },
  {
    name: "ASSERT_BEFORE_SECONDS_ABSOLUTE",
    id: 85,
    args: "(85 seconds)",
    arguments: [{ name: "seconds", type: "Unsigned Int" }],
    desc: "(CHIP-0014) Asserts that the previous transaction block was created before a given timestamp, in seconds.",
  },
  {
    name: "ASSERT_BEFORE_HEIGHT_RELATIVE",
    id: 86,
    args: "(86 block_height_passed)",
    arguments: [{ name: "block_height_passed", type: "Unsigned Int" }],
    desc: "(CHIP-0014) Asserts that the previous transaction block was created before a given number of blocks after this coin was created.",
  },
  {
    name: "ASSERT_BEFORE_HEIGHT_ABSOLUTE",
    id: 87,
    args: "(87 block_height)",
    arguments: [{ name: "block_height", type: "Unsigned Int" }],
    desc: "(CHIP-0014) Asserts that the previous transaction block was created before a given height.",
  },
  {
    name: "SOFTFORK",
    id: 90,
    args: "(90 cost ...args)",
    arguments: [{ name: "cost", type: "Unsigned Int" }],
    desc: "(CHIP-0011) Allows future conditions with non-zero CLVM costs to be added as soft forks. Cost is specified in ten-thousands.",
  },
];

export const conditionDict: { [id: number]: ConditionInfo } = conditionInfos.reduce(
  (arr, cur) => ({ ...arr, [cur.id]: cur }),
  {}
);
