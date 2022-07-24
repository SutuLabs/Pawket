import { CoinSpend, OriginCoin, SpendBundle } from "@/models/wallet";
import { assemble } from "clvm_tools/clvm_tools/binutils";
import debug from "../api/debug";
import puzzle from "../crypto/puzzle";
import { TokenPuzzleDetail } from "../crypto/receive";
import { combineSpendBundlePure } from "../mint/cat";
import { curryMod } from "../offer/bundler";
import { internalUncurry } from "../offer/summary";
import transfer, { GetPuzzleApiCallback, SymbolCoins, TransferTarget } from "../transfer/transfer";
import { getNumber, prefix0x } from "./condition";
import { modsdict, modshash, modsprog, modspuz } from "./mods";
import { Bytes } from "clvm";
import { bytesToHex0x } from "../crypto/utility";
import catBundle from "../transfer/catBundle";
import { getCoinName0x } from "./coinUtility";
import { cloneAndChangeRequestPuzzleTemporary, constructSingletonTopLayerPuzzle, getPuzzleDetail, hex2asc, ParsedMetadata, parseMetadata, SingletonStructList } from "./singleton";

export interface MintNftInfo {
  spendBundle: SpendBundle;
}

export interface NftCoinAnalysisResult {
  singletonModHash: string;
  launcherId: string;
  launcherPuzzleHash: string;
  nftStateModHash: string;
  metadataUpdaterPuzzleHash: string;
  p2InnerPuzzle: string;
  hintPuzzle: string;
  nftOwnershipModHash: string,
  currentOwner: string,
  royaltyAddress: string,
  tradePricePercentage: number,
  metadata: NftMetadataValues;
}

// - singleton_top_layer_v1_1
//   - `SINGLETON_STRUCT`
//   - `INNER_PUZZLE` -> nft_state_layer
//       - `NFT_STATE_LAYER_MOD_HASH`
//       - `METADATA`
//       - `METADATA_UPDATER_PUZZLE_HASH`
//       - `INNER_PUZZLE` -> nft_ownership_layer
//           - `NFT_OWNERSHIP_LAYER_MOD_HASH`
//           - `CURRENT_OWNER`
//           - `TRANSFER_PROGRAM` -> nft_ownership_transfer_program_one_way_claim_with_royalties
//               - `SINGLETON_STRUCT`
//               - `ROYALTY_ADDRESS`
//               - `TRADE_PRICE_PERCENTAGE`
//           - `INNER_PUZZLE` -> p2_delegated_puzzle_or_hidden_puzzle

