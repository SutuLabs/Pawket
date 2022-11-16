import { CoinSpend, combineSpendBundle, OriginCoin, SpendBundle, UnsignedSpendBundle } from "../spendbundle";
import { disassemble } from "clvm_tools/clvm_tools/binutils";
import puzzle from "../crypto/puzzle";
import { TokenPuzzleObserver } from "../crypto/receive";
import transfer, { SymbolCoins, TransferTarget } from "../transfer/transfer";
import { prefix0x } from "./condition";
import { modshash, modshex, modsprog } from "./mods";
import { bytesToHex0x } from "../crypto/utility";
import { getCoinName0x, NetworkContext } from "./coinUtility";
import { constructSingletonTopLayerPuzzle, getNextCoinName0x, getPuzzleDetail, ParsedMetadata, parseMetadata, SingletonStructList } from "./singleton";
import { curryMod } from "../offer/bundler";
import { CannotParsePuzzle, expectModArgs, sexpAssemble, UncurriedPuzzle, uncurryPuzzle } from "./analyzer";
import { sha256tree } from "clvm_tools";

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
  coin: OriginCoin;
  nextCoinName?: string;
}

export async function generateMintDidBundle(
  targetAddress: string,
  changeAddress: string,
  fee: bigint,
  metadata: DidMetadata,
  availcoins: SymbolCoins,
  requests: TokenPuzzleObserver[],
  net: NetworkContext,
): Promise<UnsignedSpendBundle> {

  const amount = 1n; // always 1 mojo for 1 DID
  const tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(targetAddress));
  const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(changeAddress));
  const inner_p2_puzzle = getPuzzleDetail(tgt_hex, requests);

  /*
  1. BootstrapCoin: XCH Tx -> (XCH Change Tx . SgtLauncher Tx)
  2. LauncherCoin: SgtLauncher Tx -> Genesis DID Tx
  3. DIDCoin: Genesis DID Tx -> Concealed DID Tx
  */

  const bootstrapTgts: TransferTarget[] = [{ address: prefix0x(modshash["singleton_launcher"]), amount, symbol: net.symbol }];
  const bootstrapSpendPlan = transfer.generateSpendPlan(availcoins, bootstrapTgts, change_hex, fee, net.symbol);
  const bootstrapSpendBundle = await transfer.generateSpendBundleWithoutCat(bootstrapSpendPlan, requests, [], net);
  const bootstrapCoin = bootstrapSpendBundle.coin_spends[0].coin;// get the primary coin
  const bootstrapCoinId = getCoinName0x(bootstrapCoin);

  const launcherCoin: OriginCoin = {
    parent_coin_info: bootstrapCoinId,
    amount,
    puzzle_hash: prefix0x(modshash["singleton_launcher"]),
  };
  const launcherCoinId = getCoinName0x(launcherCoin);

  const didInnerPuzzle = await constructDidInnerPuzzle(inner_p2_puzzle.puzzle, "()", 0, launcherCoinId, "()");
  const didPuzzle = await constructSingletonTopLayerPuzzle(
    launcherCoinId,
    prefix0x(modshash["singleton_launcher"]),
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

  const didInnerPuzzleHash = prefix0x(await puzzle.getPuzzleHashFromPuzzle(didInnerPuzzle));
  // lineage_proof my_amount inner_puzzle(solution(p2_inner or metadata updater) my_amount)
  // const didSolution = `((${bootstrapCoinId} ${amount}) ${amount} ((() (q (51 ${tgt_hex} ${amount} (${tgt_hex}))) ()) ${amount} ()))`;
  const didSolution = `((${bootstrapCoinId} ${amount}) ${amount} (q (() (q (51 ${didInnerPuzzleHash} ${amount} (${prefix0x(inner_p2_puzzle.hash)}))) ())))`;


  const launcherCoinSpend: CoinSpend = {
    coin: launcherCoin,
    puzzle_reveal: prefix0x(modshex["singleton_launcher"]),
    solution: prefix0x(await puzzle.encodePuzzle(launcherSolution)),
  };

  const didCoinSpend: CoinSpend = {
    coin: didCoin,
    puzzle_reveal: prefix0x(await puzzle.encodePuzzle(didPuzzle)),
    solution: prefix0x(await puzzle.encodePuzzle(didSolution)),
  };

  const bundle = combineSpendBundle(bootstrapSpendBundle, [launcherCoinSpend, didCoinSpend]);
  return bundle;
}

