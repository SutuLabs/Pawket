import { CoinSpend, SpendBundle } from "./defs";
import { Bytes } from "clvm";
import puzzle, { ConditionArgs, ConditionEntity, ExecuteResult } from "../crypto/puzzle";
import { sha256 } from "../offer/bundler";
import { Instance } from "../util/instance";
import { uncurryPuzzle, sexpAssemble, convertUncurriedPuzzle, getModsPath } from "../coin/analyzer";
import { getCoinName0x } from "../coin/coinUtility";
import { getFirstLevelArg, getFirstLevelArgMsg, getNumber, Hex, Hex0x, unprefix0x } from "../coin/condition";
import { modshex } from "../coin/mods";
import { ConditionOpcode } from "../coin/opcode";
import { sha256tree } from "clvm_tools";

export interface AnnouncementCoin {
  coinIndex: number;
  message: string;
}

export type MessageMode = "coin" | "parent" | "puzzle" | "amount" | "parent-puzzle" | "parent-amount" | "puzzle-amount" | "none";

export interface MessageCoinBasic {
  coinIndex: number;
  mode: number;
  message: Hex0x;
  parent?: Hex0x;
  puzzle?: Hex0x;
  amount?: bigint;
}

export interface MessageCoin extends MessageCoinBasic {
  opponents: number[];
}

export interface MessageModeInfo {
  mode: MessageMode;
  arguments: { name: string; type: string }[];
  bits: string;
}

// ref: https://chialisp.com/conditions/#about-message-conditions-varargs-parameter
export const messageModeInfo: { [id: number]: MessageModeInfo } = {
  7: { mode: "coin" as MessageMode, arguments: [{ name: "parent", type: "Bytes32" }], bits: "111" },
  4: { mode: "parent" as MessageMode, arguments: [{ name: "parent", type: "Bytes32" }], bits: "100" },
  2: { mode: "puzzle" as MessageMode, arguments: [{ name: "puzzle", type: "Bytes32" }], bits: "010" },
  1: { mode: "amount" as MessageMode, arguments: [{ name: "amount", type: "Bytes32" }], bits: "001" },
  6: {
    mode: "parent-puzzle" as MessageMode,
    arguments: [
      { name: "parent", type: "Bytes32" },
      { name: "puzzle", type: "Bytes32" },
    ],
    bits: "110",
  },
  5: {
    mode: "parent-amount" as MessageMode,
    arguments: [
      { name: "parent", type: "Bytes32" },
      { name: "amount", type: "Bytes32" },
    ],
    bits: "101",
  },
  3: {
    mode: "puzzle-amount" as MessageMode,
    arguments: [
      { name: "puzzle", type: "Bytes32" },
      { name: "amount", type: "Bytes32" },
    ],
    bits: "011",
  },
  0: { mode: "none" as MessageMode, arguments: [], bits: "000" },
};

export interface CoinAvailability {
  coinName: string;
  coinIndex: number;
  availability: "Unknown" | "Unexecutable" | "Settlement" | "Available" | "Used" | "NotFound" | "Ephemeral";
  dependenceIndex?: number;
}

export interface AggSigMessage {
  coinName: string;
  coinIndex: number;
  publicKey: string;
  message: string;
}

export interface CoinIndexInfo {
  coinIndex: number;
  coinName: string;
  amount: bigint;
  nextIndex?: number;
  mods?: string;
}

interface CoinModsInfo {
  coinIndex: number;
  mods: string;
}

export interface CoinPuzzleInfo {
  coinName: string;
  coinIndex: number;
  puzzleHash: Hex;
  puzzleRevealHash: Hex;
}

type SignatureVerificationResult = "None" | "Verified" | "Failed" | "Empty";

interface SpendBundleCheckResult {
  puzzleAnnoCreates: AnnouncementCoin[];
  puzzleAnnoAsserted: AnnouncementCoin[];
  coinAnnoCreates: AnnouncementCoin[];
  coinAnnoAsserted: AnnouncementCoin[];

  coinMessageSend: MessageCoin[];
  coinMessageReceive: MessageCoin[];

  coinAvailability: CoinAvailability[];
  coinMods: CoinModsInfo[];
  aggSigMessages: AggSigMessage[];

  createdCoins: { [key: string]: CoinIndexInfo };
  sigVerified: SignatureVerificationResult;

  coinPuzzles: CoinPuzzleInfo[];

  fee: bigint;
}

