import { CoinSpend, OriginCoin, SpendBundle } from "@/models/wallet";
import { assemble } from "clvm_tools/clvm_tools/binutils";
import debug from "../api/debug";
import puzzle, { PuzzleDetail } from "../crypto/puzzle";
import { TokenPuzzleDetail } from "../crypto/receive";
import { combineSpendBundlePure } from "../mint/cat";
import { curryMod } from "../offer/bundler";
import { internalUncurry } from "../offer/summary";
import transfer, { GetPuzzleApiCallback, SymbolCoins, TransferTarget } from "../transfer/transfer";
import { prefix0x } from "./condition";
import { modsdict, modshash, modsprog, modspuz } from "./mods";
import { Bytes } from "clvm";
import { bytesToHex0x } from "../crypto/utility";
import catBundle from "../transfer/catBundle";
import { getCoinName0x } from "./coinUtility";

export interface MintNftInfo {
  spendBundle: SpendBundle;
}

export interface NftMetadata {
  uri: string;
  hash: string;
}

export interface NftCoinAnalysisResult {
  singletonModHash: string;
  launcherId: string;
  launcherPuzzleHash: string;
  nftStateModHash: string;
  metadataUpdaterPuzzleHash: string;
  p2InnerPuzzle: string;
  hintPuzzle: string;
  metadata: NftMetadata;
}

export async function generateMintNftBundle(
  targetAddress: string,
  changeAddress: string,
  fee: bigint,
  metadata: NftMetadata,
  availcoins: SymbolCoins,
  requests: TokenPuzzleDetail[],
  baseSymbol: string,
  chainId: string,
): Promise<MintNftInfo> {
  const amount = 1n; // always 1 mojo for 1 NFT
  const tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(targetAddress));
  const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(changeAddress));
  const inner_p2_puzzle = getPuzzleDetail(tgt_hex, requests);

  /*
  1. BootstrapCoin: XCH Tx -> (XCH Change Tx . SgtLauncher Tx)
  2. LauncherCoin: SgtLauncher Tx -> Genesis NFT Tx
  3. NftCoin: Genesis NFT Tx -> Updater NFT Tx
  */

  const bootstrapTgts: TransferTarget[] = [{ address: await modshash("singleton_launcher"), amount, symbol: baseSymbol }];
  const bootstrapSpendPlan = transfer.generateSpendPlan(availcoins, bootstrapTgts, change_hex, fee, baseSymbol);
  const bootstrapSpendBundle = await transfer.generateSpendBundle(bootstrapSpendPlan, requests, [], baseSymbol, chainId);
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

  const bundles = await transfer.getSpendBundle([launcherCoinSpend, nftCoinSpend], extreqs, chainId);
  const bundle = await combineSpendBundlePure(bootstrapSpendBundle, bundles);

  return {
    spendBundle: bundle,
  };
}

