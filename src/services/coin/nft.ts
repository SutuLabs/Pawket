import { CoinSpend, OriginCoin, SpendBundle } from "@/models/wallet";
import { assemble } from "clvm_tools/clvm_tools/binutils";
import puzzle from "../crypto/puzzle";
import { TokenPuzzleDetail } from "../crypto/receive";
import { combineSpendBundlePure } from "../mint/cat";
import { curryMod } from "../offer/bundler";
import { internalUncurry } from "../offer/summary";
import transfer, { GetPuzzleApiCallback, SymbolCoins, TransferTarget } from "../transfer/transfer";
import { getNumber, prefix0x } from "./condition";
import { modsdict, modshash, modsprog, modspuz } from "./mods";
import utility, { bytesToHex0x } from "../crypto/utility";
import catBundle from "../transfer/catBundle";
import { getCoinName0x } from "./coinUtility";
import { cloneAndChangeRequestPuzzleTemporary, constructSingletonTopLayerPuzzle, getPuzzleDetail, hex2asc, ParsedMetadata, parseMetadata, SingletonStructList } from "./singleton";
import { findByPath } from "./lisp";
import { ConditionOpcode } from "./opcode";
import { DidCoinAnalysisResult } from "./did";
import { NftCoinAnalysisResult, NftMetadataKeys, NftMetadataValues } from "@/models/nft";

