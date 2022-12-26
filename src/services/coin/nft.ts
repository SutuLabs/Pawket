import { CoinSpend, combineSpendBundle, OriginCoin, PartialSpendBundle, signSpendBundle, UnsignedSpendBundle } from "../spendbundle";
import puzzle, { PlaintextPuzzle } from "../crypto/puzzle";
import receive, { TokenPuzzleObserver } from "../crypto/receive";
import { curryMod } from "../offer/bundler";
import transfer, { SymbolCoins, TransferTarget } from "../transfer/transfer";
import { formatAmount, Hex0x, prefix0x, skipFirstByte0x, unprefix0x } from "./condition";
import { modshash, modshex, modsprog } from "./mods";
import utility, { bytesToHex0x } from "../crypto/utility";
import catBundle, { LineageProof } from "../transfer/catBundle";
import { getCoinName0x, NetworkContext } from "./coinUtility";
import { constructSingletonTopLayerPuzzle, getNextCoinName0x, getPuzzleDetail, hex2asc, hex2ascSingle, hex2decSingle, ParsedMetadata, parseMetadata, SingletonStructList } from "./singleton";
import { findByPath } from "./lisp";
import { ConditionOpcode } from "./opcode";
import { DidCoinAnalysisResult } from "./did";
import { CnsBindingKeys, CnsBindingValues, CnsDataKey, CnsUpdatableDataKey, NftCoinAnalysisResult, NftDataKey, NftMetadataKeys, NftMetadataValues, NftUpdatableDataKey } from "@/models/nft";
import { CannotParsePuzzle, expectModArgs, sexpAssemble, UncurriedPuzzle, uncurryPuzzle } from "./analyzer";
import { disassemble, sha256tree } from "clvm_tools";
import { SExp } from "clvm";
import { Instance } from "../util/instance";
import { CnsCoinAnalysisResult, CnsMetadataKeys, CnsMetadataValues } from "@/models/nft";

type MetadataValues = NftMetadataValues | CnsMetadataValues;

