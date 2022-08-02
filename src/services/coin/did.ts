import { CoinRecord, CoinSpend, convertToOriginCoin, OriginCoin, SpendBundle } from "@/models/wallet";
import { assemble } from "clvm_tools/clvm_tools/binutils";
import puzzle from "../crypto/puzzle";
import { TokenPuzzleDetail } from "../crypto/receive";
import { combineSpendBundlePure } from "../mint/cat";
import { internalUncurry } from "../offer/summary";
import transfer, { SymbolCoins, TransferTarget } from "../transfer/transfer";
import { prefix0x } from "./condition";
import { modsdict, modshash, modsprog, modspuz } from "./mods";
import { bytesToHex0x } from "../crypto/utility";
import { getCoinName0x } from "./coinUtility";
import { cloneAndChangeRequestPuzzleTemporary, constructSingletonTopLayerPuzzle, getPuzzleDetail, ParsedMetadata, parseMetadata, SingletonStructList } from "./singleton";
import { curryMod } from "../offer/bundler";

export interface MintDidInfo {
  spendBundle: SpendBundle;
}

export interface DidMetadata {
  [name: string]: string;
}

export interface DidCoinAnalysisResult {
  singletonModHash: string;
  launcherId: string;
  launcherPuzzleHash: string;
  didInnerPuzzleHash: string;
  p2InnerPuzzle: string;
  hintPuzzle: string;
  metadata: ParsedMetadata;
  rawMetadata: string;
  recovery_did_list_hash: string;
  num_verifications_requried: string;
  rawPuzzle: string;
  utxoCoin: OriginCoin;
}

export async function generateMintDidBundle(
  targetAddress: string,
  changeAddress: string,
  fee: bigint,
  metadata: DidMetadata,
  availcoins: SymbolCoins,
  requests: TokenPuzzleDetail[],
  baseSymbol: string,
  chainId: string,
): Promise<MintDidInfo> {
  const amount = 1n; // always 1 mojo for 1 DID
  const tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(targetAddress));
  const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(changeAddress));
  const inner_p2_puzzle = getPuzzleDetail(tgt_hex, requests);

  /*
  1. BootstrapCoin: XCH Tx -> (XCH Change Tx . SgtLauncher Tx)
  2. LauncherCoin: SgtLauncher Tx -> Genesis DID Tx
  3. DIDCoin: Genesis DID Tx -> Concealed DID Tx
  */

  const bootstrapTgts: TransferTarget[] = [{ address: await modshash("singleton_launcher"), amount, symbol: baseSymbol }];
  const bootstrapSpendPlan = transfer.generateSpendPlan(availcoins, bootstrapTgts, change_hex, fee, baseSymbol);
  const bootstrapSpendBundle = await transfer.generateSpendBundleWithoutCat(bootstrapSpendPlan, requests, [], baseSymbol, chainId);
  const bootstrapCoin = bootstrapSpendBundle.coin_spends[0].coin;// get the primary coin
  const bootstrapCoinId = getCoinName0x(bootstrapCoin);

  const launcherCoin: OriginCoin = {
    parent_coin_info: bootstrapCoinId,
    amount,
    puzzle_hash: await modshash("singleton_launcher"),
  };
  const launcherCoinId = getCoinName0x(launcherCoin);
  // console.log("launcherCoinId", launcherCoinId)

  const didInnerPuzzle = await constructDidInnerPuzzle(inner_p2_puzzle.puzzle, "()", 0, launcherCoinId, "()");
  const didPuzzle = await constructSingletonTopLayerPuzzle(
    launcherCoinId,
    await modshash("singleton_launcher"),
    // inner_p2_puzzle.puzzle
    didInnerPuzzle,
  );

  const didPuzzleHash = prefix0x(await puzzle.getPuzzleHashFromPuzzle(didPuzzle));
  const didCoin = {
    parent_coin_info: launcherCoinId,
    amount,
    puzzle_hash: didPuzzleHash,
  };

  const launcherSolution = `(${didPuzzleHash} ${amount} ())`;
  // console.log("launcherSolution", launcherSolution, inner_p2_puzzle)

  const didInnerPuzzleHash = prefix0x(await puzzle.getPuzzleHashFromPuzzle(didInnerPuzzle));
  // lineage_proof my_amount inner_puzzle(solution(p2_inner or metadata updater) my_amount)
  // const didSolution = `((${bootstrapCoinId} ${amount}) ${amount} ((() (q (51 ${tgt_hex} ${amount} (${tgt_hex}))) ()) ${amount} ()))`;
  const didSolution = `((${bootstrapCoinId} ${amount}) ${amount} (q (() (q (51 ${didInnerPuzzleHash} ${amount} (${prefix0x(inner_p2_puzzle.hash)}))) ())))`;


  const launcherCoinSpend: CoinSpend = {
    coin: launcherCoin,
    puzzle_reveal: await modspuz("singleton_launcher"),
    solution: prefix0x(await puzzle.encodePuzzle(launcherSolution)),
  };

  const didCoinSpend: CoinSpend = {
    coin: didCoin,
    puzzle_reveal: prefix0x(await puzzle.encodePuzzle(didPuzzle)),
    solution: prefix0x(await puzzle.encodePuzzle(didSolution)),
  };
  // console.log("didCoinSpend", didCoinSpend)

  const extreqs = cloneAndChangeRequestPuzzleTemporary(baseSymbol, requests, inner_p2_puzzle.hash, didPuzzle, didPuzzleHash);
  // console.log("extreqs", extreqs, { coin_spends: [launcherCoinSpend, didCoinSpend] }, chainId);

  const bundles = await transfer.getSpendBundle([launcherCoinSpend, didCoinSpend], extreqs, chainId);
  // console.log("bundles", bundles)
  const bundle = await combineSpendBundlePure(bootstrapSpendBundle, bundles);

  return {
    spendBundle: bundle,
  };
}