export async function generateMintNftBundle(
  targetAddress: string,
  changeAddress: string,
  fee: bigint,
  metadata: NftMetadataValues,
  availcoins: SymbolCoins,
  requests: TokenPuzzleDetail[],
  baseSymbol: string,
  chainId: string,
  royaltyAddressHex: string,
  tradePricePercentage: number,
  didcoin:string,
  currentOwner = "()",
): Promise<MintNftInfo> {
  const amount = 1n; // always 1 mojo for 1 NFT
  const tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(targetAddress));
  const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(changeAddress));
  const inner_p2_puzzle = getPuzzleDetail(tgt_hex, requests);

  /*
  1. BootstrapCoin: XCH Tx -> (XCH Change Tx . SgtLauncher Tx)
  2. LauncherCoin: SgtLauncher Tx -> Genesis NFT Tx
  3. NftCoin: Genesis NFT Tx -> Updater NFT Tx
  4. DidCoin: DID Tx -> DID Tx
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

  const sgnStruct = `(${await modshash("singleton_top_layer_v1_1")} ${prefix0x(launcherCoinId)} . ${prefix0x(await modshash("singleton_launcher"))})`;
  const nftPuzzle = await constructSingletonTopLayerPuzzle(
    launcherCoinId,
    await modshash("singleton_launcher"),
    // await constructNftStatePuzzle(metadata, inner_p2_puzzle.puzzle)
    await constructNftStatePuzzle(metadata,
      await constructNftOwnershipPuzzle(currentOwner,
        await constructNftTransferPuzzle(sgnStruct, royaltyAddressHex, tradePricePercentage),
        inner_p2_puzzle.puzzle))
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
  const nftPuzzle = await constructSingletonTopLayerPuzzle(
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

export async function analyzeNftCoin(puzzle_reveal:string, hintPuzzle: string): Promise<NftCoinAnalysisResult | null> {
  const puz = await puzzle.disassemblePuzzle(puzzle_reveal);
  const { module, args } = await internalUncurry(puz);

  // - singleton_top_layer_v1_1
  if (modsdict[module] != "singleton_top_layer_v1_1" || args.length != 2) return null;
  const sgnStructProg = assemble(args[0]);
  const sgnStructlist: SingletonStructList = (sgnStructProg.as_javascript() as SingletonStructList)

  const singletonModHash = bytesToHex0x(sgnStructlist[0]);
  const launcherId = bytesToHex0x(sgnStructlist[1][0]);
  const launcherPuzzleHash = bytesToHex0x(sgnStructlist[1][1]);

  // nft_state_layer
  const { module: smodule, args: sargs } = await internalUncurry(args[1]);
  if (modsdict[smodule] != "nft_state_layer" || sargs.length != 4) return null;
  const nftStateModHash = sargs[0];
  const metadataUpdaterPuzzleHash = sargs[2];

  const parsed = parseMetadata(sargs[1]);
  const metadata = getNftMetadataInfo(parsed);

  // nft_ownership_layer
  const { module: omodule, args: oargs } = await internalUncurry(sargs[3]);
  if (modsdict[omodule] != "nft_ownership_layer" || oargs.length != 4) return null;
  const nftOwnershipModHash = oargs[0];
  const currentOwner = oargs[1];
  const p2InnerPuzzle = oargs[3];

  // nft_ownership_transfer_program_one_way_claim_with_royalties
  const { module: tmodule, args: targs } = await internalUncurry(oargs[2]);
  if (modsdict[tmodule] != "nft_ownership_transfer_program_one_way_claim_with_royalties" || targs.length != 3) return null;
  if (args[0] != targs[0]) throw new Error("abnormal, SINGLETON_STRUCT is different in top_layer and ownership_transfer");
  const royaltyAddress = targs[1];
  const tradePricePercentage = Number(getNumber(targs[2]));

  if (!metadata.imageUri
    || !metadata.imageHash
    || !singletonModHash
    || !launcherId
    || !launcherPuzzleHash
    || !nftStateModHash
    || !metadataUpdaterPuzzleHash
    || !p2InnerPuzzle
  ) return null;

  return {
    metadata,
    singletonModHash,
    launcherId,
    launcherPuzzleHash,
    nftStateModHash,
    metadataUpdaterPuzzleHash,
    p2InnerPuzzle,
    nftOwnershipModHash,
    currentOwner,
    royaltyAddress,
    tradePricePercentage,
    hintPuzzle: prefix0x(hintPuzzle),
  };
}

async function constructNftStatePuzzle(metadata: NftMetadataValues, inner_puzzle: string): Promise<string> {
  if (metadata.imageUri.indexOf("\"") >= 0) throw new Error("image uri should processed before proceeding");

  const mkeys = getNftMetadataKeys();
  const md = "(" + [
    `${mkeys.imageUri} "${metadata.imageUri}"`,
    `${mkeys.imageHash} . ${prefix0x(metadata.imageHash)}`,
    `${mkeys.metadataUri} "${metadata.metadataUri}"`,
    `${mkeys.metadataHash} . ${prefix0x(metadata.metadataHash)}`,
    `${mkeys.licenseUri} "${metadata.licenseUri}"`,
    `${mkeys.licenseHash} . ${prefix0x(metadata.licenseHash)}`,
    `${mkeys.serialNumber} . ${metadata.serialNumber}`,
    `${mkeys.serialTotal} . ${metadata.serialTotal}`,
  ].join(" ") + ")";

  const curried_tail = await curryMod(
    modsprog["nft_state_layer"],
    await modshash("nft_state_layer"),
    md,
    await modshash("nft_metadata_updater_default"),
    inner_puzzle
  );
  if (!curried_tail) throw new Error("failed to curry tail.");

  return curried_tail;
}

async function constructNftOwnershipPuzzle(currentOwner: string, transfer_program: string, inner_puzzle: string): Promise<string> {
  const curried_tail = await curryMod(
    modsprog["nft_ownership_layer"],
    await modshash("nft_ownership_layer"),
    currentOwner,
    transfer_program,
    inner_puzzle,
  );
  if (!curried_tail) throw new Error("failed to curry tail.");

  return curried_tail;
}

async function constructNftTransferPuzzle(singletonStruct: string, royaltyAddress: string, tradePricePercentage: number): Promise<string> {
  const curried_tail = await curryMod(
    singletonStruct,
    royaltyAddress,
    tradePricePercentage.toFixed(0),
  );
  if (!curried_tail) throw new Error("failed to curry tail.");

  return curried_tail;
}

type NftDataKey = "imageUri" | "imageHash" | "metadataUri" | "metadataHash" | "licenseUri" | "licenseHash" | "serialNumber" | "serialTotal";
type NftMetadataValues = { [key in NftDataKey]: string };

function getNftMetadataKeys(): NftMetadataValues {
  return {
    "imageUri": "117",    // for uri
    "imageHash": "104",    // for hash
    "metadataUri": "28021", // for metadata uri
    "metadataHash": "28008", // for metadata hash
    "licenseUri": "27765", // for license uri
    "licenseHash": "27752", // for license hash
    "serialNumber": "29550", // for series number
    "serialTotal": "29556", // for series total
  };
}
function getNftMetadataInfo(parsed: ParsedMetadata): NftMetadataValues {
  const mkeys = getNftMetadataKeys();

  return {
    imageUri: hex2asc(parsed[mkeys.imageUri]) ?? "",
    imageHash: parsed[mkeys.imageHash] ?? "",
    metadataUri: hex2asc(parsed[mkeys.metadataUri]) ?? "",
    metadataHash: parsed[mkeys.metadataHash] ?? "",
    licenseUri: hex2asc(parsed[mkeys.licenseUri]) ?? "",
    licenseHash: parsed[mkeys.licenseHash] ?? "",
    serialNumber: parsed[mkeys.serialNumber] ?? "",
    serialTotal: parsed[mkeys.serialTotal] ?? "",
  };
}