export interface MintNftInfo {
  spendBundle: SpendBundle;
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
  didAnalysis: DidCoinAnalysisResult,
  api: GetPuzzleApiCallback,
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
  const bootstrapSpendBundle = await transfer.generateSpendBundleWithoutCat(bootstrapSpendPlan, requests, [], baseSymbol, chainId);
  const bootstrapCoin = bootstrapSpendBundle.coin_spends[0].coin;// get the primary coin
  const bootstrapCoinId = getCoinName0x(bootstrapCoin);
  // TODO: assert puzzle announcement from launcher coin in p2 bootstrap coin

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
    await constructNftStatePuzzle(await constructMetadataString(metadata),
      await constructNftOwnershipPuzzle("()", // first creation, current owner in field is () instead of didAnalysis.launcherId, true owner is in the solution
        await constructNftTransferPuzzle(sgnStruct, royaltyAddressHex, tradePricePercentage),
        inner_p2_puzzle.puzzle))
  );

  const nftPuzzleHash = prefix0x(await puzzle.getPuzzleHashFromPuzzle(nftPuzzle));
  const nftCoin = {
    parent_coin_info: launcherCoinId,
    amount,
    puzzle_hash: nftPuzzleHash,
  };
  const didInnerPuzzleHash0x = prefix0x(didAnalysis.didInnerPuzzleHash);

  const launcherSolution = `(${nftPuzzleHash} ${amount} ())`;

  const nftSolution = `((${bootstrapCoinId} ${amount}) ${amount} (((() (q (-10 ${didAnalysis.launcherId} () ${didInnerPuzzleHash0x}) (51 ${tgt_hex} 1 (${tgt_hex} ${tgt_hex}))) ()))))`;

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

  const proof = await catBundle.getLineageProof(didAnalysis.utxoCoin.parent_coin_info, api, 2);
  if (proof.proof != didInnerPuzzleHash0x)
    throw new Error(`proof[${proof.proof}] should equal to did_inner_puzzle_hash[${didInnerPuzzleHash0x}]`);
  const didP2InnerPuzzleHash = prefix0x(await puzzle.getPuzzleHashFromPuzzle(didAnalysis.p2InnerPuzzle));
  const didSolution = `((${proof.coinId} ${proof.proof} ${proof.amount}) ${amount} (q (() (q (51 ${didInnerPuzzleHash0x} ${amount} (${didP2InnerPuzzleHash})) (62 ${launcherCoinId})) ())))`;
  const didCoinSpend: CoinSpend = {
    coin: didAnalysis.utxoCoin,
    puzzle_reveal: prefix0x(await puzzle.encodePuzzle(didAnalysis.rawPuzzle)),
    solution: prefix0x(await puzzle.encodePuzzle(didSolution)),
  };

  const didPuzzleHash = prefix0x(await puzzle.getPuzzleHashFromPuzzle(didAnalysis.rawPuzzle));

  const extreqs = cloneAndChangeRequestPuzzleTemporary(baseSymbol, requests, inner_p2_puzzle.hash, nftPuzzle, nftPuzzleHash);
  const bundles = await transfer.getSpendBundle([launcherCoinSpend, nftCoinSpend], extreqs, chainId);
  const extreqs2 = cloneAndChangeRequestPuzzleTemporary(baseSymbol, requests, didP2InnerPuzzleHash, didAnalysis.rawPuzzle, didPuzzleHash);
  const bundles2 = await transfer.getSpendBundle([didCoinSpend], extreqs2, chainId);
  const bundle = await combineSpendBundlePure(bootstrapSpendBundle, bundles, bundles2);

  // for test case generation
  // console.log(`const targetAddress="${targetAddress}";`
  //   + `\nconst changeAddress="${changeAddress}";`
  //   + `\nconst fee=${fee}n;`
  //   + `\nconst metadata=${JSON.stringify(metadata, null, 2)};`
  //   + `\nconst royaltyAddressHex="${royaltyAddressHex}";`
  //   + `\nconst tradePricePercentage=${tradePricePercentage};`
  //   + `\nconst didAnalysis: DidCoinAnalysisResult=${JSON.stringify(didAnalysis, null, 2)};`
  //   + `\nconst availcoins=${JSON.stringify(availcoins, null, 2)};`
  //   + `\nconst expect: SpendBundle=${JSON.stringify(bundle, null, 2)};`);

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

  // console.log(`const tgt_hex="${tgt_hex}";`)
  // console.log(`const change_hex="${change_hex}";`)
  // console.log(`const fee=${fee}n;`)
  // console.log(`const nftCoin=${JSON.stringify(nftCoin)};`)
  // console.log(`const analysis=${JSON.stringify(analysis)};`)
  // console.log(`const availcoins=${JSON.stringify(availcoins)};`)

  const amount = 1n;
  const proof = await catBundle.getLineageProof(nftCoin.parent_coin_info, api, 2);

  // `-10` is the change owner magic condition
  const nftSolution = `((${proof.coinId} ${proof.proof} ${proof.amount}) ${amount} (((() (q (-10 () () ()) (51 ${tgt_hex} ${amount} (${tgt_hex}))) ()))))`;
  const sgnStruct = `(${await modshash("singleton_top_layer_v1_1")} ${prefix0x(analysis.launcherId)} . ${prefix0x(await modshash("singleton_launcher"))})`;
  const nftPuzzle = await constructSingletonTopLayerPuzzle(
    analysis.launcherId,
    await modshash("singleton_launcher"),
    await constructNftStatePuzzle(analysis.rawMetadata,
      await constructNftOwnershipPuzzle(analysis.didOwner,
        await constructNftTransferPuzzle(sgnStruct, analysis.royaltyAddress, analysis.tradePricePercentage),
        inner_p2_puzzle.puzzle))
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
    const feeSpendBundle = await transfer.generateSpendBundleWithoutCat(feeSpendPlan, requests, [], baseSymbol, chainId);
    const feeBundle = await combineSpendBundlePure(feeSpendBundle, bundle);

    return feeBundle;
  }

  return bundle;
}