export interface MintNftInfo {
  spendBundle: UnsignedSpendBundle;
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
  nftIntermediateAddress: string,
  changeAddress: string,
  fee: bigint,
  metadatas: MetadataValues | MetadataValues[],
  availcoins: SymbolCoins,
  requests: TokenPuzzleObserver[],
  royaltyAddressHex: string,
  tradePricePercentage: number,
  net: NetworkContext,
  didAnalysis: DidCoinAnalysisResult | undefined,
  privateKey: string | undefined = undefined,
  targetAddresses: string[] | undefined = undefined,
  isCns = false,
): Promise<UnsignedSpendBundle> {
  const amount = 1n; // always 1 mojo for 1 NFT
  const intermediate_hex = prefix0x(puzzle.getPuzzleHashFromAddress(nftIntermediateAddress));
  const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(changeAddress));
  const inner_p2_puzzle = getPuzzleDetail(intermediate_hex, requests);

  if (!Array.isArray(metadatas)) metadatas = [metadatas];

  /*
  0. Initial Bootstrap Coin: XCH Tx -> (1 mojo) XCH Tx(s) [When multiple mint is enabled]
  1. BootstrapCoin: XCH Tx -> (XCH Change Tx . SgtLauncher Tx)
  2. LauncherCoin: SgtLauncher Tx -> Genesis NFT Tx
  3. NftCoin: Genesis NFT Tx -> Updater NFT Tx
  4. DidCoin: DID Tx -> DID Tx
  */

  const bootstrapSpendBundle = await getBootstrapSpendBundle(
    change_hex, modshash["singleton_launcher"], fee, availcoins, requests, metadatas.length, net, privateKey);

  if (bootstrapSpendBundle.coin_spends.length != (metadatas.length == 1 ? 1 : metadatas.length + 1))
    throw new Error("unexpected bootstrap coin spends number");

  if (targetAddresses != undefined && targetAddresses.length != metadatas.length)
    throw new Error("target address number should equal to metadata number");

  let didPreviousCoin = didAnalysis?.coin;
  let proof = !didPreviousCoin ? undefined : await catBundle.getLineageProof(didPreviousCoin.parent_coin_info, net.api, 2);
  const didPuzzleHash = !didAnalysis ? undefined : prefix0x(await puzzle.getPuzzleHashFromPuzzle(didAnalysis.rawPuzzle));
  let bundle: UnsignedSpendBundle = bootstrapSpendBundle;
  for (let i = 0; i < metadatas.length; i++) {
    const offset = metadatas.length == 1 ? 0 : 1;
    const metadata = metadatas[i];
    const bootstrapCoin = bootstrapSpendBundle.coin_spends[offset + i].coin;
    const bootstrapCoinId = getCoinName0x(bootstrapCoin);
    // TODO: assert puzzle announcement from launcher coin in p2 bootstrap coin

    const launcherCoin: OriginCoin = {
      parent_coin_info: bootstrapCoinId,
      amount,
      puzzle_hash: prefix0x(modshash["singleton_launcher"]),
    };
    const launcherCoinId = getCoinName0x(launcherCoin);

    const sgnStruct = `(${prefix0x(modshash["singleton_top_layer_v1_1"])} ${prefix0x(launcherCoinId)} . ${prefix0x(modshash["singleton_launcher"])})`;
    const metadata_updater_hash = isCns ? modshash["nft_metadata_updater_cns"] : modshash["nft_metadata_updater_default"];
    const nftPuzzle = await constructSingletonTopLayerPuzzle(
      launcherCoinId,
      prefix0x(modshash["singleton_launcher"]),
      await constructNftStatePuzzle(
        constructMetadataString(metadata),
        metadata_updater_hash,
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

    const launcherSolution = `(${nftPuzzleHash} ${amount} ())`;

    const tgt_hex = targetAddresses ? prefix0x(puzzle.getPuzzleHashFromAddress(targetAddresses[i])) : intermediate_hex;
    const nftInnerSolution = didAnalysis
      ? await getTransferNftByDidInnerSolution(tgt_hex, didAnalysis.launcherId, prefix0x(didAnalysis.didInnerPuzzleHash))
      : await getTransferNftInnerSolution(tgt_hex);
    const nftSolution = `((${bootstrapCoinId} ${amount}) ${amount} (((${nftInnerSolution}))))`;

    const launcherCoinSpend: CoinSpend = {
      coin: launcherCoin,
      puzzle_reveal: prefix0x(modshex["singleton_launcher"]),
      solution: prefix0x(await puzzle.encodePuzzle(launcherSolution)),
    };

    const nftCoinSpend: CoinSpend = {
      coin: nftCoin,
      puzzle_reveal: prefix0x(await puzzle.encodePuzzle(nftPuzzle)),
      solution: prefix0x(await puzzle.encodePuzzle(nftSolution)),
    };

    bundle = combineSpendBundle(bundle, [launcherCoinSpend, nftCoinSpend]);

    if (didAnalysis && proof && didPreviousCoin && didPuzzleHash) {
      const didBundle = await getDidBundle(didAnalysis, proof, amount, launcherCoinId, didPreviousCoin);

      const didParentCoinId = getCoinName0x(didPreviousCoin);
      proof = {
        amount: proof.amount,
        proof: proof.proof,
        coinId: didPreviousCoin.parent_coin_info,
      };
      didPreviousCoin = {
        parent_coin_info: didParentCoinId,
        puzzle_hash: didPuzzleHash,
        amount: didPreviousCoin.amount,
      };
      bundle = await combineSpendBundle(bundle, didBundle);
    }
  }

  return bundle;
}

async function getDidBundle(
  didAnalysis: DidCoinAnalysisResult,
  proof: LineageProof,
  amount: bigint,
  launcherCoinId: string,
  didPreviousCoin: OriginCoin,
): Promise<UnsignedSpendBundle> {
  const didInnerPuzzleHash0x = prefix0x(didAnalysis.didInnerPuzzleHash);
  if (proof.proof != didInnerPuzzleHash0x)
    throw new Error(`proof[${proof.proof}] should equal to did_inner_puzzle_hash[${didInnerPuzzleHash0x}]`);
  const didP2InnerPuzzleHash = prefix0x(await puzzle.getPuzzleHashFromPuzzle(didAnalysis.p2InnerPuzzle));
  const didSolution = `((${proof.coinId} ${proof.proof} ${proof.amount}) ${amount} (q (() (q (51 ${didInnerPuzzleHash0x} ${amount} (${didP2InnerPuzzleHash})) (62 ${launcherCoinId})) ())))`;
  const didCoinSpend: CoinSpend = {
    coin: didPreviousCoin,
    puzzle_reveal: prefix0x(await puzzle.encodePuzzle(didAnalysis.rawPuzzle)),
    solution: prefix0x(await puzzle.encodePuzzle(didSolution)),
  };

  return new UnsignedSpendBundle([didCoinSpend]);
}

export async function getBootstrapSpendBundle(
  change_hex: Hex0x,
  target_hex: Hex0x,
  fee: bigint,
  availcoins: SymbolCoins,
  requests: TokenPuzzleObserver[],
  count: number,
  net: NetworkContext,
  privateKey: string | undefined = undefined,
): Promise<PartialSpendBundle | UnsignedSpendBundle> {
  const amount = 1n; // always 1 mojo for 1 NFT
  const baseSymbol = net.symbol;

  if (count == 1) {
    const bootstrapTgts: TransferTarget[] = [{ address: target_hex, amount, symbol: baseSymbol }];
    const bootstrapSpendPlan = transfer.generateSpendPlan(availcoins, bootstrapTgts, change_hex, fee, baseSymbol);
    const bootstrapSpendBundle = await transfer.generateSpendBundleWithoutCat(bootstrapSpendPlan, requests, [], net);
    return bootstrapSpendBundle;
  }
  else {
    const BLS = Instance.BLS;
    if (!BLS) throw new Error("BLS not initialized");

    const sk = privateKey ? privateKey : utility.toHexString(BLS.AugSchemeMPL.key_gen(utility.getRandom(64)).serialize());
    const puzzles = await receive.getAssetsRequestDetail(sk, 0, count, [], {}, "any", baseSymbol, "cat_v2");
    const ps = puzzles.filter(_ => _.symbol == baseSymbol)[0].puzzles;

    // initboot coin == initial bootstrap coin
    const initbootTgts: TransferTarget[] = ps.slice(0, count).map(puz => ({ address: prefix0x(puz.hash), amount, symbol: baseSymbol }));
    const initbootSpendPlan = transfer.generateSpendPlan(availcoins, initbootTgts, change_hex, fee, baseSymbol);
    const initbootSpendBundle = await transfer.generateSpendBundleWithoutCat(initbootSpendPlan, requests, [], net);


    let spendBundle = initbootSpendBundle;
    const parent = getCoinName0x(spendBundle.coin_spends[0].coin);
    for (let i = 0; i < count; i++) {
      const tgt = initbootSpendPlan[baseSymbol].targets[i];
      const onlycoin: SymbolCoins = {};
      onlycoin[baseSymbol] = [{ puzzle_hash: tgt.address, amount: tgt.amount, parent_coin_info: parent }];
      const bootstrapTgts: TransferTarget[] = [{ address: prefix0x(target_hex), amount, symbol: baseSymbol }];
      const bootstrapSpendPlan = transfer.generateSpendPlan(onlycoin, bootstrapTgts, change_hex, 0n, baseSymbol);
      const bootstrapUnsignedSpendBundle = await transfer.generateSpendBundleWithoutCat(bootstrapSpendPlan, puzzles, [], net);
      const bootstrapSpendBundle = await signSpendBundle(bootstrapUnsignedSpendBundle, puzzles, net.chainId);

      spendBundle = await combineSpendBundle(spendBundle, bootstrapSpendBundle);
    }

    return spendBundle;
  }
}

export async function generateTransferNftBundle(
  targetAddress: string,
  changeAddress: string,
  fee: bigint,
  nftCoin: OriginCoin,
  analysis: NftCoinAnalysisResult,
  availcoins: SymbolCoins,
  requests: TokenPuzzleObserver[],
  net: NetworkContext,
  didAnalysis: DidCoinAnalysisResult | undefined = undefined,
): Promise<UnsignedSpendBundle> {
  const tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(targetAddress));
  const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(changeAddress));
  const inner_p2_puzzle = getPuzzleDetail(analysis.hintPuzzle, requests);
  const proof = await catBundle.getLineageProof(nftCoin.parent_coin_info, net.api, 2);

  const nftInnerSolution = didAnalysis
    ? await getTransferNftByDidInnerSolution(tgt_hex, didAnalysis.launcherId, didAnalysis.didInnerPuzzleHash)
    : await getTransferNftInnerSolution(tgt_hex)
  const nftSolution = await getTransferNftSolution(proof, nftInnerSolution);
  const nftPuzzle = await getTransferNftPuzzle(analysis, inner_p2_puzzle.puzzle);

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

  const didBundle = didAnalysis
    ? await constructDidSpendBundle(didAnalysis, analysis.launcherId, net)
    : undefined;

  const feeBundle = fee > 0n
    ? await constructPureFeeSpendBundle(change_hex, fee, availcoins, requests, net)
    : undefined;

  const bundle = await combineSpendBundle([nftCoinSpend], didBundle, feeBundle);
  return bundle;
}