export async function generateTransferNftBundle(
  targetAddress: string,
  changeAddress: string,
  fee: bigint,
  nftCoin: OriginCoin,
  analysis: NftCoinAnalysisResult,
  availcoins: SymbolCoins,
  requests: TokenPuzzleDetail[],
  baseSymbol: string,
  chainId: string,
  api: GetPuzzleApiCallback,
): Promise<SpendBundle> {

  const tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(targetAddress));
  const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(changeAddress));
  const inner_p2_puzzle = getPuzzleDetail(analysis.hintPuzzle, requests);

  const amount = 1n;
  const nftStatePuzzle = await constructNftStatePuzzle(analysis.metadata, inner_p2_puzzle.puzzle);
  const proof = await catBundle.getLineageProof(nftCoin.parent_coin_info, api, 2);

  const nftSolution = `((${proof.coinId} ${proof.proof} ${proof.amount}) ${amount} ((() (q (51 ${tgt_hex} ${amount} (${tgt_hex}))) ()) ${amount} ()))`;
  const nftPuzzle = await constructNftTopLayerPuzzle(
    analysis.launcherId,
    await modshash("singleton_launcher"),
    nftStatePuzzle
  );
  const nftPuzzleHash = prefix0x(await puzzle.getPuzzleHashFromPuzzle(nftPuzzle));
  if (nftPuzzleHash != nftCoin.puzzle_hash) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("failed to construct puzzle", nftPuzzle, nftCoin.puzzle_hash, nftPuzzleHash)
    }
    throw new Error("failed to construct puzzle, different hash encountered")
  }

  const nftCoinSpend: CoinSpend = {
    coin: nftCoin,
    puzzle_reveal: prefix0x(await puzzle.encodePuzzle(nftPuzzle)),
    solution: prefix0x(await puzzle.encodePuzzle(nftSolution)),
  };

  const extreqs = cloneAndChangeRequestPuzzleTemporary(baseSymbol, requests, inner_p2_puzzle.hash, nftPuzzle, nftPuzzleHash);

  const bundle = await transfer.getSpendBundle([nftCoinSpend], extreqs, chainId);


  if (fee > 0n) {
    // not tested so far
    // throw new Error("fee is not supported in transfer");
    const feeTgts: TransferTarget[] = [{ address: "0x0000000000000000000000000000000000000000000000000000000000000000", amount: 0n, symbol: baseSymbol }];
    const feeSpendPlan = transfer.generateSpendPlan(availcoins, feeTgts, change_hex, fee, baseSymbol);
    const feeSpendBundle = await transfer.generateSpendBundle(feeSpendPlan, requests, [], baseSymbol, chainId);
    const feeBundle = await combineSpendBundlePure(feeSpendBundle, bundle);

    return feeBundle;
  }

  return bundle;
}

export async function analyzeNftCoin(parent_coin_info: string, hintPuzzle: string, rpcUrl: string): Promise<NftCoinAnalysisResult | null> {
  const scoin = await debug.getCoinSolution(parent_coin_info, rpcUrl);
  const puz = await puzzle.disassemblePuzzle(scoin.puzzle_reveal);
  const { module, args } = await internalUncurry(puz);

  if (modsdict[module] != "singleton_top_layer_v1_1" || args.length != 2) return null;
  const { module: smodule, args: sargs } = await internalUncurry(args[1]);
  const sgnStructProg = assemble(args[0]);
  const sgnStructlist: [Bytes, [Bytes, Bytes]] = (sgnStructProg.as_javascript() as [Bytes, [Bytes, Bytes]])

  const singletonModHash = bytesToHex0x(sgnStructlist[0]);
  const launcherId = bytesToHex0x(sgnStructlist[1][0]);
  const launcherPuzzleHash = bytesToHex0x(sgnStructlist[1][1]);

  if (modsdict[smodule] != "nft_state_layer" || sargs.length != 4) return null;
  const nftStateModHash = sargs[0];
  const metadataUpdaterPuzzleHash = sargs[2];
  const p2InnerPuzzle = sargs[3];

  const rawmeta = sargs[1];
  const metaprog = assemble(rawmeta);
  const metalist: string[][] = (metaprog.as_javascript() as Bytes[][])
    .map(_ => Array.from(_))
    .map(_ => _.map(it => it.hex()));
  const hex2asc = function (hex: string | undefined): string | undefined {
    if (!hex) return hex;
    return Buffer.from(hex, "hex").toString();
  }

  const uri = hex2asc(metalist.find(_ => _[0] == "75")?.[1]);// 75_hex = 117_dec for u
  const hash = metalist.find(_ => _[0] == "68")?.[1];// 68_hex = 104_dec for h
  if (!uri
    || !hash
    || !singletonModHash
    || !launcherId
    || !launcherPuzzleHash
    || !nftStateModHash
    || !metadataUpdaterPuzzleHash
    || !p2InnerPuzzle
  ) return null;

  return {
    metadata: {
      uri,
      hash,
    },
    singletonModHash,
    launcherId,
    launcherPuzzleHash,
    nftStateModHash,
    metadataUpdaterPuzzleHash,
    p2InnerPuzzle,
    hintPuzzle: prefix0x(hintPuzzle),
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