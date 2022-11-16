import { PrivateKey, G2Element, ModuleInstance } from "@chiamine/bls-signatures";
import { Bytes } from "clvm";
import { CoinSpend, PartialSpendBundle, SpendBundle, UnsignedSpendBundle } from "../spendbundle";
import { DEFAULT_HIDDEN_PUZZLE_HASH } from "../coin/consts";
import { Hex, prefix0x, unprefix0x } from "../coin/condition";
import puzzle, { ConditionEntity, PuzzlePrivateKey } from "../crypto/puzzle";
import { TokenPuzzlePrivateKey } from "../crypto/receive";
import { ConditionOpcode } from "../coin/opcode";
import { getCoinNameHex, NetworkContext } from "../coin/coinUtility";
import { Instance } from "../util/instance";
import { calculate_synthetic_secret_key } from "../crypto/sign";

export async function signSpendBundle(ubundle: SpendBundle | UnsignedSpendBundle | CoinSpend[],
  puzzles: TokenPuzzlePrivateKey[],
  chainId: string | NetworkContext,
  allSignCheck = false,
): Promise<SpendBundle> {
  const BLS = Instance.BLS;
  if (!BLS) throw new Error("BLS not initialized");

  chainId = typeof chainId === "string" ? chainId : chainId.chainId;

  const bundle: UnsignedSpendBundle | SpendBundle = Array.isArray(ubundle) ? new UnsignedSpendBundle(ubundle) : ubundle;
  let agg_sig = await getSignaturesFromSpendBundle(bundle, puzzles, chainId, allSignCheck);

  if ("aggregated_signature" in bundle && (bundle as SpendBundle).aggregated_signature)
    agg_sig = BLS.AugSchemeMPL.aggregate([
      agg_sig,
      BLS.G2Element.from_bytes(Bytes.from(unprefix0x((bundle as SpendBundle).aggregated_signature), "hex").raw()),
    ]);
  const sig = Bytes.from(agg_sig.serialize()).hex();
  return {
    aggregated_signature: prefix0x(sig),
    coin_spends: bundle.coin_spends,
  }
}

async function getSignaturesFromSpendBundle(
  ubundle: UnsignedSpendBundle | SpendBundle | PartialSpendBundle,
  puzzles: TokenPuzzlePrivateKey[],
  chainId: string,
  allSignCheck = false,
): Promise<G2Element> {
  const BLS = Instance.BLS;
  if (!BLS) throw new Error("BLS not initialized");
  const puzzleDict: { [key: string]: PuzzlePrivateKey } = Object.assign({}, ...puzzles.flatMap(_ => _.puzzles).map((x) => ({ [unprefix0x(x.synPubKey)]: x })));
  const getPuzDetail = (synPubKey: Hex): PuzzlePrivateKey | undefined => { return puzzleDict[synPubKey]; }

  const css = ubundle.coin_spends;
  const sigs: G2Element[] = [];
  for (let i = 0; i < css.length; i++) {
    const coin_spend = css[i];
    if (coin_spend.coin.parent_coin_info == "0x0000000000000000000000000000000000000000000000000000000000000000") continue;
    const result = await puzzle.executePuzzleHex(coin_spend.puzzle_reveal, coin_spend.solution);
    // TODO: if one coin spend contain more than one AGG_SIG_ME, not consider here
    const synPubKeyArgs = result.conditions.filter(_ => _.code == ConditionOpcode.AGG_SIG_ME)[0]?.args[0];
    const synPubKeyUint8 = Array.isArray(synPubKeyArgs) ? undefined : synPubKeyArgs;
    const synPubKey = !synPubKeyUint8 ? undefined : Bytes.from(synPubKeyUint8).hex();

    const puz = !synPubKey ? undefined : getPuzDetail(synPubKey);
    if (!puz && allSignCheck) throw new Error(`cannot find puzzle by synthetic public key ${synPubKey}`);

    const synthetic_sk = puz
      ? calculate_synthetic_secret_key(BLS, puz.privateKey, DEFAULT_HIDDEN_PUZZLE_HASH.raw())
      : undefined;

    const coinname = getCoinNameHex(coin_spend.coin);
    const signature = await signSolution(BLS, result.conditions, synthetic_sk, coinname, chainId, allSignCheck);
    sigs.push(signature);
  }

  const agg_sig = BLS.AugSchemeMPL.aggregate(sigs);
  return agg_sig;
}

async function signSolution(
  BLS: ModuleInstance,
  conds: ConditionEntity[],
  synthetic_sk: PrivateKey | undefined,
  coinname: Bytes,
  chainId: string,
  allSignCheck = false,
): Promise<G2Element> {
  const AGG_SIG_ME_ADDITIONAL_DATA = Bytes.from(chainId, "hex");
  const sigs: G2Element[] = [];

  for (let i = 0; i < conds.length; i++) {
    const cond = conds[i];
    if (cond.code == ConditionOpcode.AGG_SIG_UNSAFE) {
      throw new Error("not implement");
    }
    else if (cond.code == ConditionOpcode.AGG_SIG_ME) {
      if (!cond.args || cond.args.length != 2) throw new Error("wrong args");
      const args = cond.args as Uint8Array[];
      const msg = Uint8Array.from([...args[1], ...coinname.raw(), ...AGG_SIG_ME_ADDITIONAL_DATA.raw()]);
      const pk_hex = Bytes.from(args[0]).hex();
      if (!synthetic_sk && allSignCheck) throw new Error("synthetic_sk is required. maybe puzzle is not find.");
      if (!synthetic_sk) continue;

      const synthetic_pk_hex = Bytes.from(synthetic_sk.get_g1().serialize()).hex();
      if (pk_hex != synthetic_pk_hex) throw new Error("wrong args due to pk != synthetic_pk");
      const sig = BLS.AugSchemeMPL.sign(synthetic_sk, msg);
      sigs.push(sig);
    }
  }

  const agg_sig = BLS.AugSchemeMPL.aggregate(sigs);
  return agg_sig;
}