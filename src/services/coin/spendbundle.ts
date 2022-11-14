import { SpendBundle } from "@/models/wallet";
import { chainId } from "@/store/modules/network";
import { Bytes } from "clvm";
import puzzle, { ExecuteResult } from "../crypto/puzzle";
import { sha256 } from "../offer/bundler";
import { Instance } from "../util/instance";
import { uncurryPuzzle, sexpAssemble, convertUncurriedPuzzle, getModsPath } from "./analyzer";
import { getCoinName0x } from "./coinUtility";
import { getNumber, unprefix0x } from "./condition";
import { modshex } from "./mods";
import { ConditionOpcode } from "./opcode";

export interface AnnouncementCoin {
  coinIndex: number;
  message: string;
}

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

type SignatureVerificationResult = "None" | "Verified" | "Failed" | "Empty";

interface SpendBundleCheckResult {
  puzzleAnnoCreates: AnnouncementCoin[];
  puzzleAnnoAsserted: AnnouncementCoin[];
  coinAnnoCreates: AnnouncementCoin[];
  coinAnnoAsserted: AnnouncementCoin[];

  coinAvailability: CoinAvailability[];
  coinMods: CoinModsInfo[];
  aggSigMessages: AggSigMessage[];

  createdCoins: { [key: string]: CoinIndexInfo };
  sigVerified: SignatureVerificationResult;
}

export async function checkSpendBundle(bundle: SpendBundle | undefined): Promise<SpendBundleCheckResult | undefined> {
  if (!bundle) return undefined;
  const puzzleAnnoCreates: AnnouncementCoin[] = [];
  const puzzleAnnoAsserted: AnnouncementCoin[] = [];
  const coinAnnoCreates: AnnouncementCoin[] = [];
  const coinAnnoAsserted: AnnouncementCoin[] = [];
  const coinAvailability: CoinAvailability[] = [];
  const coinsForAvail: CoinAvailability[] = [];
  const newCoins: CoinIndexInfo[] = [];
  const aggSigMessages: AggSigMessage[] = [];
  const coinMods: CoinModsInfo[] = [];
  const createdCoins: { [key: string]: CoinIndexInfo } = {};

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
          result = await puzzle.executePuzzleHex(modshex["settlement_payments"], cs.solution);
          ca.availability = "Settlement";
        } catch (err) {
          console.warn("error executing puzzle", err);
          ca.availability = "Unexecutable";
          continue;
        }
      }

      puzzleAnnoCreates.push(
        ...result.conditions
          .filter((_) => _.op == ConditionOpcode.CREATE_PUZZLE_ANNOUNCEMENT)
          .map((_) => ({ coinIndex: i, message: sha256(cs.coin.puzzle_hash, _.args[0]) }))
      );
      puzzleAnnoAsserted.push(
        ...result.conditions
          .filter((_) => _.op == ConditionOpcode.ASSERT_PUZZLE_ANNOUNCEMENT)
          .map((_) => ({ coinIndex: i, message: _.args[0] }))
      );
      coinAnnoCreates.push(
        ...result.conditions
          .filter((_) => _.op == ConditionOpcode.CREATE_COIN_ANNOUNCEMENT)
          .map((_) => ({ coinIndex: i, message: sha256(getCoinName0x(cs.coin), _.args[0]) }))
      );
      coinAnnoAsserted.push(
        ...result.conditions
          .filter((_) => _.op == ConditionOpcode.ASSERT_COIN_ANNOUNCEMENT)
          .map((_) => ({ coinIndex: i, message: _.args[0] }))
      );

      newCoins.push(
        ...result.conditions
          .filter((_) => _.op == ConditionOpcode.CREATE_COIN)
          .map((_) => ({
            coinIndex: ca.coinIndex,
            amount: getNumber(_.args[1]),
            coinName: getCoinName0x({ parent_coin_info: ca.coinName, puzzle_hash: _.args[0], amount: getNumber(_.args[1]) }),
          }))
      );
      aggSigMessages.push(
        ...result.conditions
          .filter((_) => _.op == ConditionOpcode.AGG_SIG_ME)
          .map((_) => ({ coinIndex: i, coinName: ca.coinName, publicKey: _.args[0], message: _.args[1] }))
      );
      aggSigMessages.push(
        ...result.conditions
          .filter((_) => _.op == ConditionOpcode.AGG_SIG_UNSAFE)
          .map((_) => ({ coinIndex: i, coinName: "", publicKey: _.args[0], message: _.args[1] }))
      );

      const uncPuzzle = await uncurryPuzzle(sexpAssemble(cs.puzzle_reveal), cs.puzzle_reveal);
      const decPuzzle = convertUncurriedPuzzle(uncPuzzle);
      const mods = getModsPath(decPuzzle);
      coinMods.push({ mods, coinIndex: i });
    }

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
    sigVerified = verifySig(bundle, aggSigMessages);
  } catch (error) {
    sigVerified = "Failed";
    console.warn("failed to verify signature", error);
  }

  return {
    puzzleAnnoCreates,
    puzzleAnnoAsserted,
    coinAnnoCreates,
    coinAnnoAsserted,
    coinAvailability,
    coinMods,
    aggSigMessages,
    createdCoins,
    sigVerified,
  }
}

export function verifySig(bundle: SpendBundle, aggSigMessages: AggSigMessage[]): SignatureVerificationResult {
  if (!bundle || !bundle.aggregated_signature) return "Empty";
  const BLS = Instance.BLS;
  if (!BLS) throw new Error("BLS not initialized");
  try {
    const AGG_SIG_ME_ADDITIONAL_DATA = getUint8ArrayFromHexString(chainId());
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