export async function checkSpendBundle(
  bundle: SpendBundle | undefined,
  chainId: string
): Promise<SpendBundleCheckResult | undefined> {
  if (!bundle) return undefined;
  const puzzleAnnoCreates: AnnouncementCoin[] = [];
  const puzzleAnnoAsserted: AnnouncementCoin[] = [];
  const coinAnnoCreates: AnnouncementCoin[] = [];
  const coinAnnoAsserted: AnnouncementCoin[] = [];
  const coinMessageSend: MessageCoin[] = [];
  const coinMessageReceive: MessageCoin[] = [];
  const coinAvailability: CoinAvailability[] = [];
  const coinsForAvail: CoinAvailability[] = [];
  const newCoins: CoinIndexInfo[] = [];
  const aggSigMessages: AggSigMessage[] = [];
  const coinMods: CoinModsInfo[] = [];
  const createdCoins: { [key: string]: CoinIndexInfo } = {};
  const coinPuzzles: CoinPuzzleInfo[] = [];

  const msgsend: MessageCoinBasic[] = [];
  const msgrecv: MessageCoinBasic[] = [];
  try {
    for (let i = 0; i < bundle.coin_spends.length; i++) {
      const cs = bundle.coin_spends[i];
      const ca: CoinAvailability = { coinName: getCoinName0x(cs.coin), coinIndex: i, availability: "Unknown" };
      coinsForAvail.push(ca);
      let result: ExecuteResult | undefined = undefined;
      try {
        result = await puzzle.executePuzzleHex(cs.puzzle_reveal, cs.solution);
      } catch (err) {
        try {
          result = await puzzle.executePuzzleHex(modshex["settlement_payments_v1"], cs.solution);
          ca.availability = "Settlement";
        } catch (err) {
          console.warn("error executing puzzle", err);
          ca.availability = "Unexecutable";
          continue;
        }
      }

      puzzleAnnoCreates.push(
        ...result.conditions
          .filter((_) => _.code == ConditionOpcode.CREATE_PUZZLE_ANNOUNCEMENT)
          .map((_) => ({ coinIndex: i, message: sha256(cs.coin.puzzle_hash, getFirstLevelArg(_.args.at(0))) }))
      );
      puzzleAnnoAsserted.push(
        ...result.conditions
          .filter((_) => _.code == ConditionOpcode.ASSERT_PUZZLE_ANNOUNCEMENT)
          .map((_) => ({ coinIndex: i, message: getFirstLevelArgMsg(_.args.at(0)) }))
      );
      coinAnnoCreates.push(
        ...result.conditions
          .filter((_) => _.code == ConditionOpcode.CREATE_COIN_ANNOUNCEMENT)
          .map((_) => ({ coinIndex: i, message: sha256(getCoinName0x(cs.coin), getFirstLevelArg(_.args.at(0))) }))
      );
      coinAnnoAsserted.push(
        ...result.conditions
          .filter((_) => _.code == ConditionOpcode.ASSERT_COIN_ANNOUNCEMENT)
          .map((_) => ({ coinIndex: i, message: getFirstLevelArgMsg(_.args.at(0)) }))
      );
      msgsend.push(
        ...result.conditions.filter((_) => _.code == ConditionOpcode.SEND_MESSAGE).map((_) => createMessageCoin(i, _))
      );
      msgrecv.push(
        ...result.conditions.filter((_) => _.code == ConditionOpcode.RECEIVE_MESSAGE).map((_) => createMessageCoin(i, _))
      );

      newCoins.push(
        ...result.conditions
          .filter((_) => _.code == ConditionOpcode.CREATE_COIN)
          .map((_) => ({
            coinIndex: ca.coinIndex,
            amount: getNumber(getFirstLevelArgMsg(_.args.at(1))),
            coinName: getCoinName0x({
              parent_coin_info: ca.coinName,
              puzzle_hash: getFirstLevelArgMsg(_.args.at(0)),
              amount: getNumber(getFirstLevelArgMsg(_.args.at(1))),
            }),
          }))
      );
      aggSigMessages.push(
        ...result.conditions
          .filter((_) => _.code == ConditionOpcode.AGG_SIG_ME)
          .map((_) => ({
            coinIndex: i,
            coinName: ca.coinName,
            publicKey: getFirstLevelArgMsg(_.args.at(0)),
            message: getFirstLevelArgMsg(_.args.at(1)),
          }))
      );
      aggSigMessages.push(
        ...result.conditions
          .filter((_) => _.code == ConditionOpcode.AGG_SIG_UNSAFE)
          .map((_) => ({
            coinIndex: i,
            coinName: "",
            publicKey: getFirstLevelArgMsg(_.args.at(0)),
            message: getFirstLevelArgMsg(_.args.at(1)),
          }))
      );

      const uncPuzzle = await uncurryPuzzle(sexpAssemble(cs.puzzle_reveal), cs.puzzle_reveal);
      const decPuzzle = convertUncurriedPuzzle(uncPuzzle);
      const mods = getModsPath(decPuzzle);
      coinMods.push({ mods, coinIndex: i });

      coinPuzzles.push({
        coinIndex: i,
        coinName: ca.coinName,
        puzzleHash: unprefix0x(cs.coin.puzzle_hash),
        puzzleRevealHash: sha256tree(sexpAssemble(cs.puzzle_reveal)).hex(),
      });
    }

    const { send, receive } = mixMessageCoins(msgsend, msgrecv, bundle.coin_spends);
    coinMessageSend.push(...send);
    coinMessageReceive.push(...receive);

    newCoins.forEach((c) => {
      createdCoins[c.coinName] = c;
    });

    for (let i = 0; i < coinsForAvail.length; i++) {
      const ca = coinsForAvail[i];
      coinAvailability.push(ca);

      if (ca.availability == "Unexecutable" || ca.availability == "Settlement") continue;
      if (createdCoins[ca.coinName]) {
        createdCoins[ca.coinName].nextIndex = ca.coinIndex;
        ca.dependenceIndex = createdCoins[ca.coinName].coinIndex;
        ca.availability = "Ephemeral";
        continue;
      }
      // Process coin status in upper layer
      // debug
      //   .getCoinSolution(ca.coinName, rpcUrl())
      //   .then((resp) => {
      //     if (!resp.puzzle_reveal && !resp.solution) {
      //       ca.availability = "Available";
      //     } else {
      //       ca.availability = "Used";
      //     }
      //   })
      //   .catch(() => {
      //     ca.availability = "NotFound";
      //   });
    }
  } catch (err) {
    throw new Error("cannot check bundle: " + err);
  }

  let sigVerified: SignatureVerificationResult = "None";
  try {
    sigVerified = verifySig(bundle, aggSigMessages, chainId);
  } catch (error) {
    sigVerified = "Failed";
    console.warn("failed to verify signature", error);
  }

  const totalRemoval = bundle.coin_spends.reduce((pv, cv) => pv + BigInt(cv.coin.amount), 0n);
  const totalCreated = newCoins.reduce((pv, cv) => pv + cv.amount, 0n);
  const fee = totalRemoval - totalCreated;

  return {
    puzzleAnnoCreates,
    puzzleAnnoAsserted,
    coinAnnoCreates,
    coinAnnoAsserted,
    coinMessageSend,
    coinMessageReceive,
    coinAvailability,
    coinMods,
    aggSigMessages,
    createdCoins,
    sigVerified,
    coinPuzzles,
    fee,
  };
}