export async function analyzeNftCoin(puzzle_reveal: string, hintPuzzle: string, solution_hex: string): Promise<NftCoinAnalysisResult | null> {
  const puz = await puzzle.disassemblePuzzle(puzzle_reveal);
  const solution = await puzzle.disassemblePuzzle(solution_hex);
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

  const rawMetadata = sargs[1];
  const parsed = parseMetadata(rawMetadata);
  const metadata = getNftMetadataInfo(parsed);

  // nft_ownership_layer
  const { module: omodule, args: oargs } = await internalUncurry(sargs[3]);
  if (modsdict[omodule] != "nft_ownership_layer" || oargs.length != 4) return null;
  const nftOwnershipModHash = oargs[0];
  const previousOwner = oargs[1];
  const p2InnerPuzzle = oargs[3];

  // nft_ownership_transfer_program_one_way_claim_with_royalties
  const { module: tmodule, args: targs } = await internalUncurry(oargs[2]);
  if (modsdict[tmodule] != "nft_ownership_transfer_program_one_way_claim_with_royalties" || targs.length != 3) return null;
  if (args[0] != targs[0]) throw new Error("abnormal, SINGLETON_STRUCT is different in top_layer and ownership_transfer");
  const royaltyAddress = targs[1];
  const tradePricePercentage = Number(getNumber(targs[2]));
  const { didOwner, p2Owner } = await getOwnerFromSolution(solution);

  if (!metadata.imageUri
    || !metadata.imageHash
    || !singletonModHash
    || !launcherId
    || !launcherPuzzleHash
    || !nftStateModHash
    || !metadataUpdaterPuzzleHash
    || !p2InnerPuzzle
  ) return null;

  // console.log(`NFT found: ${launcherId}`);
  // console.log(`const puzzle_reveal="${puzzle_reveal}";`);
  // console.log(`const hintPuzzle="${hintPuzzle}";`);
  // console.log(`const solution="${solution_hex}";`);

  return {
    metadata,
    rawMetadata,
    singletonModHash,
    launcherId,
    launcherPuzzleHash,
    nftStateModHash,
    metadataUpdaterPuzzleHash,
    p2InnerPuzzle,
    nftOwnershipModHash,
    previousOwner,
    didOwner: didOwner ?? previousOwner,
    p2Owner: p2Owner ?? "",
    royaltyAddress,
    tradePricePercentage,
    hintPuzzle: prefix0x(hintPuzzle),
  };
}

async function getOwnerFromSolution(solution: string): Promise<{ didOwner: string | undefined, p2Owner: string | undefined }> {
  const sol = assemble(solution);
  /*
  example:
  (
    (0x6488c6e33a3719efd79aecdb6bf3c12fd65bc1367271f1b0c5982513f5b2d0ac 1)
    1;rest
    (;rest.first
      (;first
        (;first
          () ;rest.first
          (q ;rest.as_iter
            (-10 0x7b7f7ae9d65865d67a0305828e940b470a11f94e96568b5df98174147a92f0d6 
              () 0x3f48282fdc480c0f61e5c6b365997711faec970570c67aca0352ee23de88e4ac) 
            (51 0x7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10 1 
              (0x7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10 0x7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10))) 
          ()))))
  
  */

  const prog = findByPath(sol, "rrfffrfr");
  const conds = puzzle.parseConditions(prog);
  const did = conds.find(_ => _.code == 246) // magic number: 246 == -10
  const p2 = conds.find(_ => _.code == ConditionOpcode.CREATE_COIN);
  const didOwner = (!did || !(did.args[0] instanceof Uint8Array)) ? undefined : utility.toHexString(did.args[0]);
  const p2Owner = (!p2 || !(p2.args[2] instanceof Array) || !(p2.args[2][0] instanceof Uint8Array)) ? undefined : utility.toHexString(p2.args[2][0]);

  return { didOwner, p2Owner };
}