export async function generateUpdatedNftBundle(
  changeAddress: string,
  fee: bigint,
  nftCoin: OriginCoin,
  analysis: NftCoinAnalysisResult | CnsCoinAnalysisResult,
  updater: "CNS" | "NFT",
  key: CnsUpdatableDataKey | NftUpdatableDataKey,
  value: string | CnsBindingValues,
  availcoins: SymbolCoins,
  requests: TokenPuzzleObserver[],
  net: NetworkContext,
  targetAddress: string | undefined = undefined,
): Promise<UnsignedSpendBundle> {
  const tgt_hex = !targetAddress
    ? analysis.p2Owner
    : prefix0x(puzzle.getPuzzleHashFromAddress(targetAddress));
  if (!tgt_hex) throw new Error(`cannot find proper target address. analysis.p2Owner = ${analysis.p2Owner}`);

  const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(changeAddress));
  const inner_p2_puzzle = getPuzzleDetail(analysis.hintPuzzle, requests);
  const metadataUpdater = updater == "CNS"
    ? modsprog["nft_metadata_updater_cns"]
    : modsprog["nft_metadata_updater_default"]

  const proof = await catBundle.getLineageProof(nftCoin.parent_coin_info, net.api, 2);

  const nftInnerSolution = await getUpdateNftInnerSolution(tgt_hex, metadataUpdater, key, value);
  const nftSolution = await getTransferNftSolution(proof, nftInnerSolution);
  const nftPuzzle = await getTransferNftPuzzle(analysis, inner_p2_puzzle.puzzle);

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

  const feeBundle = fee > 0n
    ? await constructPureFeeSpendBundle(change_hex, fee, availcoins, requests, net)
    : undefined;

  const bundle = await combineSpendBundle([nftCoinSpend], feeBundle);
  return bundle;
}