export function verifySig(bundle: SpendBundle, aggSigMessages: AggSigMessage[], chainId: string): SignatureVerificationResult {
  if (!bundle || !bundle.aggregated_signature) return "Empty";
  const BLS = Instance.BLS;
  if (!BLS) throw new Error("BLS not initialized");
  try {
    const AGG_SIG_ME_ADDITIONAL_DATA = getUint8ArrayFromHexString(chainId);
    const msgs = aggSigMessages.map((_) =>
      _.coinName
        ? Uint8Array.from([
            ...getUint8ArrayFromHexString(_.message),
            ...getUint8ArrayFromHexString(_.coinName),
            ...AGG_SIG_ME_ADDITIONAL_DATA,
          ])
        : getUint8ArrayFromHexString(_.message)
    );
    const pks = aggSigMessages.map((_) => BLS.G1Element.from_bytes(getUint8ArrayFromHexString(_.publicKey)));
    const aggsig = BLS.G2Element.from_bytes(getUint8ArrayFromHexString(bundle.aggregated_signature));
    const sigVerified: SignatureVerificationResult = BLS.AugSchemeMPL.aggregate_verify(pks, msgs, aggsig) ? "Verified" : "Failed";
    return sigVerified;
  } catch (err) {
    throw new Error("cannot verify sig: " + err);
  }
}

export function getUint8ArrayFromHexString(hex: string): Uint8Array {
  return Bytes.from(unprefix0x(hex), "hex").raw();
}