async function constructMetadataString(metadata: NftMetadataValues): Promise<string> {
  if (!metadata.imageUri) throw new Error("empty image uri is not allowed");
  if (metadata.imageUri.indexOf("\"") >= 0) throw new Error("image uri should processed before proceeding");

  const mkeys = getNftMetadataKeys();
  const toNumber = function (hex: string | undefined): string | undefined {
    if (!hex) return hex;
    const num = parseInt(hex, 16);
    return num.toFixed(0);
  }
  const uriToStr = function (uri: string | string[] | undefined): string {
    if (!uri) return "";
    if (typeof uri === "string") return ` "${uri}"`;
    return " " + uri.map(_ => `"${_}"`).join(" ");

  };
  const md = "(" + [
    `${toNumber(mkeys.imageUri)}${uriToStr(metadata.imageUri)}`,
    metadata.imageHash ? `${toNumber(mkeys.imageHash)} . ${prefix0x(metadata.imageHash)}` : toNumber(mkeys.imageHash),
    `${toNumber(mkeys.metadataUri)}${uriToStr(metadata.metadataUri)}`,
    metadata.metadataHash ? `${toNumber(mkeys.metadataHash)} . ${prefix0x(metadata.metadataHash)}` : toNumber(mkeys.metadataHash),
    `${toNumber(mkeys.licenseUri)}${uriToStr(metadata.licenseUri)}`,
    metadata.licenseHash ? `${toNumber(mkeys.licenseHash)} . ${prefix0x(metadata.licenseHash)}` : toNumber(mkeys.licenseHash),
    `${toNumber(mkeys.serialNumber)} . ${toNumber(metadata.serialNumber)}`,
    `${toNumber(mkeys.serialTotal)} . ${toNumber(metadata.serialTotal)}`,
  ].map(_ => `(${_})`).join(" ") + ")";

  return md;
}

async function constructNftStatePuzzle(rawMetadata: string, inner_puzzle: string): Promise<string> {
  const curried_tail = await curryMod(
    modsprog["nft_state_layer"],
    await modshash("nft_state_layer"),
    rawMetadata,
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
    prefix0x(currentOwner),
    transfer_program,
    inner_puzzle,
  );
  if (!curried_tail) throw new Error("failed to curry tail.");

  return curried_tail;
}

async function constructNftTransferPuzzle(singletonStruct: string, royaltyAddress: string, tradePricePercentage: number): Promise<string> {
  const curried_tail = await curryMod(
    modsprog["nft_ownership_transfer_program_one_way_claim_with_royalties"],
    singletonStruct,
    prefix0x(royaltyAddress),
    tradePricePercentage.toFixed(0),
  );
  if (!curried_tail) throw new Error("failed to curry tail.");

  return curried_tail;
}

function getNftMetadataKeys(): NftMetadataKeys {
  return {
    "imageUri": "75",    // for uri
    "imageHash": "68",    // for hash
    "metadataUri": "6d75", // for metadata uri
    "metadataHash": "6d68", // for metadata hash
    "licenseUri": "6c75", // for license uri
    "licenseHash": "6c68", // for license hash
    "serialNumber": "736e", // for series number
    "serialTotal": "7374", // for series total
  };
}
function getNftMetadataInfo(parsed: ParsedMetadata): NftMetadataValues {
  const mkeys = getNftMetadataKeys();

  const getScalar = function (input: string | string[] | undefined): string {
    if (!input) return "";
    if (typeof input !== "string") throw new Error("metadata abnormally present a array");
    return input;
  }

  return {
    imageUri: hex2asc(parsed[mkeys.imageUri]) ?? "",
    imageHash: getScalar(parsed[mkeys.imageHash]),
    metadataUri: hex2asc(parsed[mkeys.metadataUri]) ?? "",
    metadataHash: getScalar(parsed[mkeys.metadataHash]),
    licenseUri: hex2asc(parsed[mkeys.licenseUri]) ?? "",
    licenseHash: getScalar(parsed[mkeys.licenseHash]),
    serialNumber: getScalar(parsed[mkeys.serialNumber]),
    serialTotal: getScalar(parsed[mkeys.serialTotal]),
  };
}

export const getScalarString = function (input: string | string[] | undefined, prefer: 1 | -1 = 1): string | undefined {
  if (!input) return input;
  if (typeof input === "string") return input;
  return prefer == 1 ? input[0] : input.slice(-1)[0];
}