export async function analyzeNftCoin(
  puz: string | (UncurriedPuzzle | CannotParsePuzzle),
  hintPuzzle: string | undefined,
  coin: OriginCoin,
  solution_hex: string
): Promise<NftCoinAnalysisResult | CnsCoinAnalysisResult | null> {
  const parsed_puzzle = (typeof puz === "string")
    ? await uncurryPuzzle(sexpAssemble(puz))
    : puz;

  if ("raw" in parsed_puzzle) return null;

  // - singleton_top_layer_v1_1
  if (!expectModArgs(parsed_puzzle, "singleton_top_layer_v1_1", 2)) return null;
  const root_inner_puzzle = parsed_puzzle.args[1];
  const root_sgn_struct = parsed_puzzle.args[0];

  if ("raw" in root_inner_puzzle || !("raw" in root_sgn_struct)) return null;

  const sgnStructProg = sexpAssemble(root_sgn_struct.raw);
  const sgnStructlist: SingletonStructList = (sgnStructProg.as_javascript() as SingletonStructList)

  const singletonModHash = bytesToHex0x(sgnStructlist[0]);
  const launcherId = bytesToHex0x(sgnStructlist[1][0]);
  const launcherPuzzleHash = bytesToHex0x(sgnStructlist[1][1]);

  // nft_state_layer
  if (!expectModArgs(root_inner_puzzle, "nft_state_layer", 4)) return null;
  const nftStateModHash_parsed = root_inner_puzzle.args[0];
  const metadataUpdaterPuzzleHash_parsed = root_inner_puzzle.args[2];
  const rawMetadata_parsed = root_inner_puzzle.args[1];
  const nftStateInnerPuzzle = root_inner_puzzle.args[3];

  if ("raw" in nftStateInnerPuzzle
    || !("raw" in nftStateModHash_parsed)
    || !("raw" in metadataUpdaterPuzzleHash_parsed)
    || !("raw" in rawMetadata_parsed)
  ) return null;

  const nftStateModHash = skipFirstByte0x(nftStateModHash_parsed.raw);
  const metadataUpdaterPuzzleHash = skipFirstByte0x(metadataUpdaterPuzzleHash_parsed.raw);
  const solsexp = sexpAssemble(solution_hex);
  const calculatedMetadata = await getCalculatedMetadata(rawMetadata_parsed.raw as Hex0x, metadataUpdaterPuzzleHash, solsexp);
  const rawMetadata = disassemble(calculatedMetadata);
  const parsed = parseMetadata(calculatedMetadata);
  const metadata = getNftMetadataInfo(parsed);

  // nft_ownership_layer
  if (!expectModArgs(nftStateInnerPuzzle, "nft_ownership_layer", 4)) return null;
  const nftOwnershipModHash_parsed = nftStateInnerPuzzle.args[0];
  const previousOwner_parsed = nftStateInnerPuzzle.args[1];
  const transferInnerPuzzle_parsed = nftStateInnerPuzzle.args[2];
  const p2InnerPuzzle_parsed = nftStateInnerPuzzle.args[3];

  if ("raw" in transferInnerPuzzle_parsed
    || !("raw" in nftOwnershipModHash_parsed)
    || !("raw" in previousOwner_parsed)
  ) return null;

  const nftOwnershipModHash = skipFirstByte0x(nftOwnershipModHash_parsed.raw);
  const previousOwner = disassemble(sexpAssemble(previousOwner_parsed.raw));
  const p2InnerPuzzle = "raw" in p2InnerPuzzle_parsed
    ? await puzzle.disassemblePuzzle(p2InnerPuzzle_parsed.raw)
    : disassemble(p2InnerPuzzle_parsed.sexp);
  hintPuzzle = hintPuzzle ? hintPuzzle : sha256tree("raw" in p2InnerPuzzle_parsed
    ? sexpAssemble(p2InnerPuzzle_parsed.raw)
    : p2InnerPuzzle_parsed.sexp).hex();

  // nft_ownership_transfer_program_one_way_claim_with_royalties
  if (!expectModArgs(transferInnerPuzzle_parsed, "nft_ownership_transfer_program_one_way_claim_with_royalties", 3)) return null;
  const transfer_sgn_struct_parsed = transferInnerPuzzle_parsed.args[0];
  const royaltyAddress_parsed = transferInnerPuzzle_parsed.args[1];
  const tradePricePercentage_parsed = transferInnerPuzzle_parsed.args[2];

  if (!("raw" in transfer_sgn_struct_parsed)
    || !("raw" in royaltyAddress_parsed)
    || !("raw" in tradePricePercentage_parsed)
  ) return null;

  const transfer_sgn_struct = transfer_sgn_struct_parsed.raw;
  const royaltyAddress = skipFirstByte0x(royaltyAddress_parsed.raw);
  const tradePricePercentage = sexpAssemble(tradePricePercentage_parsed.raw).as_int();

  if (transfer_sgn_struct != root_sgn_struct.raw) throw new Error("abnormal, SINGLETON_STRUCT is different in top_layer and ownership_transfer");

  const { didOwner, p2Owner, updaterInSolution } =
    ("mod" in p2InnerPuzzle_parsed && p2InnerPuzzle_parsed.mod == "settlement_payments")
      ? await getOwnerFromSolutionForSettlementInnerPuzzle(solsexp)
      : await getOwnerFromSolutionForP2InnerPuzzle(solsexp);

  const nextCoinName = await getNextCoinName0x(parsed_puzzle.hex, solution_hex, getCoinName0x(coin));

  if (!metadata
    || !singletonModHash
    || !launcherId
    || !launcherPuzzleHash
    || !nftStateModHash
    || !metadataUpdaterPuzzleHash
    || !p2InnerPuzzle
    || !coin
  ) return null;

  const obj: NftCoinAnalysisResult = {
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
    nextCoinName,
    coin,
    updaterInSolution,
  };
  if (!obj.updaterInSolution) delete obj.updaterInSolution;

  if ("expiry" in metadata && metadata.expiry && metadata.name) {
    const cnsobj = Object.assign({
      cnsExpiry: metadata.expiry,
      cnsName: metadata.name,
      cnsAddress: unprefix0x(metadata.bindings?.address ?? metadata.address ?? p2Owner ?? hintPuzzle),
      cnsBindings: metadata.bindings,
    }, obj) as CnsCoinAnalysisResult;
    return cnsobj;
  }

  return obj;
}

