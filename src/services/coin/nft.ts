import { CoinSpend, OriginCoin, SpendBundle } from "@/models/wallet";
import { xchSymbol } from "@/store/modules/network";
import puzzle, { PuzzleDetail } from "../crypto/puzzle";
import { TokenPuzzleDetail } from "../crypto/receive";
import { combineSpendBundlePure } from "../mint/cat";
import { curryMod } from "../offer/bundler";
import transfer, { SymbolCoins, TransferTarget } from "../transfer/transfer";
import { prefix0x } from "./condition";
import { modshash, modsprog, modspuz } from "./mods";

export interface MintNftInfo {
  spendBundle: SpendBundle;
}

export async function generateMintNftBundle(
  targetAddress: string,
  changeAddress: string,
  fee: bigint,
  metadata: { uri: string; hash: string },
  availcoins: SymbolCoins,
  requests: TokenPuzzleDetail[]
): Promise<MintNftInfo> {
  const amount = 1n; // always 1 mojo for 1 NFT
  const tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(targetAddress));
  const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(changeAddress));
  const inner_p2_puzzle = getPuzzleDetail(tgt_hex, requests);
  const baseSymbol = xchSymbol();

  /*
  1. BootstrapCoin: XCH Tx -> (XCH Change Tx . SgtLauncher Tx)
  2. LauncherCoin: SgtLauncher Tx -> Genesis NFT Tx
  3. NftCoin: Genesis NFT Tx -> Updater NFT Tx
  */

  const bootstrapTgts: TransferTarget[] = [{ address: await modshash("singleton_launcher"), amount, symbol: baseSymbol }];
  const bootstrapSpendPlan = transfer.generateSpendPlan(availcoins, bootstrapTgts, change_hex, fee);
  const bootstrapSpendBundle = await transfer.generateSpendBundle(bootstrapSpendPlan, requests, []);
  const bootstrapCoin = bootstrapSpendBundle.coin_spends[0].coin;// get the primary coin
  const bootstrapCoinId = getCoinName0x(bootstrapCoin);

  const launcherCoin: OriginCoin = {
    parent_coin_info: bootstrapCoinId,
    amount,
    puzzle_hash: await modshash("singleton_launcher"),
  };
  const launcherCoinId = getCoinName0x(launcherCoin);

  const nftPuzzle = await constructNftTopLayerPuzzle(
    launcherCoinId,
    await modshash("singleton_launcher"),
    await constructNftStatePuzzle(metadata, inner_p2_puzzle.puzzle)
  );

  const nftPuzzleHash = prefix0x(await puzzle.getPuzzleHashFromPuzzle(nftPuzzle));
  const nftCoin = {
    parent_coin_info: launcherCoinId,
    amount,
    puzzle_hash: nftPuzzleHash,
  };

  const launcherSolution = `(${nftPuzzleHash} ${amount} ())`;

  // lineage_proof delta inner(solution(p2_inner or metadata updater) my_amount)
  const nftSolution = `((${bootstrapCoinId} ${amount}) ${amount} ((() (q (51 ${tgt_hex} ${amount} (${tgt_hex}))) ()) ${amount} ()))`;

  const launcherCoinSpend: CoinSpend = {
    coin: launcherCoin,
    puzzle_reveal: await modspuz("singleton_launcher"),
    solution: prefix0x(await puzzle.encodePuzzle(launcherSolution)),
  };

  const nftCoinSpend: CoinSpend = {
    coin: nftCoin,
    puzzle_reveal: prefix0x(await puzzle.encodePuzzle(nftPuzzle)),
    solution: prefix0x(await puzzle.encodePuzzle(nftSolution)),
  };

  const extreqs = cloneAndChangeRequestPuzzleTemporary(baseSymbol, requests, inner_p2_puzzle.hash, nftPuzzle, nftPuzzleHash);

  const bundles = await transfer.getSpendBundle([launcherCoinSpend, nftCoinSpend], extreqs);
  const bundle = await combineSpendBundlePure(bootstrapSpendBundle, bundles);

  return {
    spendBundle: bundle,
  };
}

async function constructNftStatePuzzle(metadata: { uri: string; hash: string }, inner_p2_puzzle: string): Promise<string> {
  const md = `((117 "${metadata.uri.replaceAll('"', "")}") (104 . ${prefix0x(metadata.hash)}))`;
  const curried_tail = await curryMod(
    modsprog["nft_state_layer"],
    await modshash("nft_state_layer"),
    md,
    await modshash("nft_metadata_updater_default"),
    inner_p2_puzzle
  );
  if (!curried_tail) throw new Error("failed to curry tail.");

  return curried_tail;
}

async function constructNftTopLayerPuzzle(
  launcherId: string,
  launcherPuzzleHash: string,
  inner_state_puzzle: string
): Promise<string> {
  const sgnStruct = `(${await modshash("singleton_top_layer_v1_1")} ${prefix0x(launcherId)} . ${prefix0x(launcherPuzzleHash)})`;
  const curried_tail = await curryMod(modsprog["singleton_top_layer_v1_1"], sgnStruct, inner_state_puzzle);
  if (!curried_tail) throw new Error("failed to curry tail.");

  return curried_tail;
}

export function getCoinName0x(coin: OriginCoin): string {
  return prefix0x(transfer.getCoinName(coin).hex());
}

function getPuzzleDetail(
  tgt_hex: string,
  requests: TokenPuzzleDetail[]
): PuzzleDetail {

  const puzzleDict: { [key: string]: PuzzleDetail } = Object.assign({}, ...requests.flatMap((_) => _.puzzles).map((x) => ({ [prefix0x(x.hash)]: x })));
  const getPuzDetail = (hash: string) => {
    const puz = puzzleDict[hash];
    if (!puz) throw new Error("cannot find puzzle");
    return puz;
  };

  const inner_p2_puzzle = getPuzDetail(tgt_hex);
  return inner_p2_puzzle;
}


function cloneAndChangeRequestPuzzleTemporary(
  baseSymbol: string,
  requests: TokenPuzzleDetail[],
  originalHash: string,
  newPuzzle: string,
  newPuzzleHash: string,
): TokenPuzzleDetail[] {
  const extreqs = Array.from(requests.map((_) => ({ symbol: _.symbol, puzzles: Array.from(_.puzzles.map((_) => ({ ..._ }))) })));
  const nftReq = extreqs.find((_) => _.symbol == baseSymbol)?.puzzles.find((_) => originalHash == _.hash);
  if (!nftReq) throw new Error("cannot find inner puzzle hash");
  nftReq.puzzle = newPuzzle;
  nftReq.hash = newPuzzleHash;
  nftReq.address = "";
  return extreqs;
}