export async function assertSpendbundle(
  bundle: SpendBundle,
  chainId: string,
  fee: bigint | undefined = undefined
): Promise<void> {
  const result = await checkSpendBundle(bundle, chainId);
  if (!result) throw new Error("Failed to check bundle");
  if (fee && result.fee != fee) throw new Error(`Fee expected ${fee}, but actual is ${result.fee}`);
  assertSpendbundleCheckResult(result);
}

export function assertSpendbundleCheckResult(result: SpendBundleCheckResult): void {
  if (result.sigVerified != "Verified")
    throw new Error(`Spendbundle signature not pass the check: ${result.sigVerified}
  MSGs: (CoinName : PubKey : Message)
    ${result.aggSigMessages
      .map((_) => `[${String(_.coinIndex).padStart(2, " ")}]${_.coinName}:${_.publicKey}:${_.message}`)
      .join("\n    ")}
`);
  if (result.coinAvailability.some((_) => _.availability == "Unexecutable")) throw new Error("Unexecutable coin found");
  checkAnnouncement(result.coinAnnoAsserted, result.coinAnnoCreates, "coin");
  checkAnnouncement(result.puzzleAnnoAsserted, result.puzzleAnnoCreates, "puzzle");
  checkCoinPuzzles(result.coinPuzzles);
}

function checkAnnouncement(asserted: AnnouncementCoin[], creates: AnnouncementCoin[], type: string): void {
  const misAsserted = asserted.filter((a) => creates.every((c) => a.message != c.message));
  if (misAsserted.length > 0)
    throw new Error(`Some ${type} asserts are not fulfilled: ${misAsserted.map((_) => `${_.coinIndex}`).join(",")}
  Asserted: ${asserted.map((_) => `[${_.coinIndex}]${_.message}`).join(",")}
  Creates: ${creates.map((_) => `[${_.coinIndex}]${_.message}`).join(",")}`);
}

function checkCoinPuzzles(coinPuzzles: CoinPuzzleInfo[]) {
  const abnormals = coinPuzzles.filter((_) => _.puzzleHash != _.puzzleRevealHash);
  if (abnormals.length > 0)
    throw new Error(`Some coin puzzles are not fulfilled:
  ${abnormals.map((_) => `${_.coinIndex}: ${_.puzzleHash}!=${_.puzzleRevealHash}`).join("\n  ")}`);
}

export function getMessageMode(arg: string | ConditionArgs): { send: MessageModeInfo; receive: MessageModeInfo; mode: number } {
  const number = Number(getNumber(typeof arg === "string" ? arg : getFirstLevelArgMsg(arg)));
  const receiveBits = (number & 0b111000) >> 3;
  const sendBits = number & 0b111;
  return {
    send: messageModeInfo[sendBits],
    receive: messageModeInfo[receiveBits],
    mode: number,
  };
}

function createMessageCoin(coinIndex: number, condition: ConditionEntity): MessageCoinBasic {
  const { send, receive, mode } = getMessageMode(condition.args[0]);
  const selected = condition.code == ConditionOpcode.SEND_MESSAGE ? send : receive;
  const mapping = Object.fromEntries(selected.arguments.map((x, i) => [x.name, i + 2]));
  return {
    coinIndex,
    mode,
    message: getFirstLevelArgMsg(condition.args[1]),
    parent: mapping["parent"] ? getFirstLevelArgMsg(condition.args[mapping["parent"]]) : undefined,
    puzzle: mapping["puzzle"] ? getFirstLevelArgMsg(condition.args[mapping["puzzle"]]) : undefined,
    amount: mapping["amount"] ? getNumber(getFirstLevelArgMsg(condition.args[mapping["amount"]])) : undefined,
  };
}

function mixMessageCoins(
  sendIn: MessageCoinBasic[],
  receiveIn: MessageCoinBasic[],
  coins: CoinSpend[]
): { send: MessageCoin[]; receive: MessageCoin[] } {
  function processCoins(items: MessageCoinBasic[]): MessageCoin[] {
    return items.map((item) => {
      const opponents: number[] = [];
      for (let i = 0; i < coins.length; i++) {
        const c = coins[i];
        if (
          (item.puzzle === undefined || item.puzzle == c.coin.puzzle_hash) &&
          (item.amount === undefined || item.amount == c.coin.amount) &&
          (item.parent === undefined || item.parent == c.coin.parent_coin_info)
        ) {
          opponents.push(i);
        }
      }
      return Object.assign({ opponents }, item);
    });
  }

  return {
    send: processCoins(sendIn),
    receive: processCoins(receiveIn),
  };
}