export async function getTransferNftPuzzle(analysis: NftCoinAnalysisResult, inner_p2_puzzle: string): Promise<PlaintextPuzzle> {
  const sgnStruct = `(${prefix0x(modshash["singleton_top_layer_v1_1"])} ${prefix0x(analysis.launcherId)} . ${prefix0x(
    modshash["singleton_launcher"]
  )})`;
  const metadata_updater_hash = analysis.metadataUpdaterPuzzleHash;
  const nftPuzzle = await constructSingletonTopLayerPuzzle(
    analysis.launcherId,
    prefix0x(modshash["singleton_launcher"]),
    await constructNftStatePuzzle(
      analysis.rawMetadata,
      metadata_updater_hash,
      await constructNftOwnershipPuzzle(
        analysis.didOwner,
        await constructNftTransferPuzzle(sgnStruct, analysis.royaltyAddress, analysis.tradePricePercentage),
        inner_p2_puzzle
      )
    )
  );

  return nftPuzzle;
}

export async function getTransferNftSolution(proof: LineageProof, p2_inner_solution: string): Promise<string> {
  const amount = 1n;

  const nftSolution = `((${proof.coinId} ${proof.proof} ${proof.amount}) ${amount} (((${p2_inner_solution}))))`;
  return nftSolution;
}

export async function getTransferNftInnerSolution(tgt_hex: string): Promise<string> {
  const amount = 1n;
  tgt_hex = prefix0x(tgt_hex);

  // `-10` is the change owner magic condition
  const nftSolution = `() (q (-10 () () ()) (51 ${tgt_hex} ${amount} (${tgt_hex}))) ()`;
  return nftSolution;
}

export async function getTransferNftByDidInnerSolution(tgt_hex: string, didLauncherId: string, didInnerPuzzleHash: string): Promise<string> {
  const amount = 1n;
  tgt_hex = prefix0x(tgt_hex);

  // `-10` is the change owner magic condition
  const nftSolution = `() (q (-10 ${prefix0x(didLauncherId)} () ${prefix0x(didInnerPuzzleHash)}) (51 ${tgt_hex} ${amount} (${tgt_hex} ${tgt_hex}))) ()`;
  return nftSolution;
}