async function constructDidInnerPuzzle(
  p2_inner_puzzle: string,
  recoveryDidListHash: string,
  numVerificationsRequired: number,
  launcherCoinId: string,
  metadata: string,
): Promise<string> {
  const sgnStruct = `(${prefix0x(modshash["singleton_top_layer_v1_1"])} ${prefix0x(launcherCoinId)} . ${prefix0x(modshash["singleton_launcher"])})`;
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
  puz: string | (UncurriedPuzzle | CannotParsePuzzle),
  hintPuzzle: string | undefined,
  coin: OriginCoin,
  solution_hex: string,
): Promise<DidCoinAnalysisResult | null> {
  // console.log(`const puzzle_reveal="${puzzle_reveal}";\nconst hintPuzzle="${hintPuzzle}";\nconst coinRecord=${JSON.stringify(coinRecord, null, 2)};`);
  const parsed_puzzle = (typeof puz === "string")
    ? await uncurryPuzzle(sexpAssemble(puz))
    : puz;

  if ("raw" in parsed_puzzle) return null;

  // singleton_top_layer_v1_1
  if (!expectModArgs(parsed_puzzle, "singleton_top_layer_v1_1", 2)) return null;
  const root_inner_puzzle = parsed_puzzle.args[1];
  const root_sgn_struct = parsed_puzzle.args[0];

  if ("raw" in root_inner_puzzle || !("raw" in root_sgn_struct)) return null;

  const sgnStructProg = sexpAssemble(root_sgn_struct.raw);
  const sgnStructlist: SingletonStructList = (sgnStructProg.as_javascript() as SingletonStructList)
  const singletonModHash = bytesToHex0x(sgnStructlist[0]);
  const launcherId = bytesToHex0x(sgnStructlist[1][0]);
  const launcherPuzzleHash = bytesToHex0x(sgnStructlist[1][1]);

  // did_innerpuz
  if (!expectModArgs(root_inner_puzzle, "did_innerpuz", 5)) return null;
  const p2InnerPuzzle_parse = root_inner_puzzle.args[0];
  const recovery_did_list_hash_parse = root_inner_puzzle.args[1];
  const num_verifications_requried_parse = root_inner_puzzle.args[2];
  const inner_singleton_struct_parse = root_inner_puzzle.args[3];
  const rawMetadata_parse = root_inner_puzzle.args[4];
  const didInnerPuzzleHash = sha256tree(root_inner_puzzle.sexp).hex()

  if ("raw" in p2InnerPuzzle_parse
    || !("raw" in recovery_did_list_hash_parse)
    || !("raw" in num_verifications_requried_parse)
    || !("raw" in inner_singleton_struct_parse)
    || !("raw" in rawMetadata_parse)
  ) return null;

  if (inner_singleton_struct_parse.raw != root_sgn_struct.raw)
    throw new Error("abnormal, SINGLETON_STRUCT is different in top_layer and did_innerpuz");

  const p2InnerPuzzle = disassemble(sexpAssemble(p2InnerPuzzle_parse.hex));
  hintPuzzle = hintPuzzle ? hintPuzzle : sha256tree(sexpAssemble(p2InnerPuzzle_parse.hex)).hex();
  const recovery_did_list_hash = disassemble(sexpAssemble(recovery_did_list_hash_parse.raw));
  const num_verifications_requried = disassemble(sexpAssemble(num_verifications_requried_parse.raw));
  const sexpMetadata = sexpAssemble(rawMetadata_parse.raw);
  const rawMetadata = disassemble(sexpMetadata);
  const metadata = rawMetadata == "()" ? {} : parseMetadata(sexpMetadata);

  const nextCoinName = await getNextCoinName0x(parsed_puzzle.hex, solution_hex, getCoinName0x(coin));

  if (!recovery_did_list_hash
    || !singletonModHash
    || !launcherId
    || !launcherPuzzleHash
    || !metadata
    || !recovery_did_list_hash
    || !didInnerPuzzleHash
    || !coin
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
    rawPuzzle: disassemble(sexpAssemble(parsed_puzzle.hex)),
    coin,
    nextCoinName,
  };
}