async function constructDidInnerPuzzle(
  p2_inner_puzzle: string,
  recoveryDidListHash: string,
  numVerificationsRequired: number,
  launcherCoinId: string,
  metadata: string,
): Promise<string> {
  const sgnStruct = `(${await modshash("singleton_top_layer_v1_1")} ${prefix0x(launcherCoinId)} . ${prefix0x(await modshash("singleton_launcher"))})`;
  if (numVerificationsRequired != 0) throw new Error("numVerificationsRequired only support 0");
  if (metadata != "()") throw new Error("metada only support ()");

  const curried_tail = await curryMod(
    modsprog["did_innerpuz"],
    p2_inner_puzzle,
    recoveryDidListHash,
    numVerificationsRequired == 0 ? "()" : "()",
    sgnStruct,
    metadata,
  );
  if (!curried_tail) throw new Error("failed to curry tail.");

  return curried_tail;
}

export async function analyzeDidCoin(
  puzzle_reveal: string,
  hintPuzzle: string,
  coinRecord: CoinRecord,
): Promise<DidCoinAnalysisResult | null> {
  const puz = await puzzle.disassemblePuzzle(puzzle_reveal);
  const { module, args } = await internalUncurry(puz);
  if (modsdict[module] != "singleton_top_layer_v1_1" || args.length != 2) return null;
  // console.log("args", args)

  const sgnStructlist: SingletonStructList = (assemble(args[0]).as_javascript() as SingletonStructList)

  const singletonModHash = bytesToHex0x(sgnStructlist[0]);
  const launcherId = bytesToHex0x(sgnStructlist[1][0]);
  const launcherPuzzleHash = bytesToHex0x(sgnStructlist[1][1]);
  const didInnerPuzzle = args[1];
  const didInnerPuzzleHash = await puzzle.getPuzzleHashFromPuzzle(didInnerPuzzle);

  const { module: smodule, args: sargs } = await internalUncurry(didInnerPuzzle);
  if (modsdict[smodule] != "did_innerpuz" || sargs.length != 5) return null;
  // console.log("sargs", sargs)

  const p2InnerPuzzle = sargs[0];
  const recovery_did_list_hash = sargs[1];
  const num_verifications_requried = sargs[2];
  const inner_singleton_struct: SingletonStructList = (assemble(sargs[3]).as_javascript() as SingletonStructList)
  const rawMetadata = sargs[4];
  const metadata = rawMetadata == "()" ? {} : parseMetadata(rawMetadata);

  if (!recovery_did_list_hash
    || !singletonModHash
    || !launcherId
    || !launcherPuzzleHash
    || !metadata
    || !inner_singleton_struct
    || !p2InnerPuzzle
    || !didInnerPuzzleHash
    || !coinRecord.coin
  ) return null;

  return {
    singletonModHash,
    launcherId,
    launcherPuzzleHash,
    recovery_did_list_hash,
    num_verifications_requried,
    metadata,
    rawMetadata,
    didInnerPuzzleHash,
    p2InnerPuzzle,
    hintPuzzle: prefix0x(hintPuzzle),
    rawPuzzle: puz,
    utxoCoin: convertToOriginCoin(coinRecord.coin),
  };
}