export async function getUpdateNftInnerSolution(
  tgt_hex: string,
  metadataUpdater: string,
  key: CnsDataKey | NftDataKey,
  value: string | CnsBindingValues,
): Promise<string> {
  const amount = 1n;
  tgt_hex = prefix0x(tgt_hex);
  const val = typeof value !== "string" ? constructCnsBindingString(value) : value.startsWith("0x") ? value : `"${value}"`;
  const mkeys = getNftMetadataKeys();

  // `-24` is the update metadata magic condition
  const nftSolution = `() (q (-24 ${metadataUpdater} (${toNumber(mkeys[key])} . ${val})) (51 ${tgt_hex} ${amount} (${tgt_hex}))) ()`;
  return nftSolution;
}

async function getOwnerFromSolutionForSettlementInnerPuzzle(sol: SExp): Promise<{
  didOwner: string | undefined,
  p2Owner: string | undefined,
  updaterInSolution: boolean,
}> {
  /*
  example:
  (
    (0x50c22cecf983e330fff93adb93e87959ef466dbd217bc589a08e817825fcfda0 0xb974105be7bc131155a5800659c0d96180ada64d34adc05ae57c8f55dfff4679 1) 1 
    (
      (
        (
          (0x9b0b7fe0bb3dea99b8fda6f891398b3310ff48fa99f3b717d54b2a26392edfb4 
            (0x7eddb6c424762b7a1008db41b4b9a60f48cce2215e0e303f56b3a66ce8da9598 1 
              (0x7eddb6c424762b7a1008db41b4b9a60f48cce2215e0e303f56b3a66ce8da9598)))))))
  */

  const p2Owner = findByPath(sol, "rrffffrff").as_bin().hex().slice(2);
  return { didOwner: undefined, p2Owner, updaterInSolution: false };
}

async function getOwnerFromSolutionForP2InnerPuzzle(sol: SExp): Promise<{
  didOwner: string | undefined,
  p2Owner: string | undefined,
  updaterInSolution: boolean,
}> {
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
  const updaterInSolution = !!conds.find(_ => _.code == 232) // magic number: 232 == -24
  const p2 = conds.find(_ => _.code == ConditionOpcode.CREATE_COIN);
  const didOwner = (!did || !(did.args[0] instanceof Uint8Array)) ? undefined : utility.toHexString(did.args[0]);
  const p2Owner = (!p2 || !(p2.args[2] instanceof Array) || !(p2.args[2][0] instanceof Uint8Array)) ? undefined : utility.toHexString(p2.args[2][0]);

  return { didOwner, p2Owner, updaterInSolution };
}

async function getCalculatedMetadata(currentMetadata: Hex0x, updaterPuzzleHash: string, sol: SExp,): Promise<SExp> {
  const updateSol = findByPath(sol, "rrfffrfrf");
  const magic = findByPath(updateSol, "f");
  if (magic.as_int() != -24)
    return sexpAssemble(currentMetadata);
  const prog = findByPath(updateSol, "rf").as_bin().hex();
  const argument = findByPath(updateSol, "rrf");
  const pars = SExp.to([sexpAssemble(currentMetadata), updaterPuzzleHash, argument]).as_bin().hex();

  const result = await puzzle.executePuzzleHex(prog, pars)
  const sexpResult = sexpAssemble(result.raw);
  const metadata = findByPath(sexpResult, "ff");
  return metadata;
}

function constructMetadataString(metadata: MetadataValues): string {
  if (!metadata.imageUri) throw new Error("empty image uri is not allowed");
  if (metadata.imageUri.indexOf("\"") >= 0) throw new Error("image uri should processed before proceeding");

  const mkeys = getNftMetadataKeys();

  const md = "(" + [
    `${toNumber(mkeys.imageUri)}${uriToStr(metadata.imageUri)}`,
    metadata.imageHash ? `${toNumber(mkeys.imageHash)} . ${prefix0x(metadata.imageHash)}` : toNumber(mkeys.imageHash),
    `${toNumber(mkeys.metadataUri)}${uriToStr(metadata.metadataUri)}`,
    metadata.metadataHash ? `${toNumber(mkeys.metadataHash)} . ${prefix0x(metadata.metadataHash)}` : toNumber(mkeys.metadataHash),
    `${toNumber(mkeys.licenseUri)}${uriToStr(metadata.licenseUri)}`,
    metadata.licenseHash ? `${toNumber(mkeys.licenseHash)} . ${prefix0x(metadata.licenseHash)}` : toNumber(mkeys.licenseHash),
    `${toNumber(mkeys.serialNumber)} . ${toNumber(metadata.serialNumber)}`,
    `${toNumber(mkeys.serialTotal)} . ${toNumber(metadata.serialTotal)}`,

    ...("expiry" in metadata ? [
      metadata.expiry ? `${toNumber(mkeys.expiry)} . ${formatAmount(BigInt(metadata.expiry))}` : undefined,
      metadata.name ? `${toNumber(mkeys.name)} . "${metadata.name}"` : undefined,
      metadata.bindings ? `${toNumber(mkeys.bindings)} . ${constructCnsBindingString(metadata.bindings)}` : undefined,
    ] : [])
  ]
    .filter(_ => _)
    .map(_ => `(${_})`).join(" ") + ")";

  return md;
}

function constructCnsBindingString(metadata: CnsBindingValues): string {
  const mkeys = getNftMetadataKeys();

  // construct unknown binding fields
  const cloned = Object.assign({}, metadata);
  delete cloned.address;
  delete cloned.did;
  delete cloned.publicKey;
  delete cloned.text;

  // emit warnings when extra binding fields exist, which is not good practise
  if (Object.keys(cloned).length > 0)
    console.warn(`Unknown CNS binding fields: ${Object.keys(cloned).join(",")}\nYou should consider add field to model to strong type it.`);

  const md = "(" + [
    metadata.address ? `${toNumber(mkeys.address)} . ${prefix0x(metadata.address)}` : undefined,
    metadata.did ? `${toNumber(mkeys.did)} . ${prefix0x(metadata.did)}` : undefined,
    metadata.publicKey ? `${toNumber(mkeys.publicKey)} . ${prefix0x(metadata.publicKey)}` : undefined,
    metadata.text ? `${toNumber(mkeys.text)} . "${metadata.text}"` : undefined,
    ...(Object.keys(cloned).map(_ => cloned[_] ? `"${_}" . "${cloned[_]}"` : undefined)),
  ]
    .filter(_ => _)
    .map(_ => `(${_})`).join(" ") + ")";

  return md;
}

function toNumber(hex: string | undefined): string | undefined {
  if (!hex) return hex;
  const num = parseInt(hex, 16);
  return num.toFixed(0);
}

function uriToStr(uri: string | string[] | undefined): string {
  if (!uri) return "";
  if (typeof uri === "string") return ` "${uri}"`;
  return " " + uri.map(_ => `"${_}"`).join(" ");
};

async function constructNftStatePuzzle(
  rawMetadata: string,
  metadata_updater_hash: string,
  inner_puzzle: string,
): Promise<string> {
  const curried_tail = await curryMod(
    modsprog["nft_state_layer"],
    prefix0x(modshash["nft_state_layer"]),
    rawMetadata,
    prefix0x(metadata_updater_hash),
    inner_puzzle
  );
  if (!curried_tail) throw new Error("failed to curry tail.");

  return curried_tail;
}

async function constructNftOwnershipPuzzle(currentOwner: string, transfer_program: string, inner_puzzle: string): Promise<string> {
  const curried_tail = await curryMod(
    modsprog["nft_ownership_layer"],
    prefix0x(modshash["nft_ownership_layer"]),
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

async function constructDidSpendBundle(
  didAnalysis: DidCoinAnalysisResult,
  nftLauncherId: string,
  net: NetworkContext,
): Promise<UnsignedSpendBundle> {
  const amount = 1n;
  const proof = await catBundle.getLineageProof(didAnalysis.coin.parent_coin_info, net.api, 2);
  const didInnerPuzzleHash0x = prefix0x(didAnalysis.didInnerPuzzleHash);
  if (proof.proof != didInnerPuzzleHash0x)
    throw new Error(`proof[${proof.proof}] should equal to did_inner_puzzle_hash[${didInnerPuzzleHash0x}]`);
  const didP2InnerPuzzleHash = prefix0x(await puzzle.getPuzzleHashFromPuzzle(didAnalysis.p2InnerPuzzle));
  const didSolution = `((${proof.coinId} ${proof.proof} ${proof.amount}) ${amount} (q (() (q (51 ${didInnerPuzzleHash0x} ${amount} (${didP2InnerPuzzleHash})) (62 ${prefix0x(nftLauncherId)})) ())))`;
  const didCoinSpend: CoinSpend = {
    coin: didAnalysis.coin,
    puzzle_reveal: prefix0x(await puzzle.encodePuzzle(didAnalysis.rawPuzzle)),
    solution: prefix0x(await puzzle.encodePuzzle(didSolution)),
  };

  return new UnsignedSpendBundle([didCoinSpend]);
}

export async function constructPureFeeSpendBundle(
  change_hex: Hex0x,
  fee: bigint,
  availcoins: SymbolCoins,
  requests: TokenPuzzleObserver[],
  net: NetworkContext,
  includeZeroCoin = true,
): Promise<UnsignedSpendBundle> {
  const feeTgts: TransferTarget[] = includeZeroCoin ? [{
    address: "0x0000000000000000000000000000000000000000000000000000000000000000",
    amount: 0n,
    symbol: net.symbol,
  }] : [];
  const feeSpendPlan = transfer.generateSpendPlan(availcoins, feeTgts, change_hex, fee, net.symbol);
  const bundle = await transfer.generateSpendBundleWithoutCat(feeSpendPlan, requests, [], net);
  return bundle;
}

function getNftMetadataKeys(): NftMetadataKeys & CnsMetadataKeys & CnsBindingKeys {
  const getHex = function (key: string): string {
    return key.split("").map(_ => _.charCodeAt(0).toString(16)).join("");
  }

  return {
    "imageUri": getHex("u"),
    "imageHash": getHex("h"),
    "metadataUri": getHex("mu"),
    "metadataHash": getHex("mh"),
    "licenseUri": getHex("lu"),
    "licenseHash": getHex("lh"),
    "serialNumber": getHex("sn"),
    "serialTotal": getHex("st"),

    "expiry": getHex("ex"),
    "name": getHex("nm"),
    "bindings": getHex("bd"),

    "address": getHex("ad"),
    "did": getHex("id"),
    "publicKey": getHex("pk"),
    "text": getHex("tt"),
  };
}

export function getNftMetadataInfo(parsed: ParsedMetadata): MetadataValues {
  const mkeys = getNftMetadataKeys();

  const obj: MetadataValues = {
    imageUri: hex2asc(parsed[mkeys.imageUri]) ?? "",
    imageHash: getScalar(parsed[mkeys.imageHash]),
    metadataUri: hex2asc(parsed[mkeys.metadataUri]) ?? "",
    metadataHash: getScalar(parsed[mkeys.metadataHash]) ?? "",
    licenseUri: hex2asc(parsed[mkeys.licenseUri]) ?? "",
    licenseHash: getScalar(parsed[mkeys.licenseHash]) ?? "",
    serialNumber: getScalar(parsed[mkeys.serialNumber]),
    serialTotal: getScalar(parsed[mkeys.serialTotal]),

    expiry: hex2decSingle(parsed[mkeys.expiry]),
    address: getScalar(parsed[mkeys.address]),
    name: hex2ascSingle(parsed[mkeys.name]),
    bindings: getCnsBindingsInfo(parsed[mkeys.bindings]),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.keys(obj).forEach(key => { if ((obj as any)[key] === undefined) delete (obj as any)[key]; });

  return obj;
}

export function getCnsBindingsInfo(metalist: string | string[] | undefined): CnsBindingValues | undefined {
  if (metalist === undefined) return undefined;
  if (!Array.isArray(metalist)) throw new Error("CNS binding input abnormal format.");
  const mkeys = getNftMetadataKeys();

  const parsed: ParsedMetadata = {};
  if (metalist.length == 0 || metalist.length % 2 != 0) throw new Error(`Face abnormal metalist: ` + JSON.stringify(metalist));
  for (let i = 0; i < metalist.length; i += 2) {
    const key = metalist.at(i);
    if (!key) throw new Error('Unexpected metalist: empty key.');
    const meta = metalist.at(i + 1);
    parsed[key] = meta;
  }

  const obj: CnsBindingValues = {
    address: getScalar(parsed[mkeys.address]),
    did: getScalar(parsed[mkeys.did]),
    publicKey: getScalar(parsed[mkeys.publicKey]),
    text: hex2ascSingle(parsed[mkeys.text]),
  };

  // assign extra unknown binding fields
  const cloned = Object.assign({}, parsed);
  delete cloned[mkeys.address];
  delete cloned[mkeys.did];
  delete cloned[mkeys.publicKey];
  delete cloned[mkeys.text];

  for (const key in cloned) {
    if (Object.prototype.hasOwnProperty.call(cloned, key)) {
      obj[Buffer.from(key, 'hex').toString()] = hex2ascSingle(cloned[key]);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.keys(obj).forEach(key => { if ((obj as any)[key] === undefined) delete (obj as any)[key]; });

  return obj;
}

export const getScalarString = function (input: string | string[] | undefined, prefer: 1 | "MustBeString" = 1): string | undefined {
  if (!input) return input;
  if (typeof input === "string") return input;
  if (prefer == "MustBeString" && typeof input !== "string") throw new Error("metadata abnormally present a array");
  return prefer == 1 ? input[0] : input.slice(-1)[0];
}

const getScalar = function (input: string | string[] | undefined): string | undefined {
  return getScalarString(input, "MustBeString");
}