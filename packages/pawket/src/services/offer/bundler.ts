import { CoinSpend, OriginCoin, SpendBundle, UnsignedSpendBundle } from "../spendbundle";
import { Bytes } from "clvm";
import { CoinConditions, ConditionType, Hex0x, prefix0x, unprefix0x } from '../coin/condition';
import puzzle, { ConditionArgs, PlaintextPuzzle } from "../crypto/puzzle";
import { ConditionOpcode } from "../coin/opcode";
import transfer, { SymbolCoins, TransferTarget } from "../transfer/transfer";
import { TokenPuzzleDetail, TokenPuzzleObserver } from "../crypto/receive";
import catBundle from "../transfer/catBundle";
import stdBundle from "../transfer/stdBundle";
import { getOfferSummary, OfferEntity, OfferPlan, OfferSummary } from "./summary";
import { GetParentPuzzleResponse } from "@/models/api";
import { assemble, curry, disassemble } from "clvm_tools";
import { modshash, modshex0x, modsprog } from "../coin/mods";
import { getCoinName, getCoinName0x, NetworkContext } from "../coin/coinUtility";
import { Instance } from "../util/instance";
import { NftCoinAnalysisResult } from "@/models/nft";
import { generateTransferNftBundle, getTransferNftPuzzle, getTransferNftSolution } from "../coin/nft";
import crypto from "../crypto/isoCrypto"

export async function generateOffer(
  offered: OfferPlan[],
  requested: OfferEntity[],
  puzzles: TokenPuzzleObserver[],
  net: NetworkContext,
  nonceHex: string | null = null,
  catModName: "cat_v1" | "cat_v2" = "cat_v2",
  settlementModName: "settlement_payments" | "settlement_payments_v1" = "settlement_payments_v1",
): Promise<UnsignedSpendBundle> {
  if (offered.length != 1 || requested.length != 1) throw new Error("currently, only support single offer/request");

  const settlement_tgt = prefix0x(modshash[settlementModName]);
  const spends: CoinSpend[] = [];
  const puz_anno_ids: string[] = [];
  const getNonce = () => {
    const nonceArr = new Uint8Array(256 / 8);
    crypto.getRandomValues(nonceArr)
    return Bytes.from(nonceArr).hex();
  }
  const nonce = nonceHex ?? getNonce();
  // console.log("nonce=",nonce)
  const getPuzAnnoMsg = async (puz: string, solution: string): Promise<Uint8Array> => {
    const output = await puzzle.calcPuzzleResult(puz, solution);
    const conds = puzzle.parseConditions(output);
    const cannos = conds.filter(_ => _.code == ConditionOpcode.CREATE_PUZZLE_ANNOUNCEMENT);
    if (cannos.length != 1) throw new Error("Unexpected result of create puzzle");
    const canno = cannos[0];
    return canno.args[0] as Uint8Array;
  };
  const getPuzzleAnnoId = (coin_puzzle_hash: string, puz_anno_msg: Uint8Array): string => {
    const puz_anno_id = sha256(coin_puzzle_hash, puz_anno_msg);
    return puz_anno_id;
  }

  const puzzleCopy: TokenPuzzleDetail[] = puzzles.map((_) => Object.assign({}, { symbol: _.symbol, puzzles: Object.assign([], _.puzzles) }))

  // generate requested
  for (let i = 0; i < requested.length; i++) {
    const req = requested[i];
    if (!req.id) {// XCH
      const coin: OriginCoin = {
        parent_coin_info: "0x0000000000000000000000000000000000000000000000000000000000000000",
        puzzle_hash: settlement_tgt,
        amount: 0n,
      };

      const puzzle_reveal_text = modsprog[settlementModName];

      // put special target into puzzle reverse dict
      puzzleCopy.filter(_ => _.symbol == net.symbol)[0].puzzles.push({
        privateKey: puzzle.getEmptyPrivateKey(), // this private key will not really calculated due to no AGG_SIG_ME exist in this spend
        synPubKey: "()", // same reason as above
        puzzle: puzzle_reveal_text,
        hash: settlement_tgt,
        address: "",
      })

      const solution_text = `((${prefix0x(nonce)} (${req.target} ${req.amount} ())))`;
      const msg = await getPuzAnnoMsg(puzzle_reveal_text, solution_text);
      puz_anno_ids.push(getPuzzleAnnoId(coin.puzzle_hash, msg));

      const puzzle_reveal = prefix0x(await puzzle.encodePuzzle(puzzle_reveal_text));
      const solution = prefix0x(await puzzle.encodePuzzle(solution_text));

      spends.push({ coin, solution, puzzle_reveal })
    }
    else {
      if (!req.symbol) throw new Error("symbol cannot be empty.");

      const assetId = req.id;
      const catClvmTreehash = prefix0x(modshash[catModName]);
      const cat_mod = await curryMod(modsprog[catModName], catClvmTreehash, prefix0x(assetId), modsprog[settlementModName]);
      if (!cat_mod) throw new Error("cannot curry cat");
      const cat_settlement_tgt = prefix0x(await puzzle.getPuzzleHashFromPuzzle(cat_mod));

      const coin: OriginCoin = {
        parent_coin_info: "0x0000000000000000000000000000000000000000000000000000000000000000",
        puzzle_hash: cat_settlement_tgt,
        amount: 0n,
      };

      const puzzle_reveal_text = cat_mod;

      // put special target into puzzle reverse dict
      puzzleCopy.filter(_ => _.symbol == req.symbol)[0].puzzles.push({
        privateKey: puzzle.getEmptyPrivateKey(), // this private key will not really calculated due to no AGG_SIG_ME exist in this spend
        synPubKey: "()", // same reason as above
        puzzle: puzzle_reveal_text,
        hash: cat_settlement_tgt,
        address: "",
      })

      const solution_text = `((${prefix0x(nonce)} (${req.target} ${req.amount} (${req.target}))))`;
      const msg = await getPuzAnnoMsg(modsprog[settlementModName], solution_text);
      puz_anno_ids.push(getPuzzleAnnoId(coin.puzzle_hash, msg));

      const puzzle_reveal = prefix0x(await puzzle.encodePuzzle(puzzle_reveal_text));
      const solution = prefix0x(await puzzle.encodePuzzle(solution_text));

      spends.push({ coin, solution, puzzle_reveal });
    }
  }

  if (puz_anno_ids.length != 1) throw new Error("unexpected puzzle annocement message number");

  // genreate offered
  const getPuzzleAnnoConditions = (): ConditionType[] => {
    const conds: ConditionType[] = [];
    for (let k = 0; k < puz_anno_ids.length; k++) {
      const puz_anno_id = puz_anno_ids[k];
      conds.push(CoinConditions.ASSERT_PUZZLE_ANNOUNCEMENT(puz_anno_id));
    }
    return conds;
  }

  for (let i = 0; i < offered.length; i++) {
    const off = offered[i];
    const conds = getPuzzleAnnoConditions();
    if (off.id) {//CAT
      spends.push(...await catBundle.generateCoinSpends(off.plan, puzzleCopy, conds, net.api));
    } else {
      spends.push(...await stdBundle.generateCoinSpends(off.plan, puzzleCopy, conds));
    }
  }

  return new UnsignedSpendBundle(spends);
}

export function sha256(...args: (Hex0x | string | Uint8Array | undefined | ConditionArgs)[]): string {
  const cont = new Uint8Array(args
    .filter((_): _ is Hex0x | string | Uint8Array | ConditionArgs[] => !!_)
    .map(_ => Array.isArray(_) ? new Uint8Array() : Bytes.from(typeof _ === "string" ? unprefix0x(_) : _, "hex").raw())
    .reduce((acc, cur) => [...acc, ...cur], [] as number[]));
  const result = Bytes.SHA256(cont);
  return prefix0x(result.hex());
}

export async function generateOfferPlan(
  offered: OfferEntity[],
  change_hex: Hex0x,
  availcoins: SymbolCoins,
  fee: bigint,
  tokenSymbol: string,
  royaltyFee: bigint | undefined = undefined,
  settlementModName: "settlement_payments" | "settlement_payments_v1" = "settlement_payments_v1",
): Promise<OfferPlan[]> {
  const plans: OfferPlan[] = [];

  for (let i = 0; i < offered.length; i++) {
    const off = offered[i];

    const settlement_tgt = prefix0x(modshash[settlementModName]);
    const tgt: TransferTarget = {
      address: settlement_tgt,
      amount: off.amount,
      symbol: off.symbol ?? tokenSymbol,
      memos: off.symbol == tokenSymbol ? undefined : [settlement_tgt],
    };

    const royaltyTgt: TransferTarget = {
      address: settlement_tgt,
      amount: royaltyFee ?? 0n,
      symbol: tokenSymbol,
      memos: undefined,
    };
    // always create royalty coin even it's 0, the official client generate puzzle assert for that coin
    // start from settlement_payments_v1, royalty coin with 0 is not required
    const tgts = royaltyFee === undefined
      ? [tgt]
      : (settlementModName === "settlement_payments" || royaltyFee > 0)
        ? [tgt, royaltyTgt]
        : [tgt]

    const plan = transfer.generateSpendPlan(availcoins, tgts, change_hex, fee, tokenSymbol);
    const keys = Object.keys(plan);
    if (keys.length > 1) {
      throw new Error(`spend plan must be less than 1, currently are ${keys.length}: ${keys.join(", ")}`);
    }

    const offplan = { id: off.id, plan: plan[keys[0]] };
    plans.push(offplan);
  }

  return plans;
}

export function getReversePlan(
  summary: OfferSummary,
  change_hex: string,
  cats: { [id: string]: string },
): OfferSummary {
  return {
    offered: summary.requested.map(_ => Object.assign({}, _, { symbol: cats[_.id] })),
    requested: summary.offered.map(_ => Object.assign({}, _, { target: change_hex, symbol: cats[_.id] })),
    settlementModName: summary.settlementModName,
  };
}

export async function combineOfferSpendBundle(
  spendbundles: SpendBundle[],
  settlementModName: "settlement_payments" | "settlement_payments_v1" = "settlement_payments_v1",
): Promise<SpendBundle> {
  if (spendbundles.length != 2) throw new Error("unexpected length of spendbundle");

  const settlement_tgt = prefix0x(modshash[settlementModName]);
  const BLS = Instance.BLS;
  if (!BLS) throw new Error("BLS not initialized");
  const sigs = spendbundles.map((_) => BLS.G2Element.from_bytes(Bytes.from(_.aggregated_signature, "hex").raw()));
  const agg_sig = BLS.AugSchemeMPL.aggregate(sigs);
  const sig = Bytes.from(agg_sig.serialize()).hex();
  const spendbundlesCopy = spendbundles.map(sp => <SpendBundle>{
    aggregated_signature: sp.aggregated_signature,
    coin_spends: sp.coin_spends.map(csp => <CoinSpend>{
      coin: <OriginCoin>{
        amount: csp.coin.amount,
        parent_coin_info: csp.coin.parent_coin_info,
        puzzle_hash: csp.coin.puzzle_hash
      },
      puzzle_reveal: csp.puzzle_reveal,
      solution: csp.solution
    })
  })
  const summaries = await Promise.all(spendbundlesCopy.map((_) => getOfferSummary(_)));
  for (let i = 0; i < summaries.length; i++) {
    const summary = summaries[i];

    if (summary.requested.length != 1) throw new Error("unexpected length of request");
    const req = summary.requested[0];
    const reqcs = req.coin;
    if (!reqcs?.coin) throw new Error("unknown request coin");
    const offcss = summaries[(i + 1) % summaries.length].offered;
    if (!(offcss.length == 1
      || (offcss.length > 1 && offcss.every(_ => getCoinName(_.coin?.coin) == getCoinName(offcss[0].coin?.coin)))))
      throw new Error("unexpected length of offer coin spends");
    const offcs = offcss[0].coin;
    if (!offcs?.coin) throw new Error("unknown offer coin");

    let cat_target: Hex0x | undefined = undefined;

    if (req.id) {
      const sumoffs = summaries[(i + 1) % summaries.length].offered;
      if (!(sumoffs.length == 1
        || (sumoffs.length > 1 && sumoffs.every(_ => _.cat_target == sumoffs[0].cat_target))))
        throw new Error("unexpected length of summary offers");
      cat_target = sumoffs[0].cat_target;
    }
    reqcs.coin.parent_coin_info = getCoinName0x(offcs.coin);
    reqcs.coin.amount = req.amount;

    if (req.id && req.nft_target) { // generate nft solution
      const localPuzzleApiCall = async function (): Promise<GetParentPuzzleResponse> {
        return {
          parentCoinId: "",
          amount: Number(offcs.coin.amount),
          parentParentCoinId: offcs.coin.parent_coin_info,
          puzzleReveal: offcs.puzzle_reveal,
        };
      };
      const proof = await catBundle.getLineageProof(getCoinName0x(offcs.coin), localPuzzleApiCall, 2);
      const lsol = await puzzle.disassemblePuzzle(reqcs.solution);
      const lsolr = lsol.substring(1, lsol.length - 1);
      const solution = await getTransferNftSolution(proof, lsolr);
      reqcs.solution = prefix0x(await puzzle.encodePuzzle(solution));
    } else if (req.id) { // generate cat solution
      const inner_puzzle = await puzzle.disassemblePuzzle(reqcs.solution);
      if (!cat_target) throw new Error("cat target should be parsed");
      const offnewcoin: OriginCoin = {
        parent_coin_info: getCoinName0x(offcs.coin),
        amount: req.amount,
        puzzle_hash: cat_target,
      };

      const localPuzzleApiCall = async function (): Promise<GetParentPuzzleResponse> {
        return {
          parentCoinId: "",
          amount: Number(offcs.coin.amount),
          parentParentCoinId: offcs.coin.parent_coin_info,
          puzzleReveal: offcs.puzzle_reveal,
        };
      };
      const proof = await catBundle.getLineageProof(getCoinName0x(offcs.coin), localPuzzleApiCall);
      const solution = catBundle.getCatPuzzleSolution(inner_puzzle, offnewcoin, offnewcoin, offnewcoin, settlement_tgt, 0n, proof);
      reqcs.solution = prefix0x(await puzzle.encodePuzzle(solution));
    }
  }

  const spends = spendbundlesCopy.flatMap((_) => _.coin_spends);
  return {
    aggregated_signature: prefix0x(sig),
    coin_spends: spends,
  };
}

export async function generateNftOffer(
  offered: OfferPlan[],
  nft: NftCoinAnalysisResult,
  nftcoin: OriginCoin | undefined,
  requested: OfferEntity[],
  puzzles: TokenPuzzleObserver[],
  net: NetworkContext,
  nonceHex: string | null = null,
  settlementModName: "settlement_payments" | "settlement_payments_v1" = "settlement_payments_v1",
): Promise<UnsignedSpendBundle> {
  const settlement_tgt = prefix0x(modshash[settlementModName]);
  const spends: CoinSpend[] = [];
  const puz_anno_ids: string[] = [];
  const getNonce = () => {
    const nonceArr = new Uint8Array(256 / 8);
    crypto.getRandomValues(nonceArr);
    return Bytes.from(nonceArr).hex();
  };
  const nonce = nonceHex ?? getNonce();
  // console.log("nonce=", nonce)
  const getPuzAnnoMsg = async (puz: string, solution: string): Promise<Uint8Array> => {
    const output = await puzzle.calcPuzzleResult(puz, solution);
    const conds = puzzle.parseConditions(output);
    const cannos = conds.filter((_) => _.code == ConditionOpcode.CREATE_PUZZLE_ANNOUNCEMENT);
    if (cannos.length != 1) throw new Error("Unexpected result of create puzzle");
    const canno = cannos[0];
    return canno.args[0] as Uint8Array;
  };
  const getPuzzleAnnoId = (coin_puzzle_hash: string, puz_anno_msg: Uint8Array): string => {
    const puz_anno_id = sha256(coin_puzzle_hash, puz_anno_msg);
    return puz_anno_id;
  };

  const puzzleCopy: TokenPuzzleObserver[] = puzzles.map((_) => Object.assign({}, { symbol: _.symbol, puzzles: Object.assign([], _.puzzles) }))

  // put special target into puzzle reverse dict
  puzzleCopy
    .filter((_) => _.symbol == net.symbol)[0]
    .puzzles.push({
      synPubKey: "()", // this syn pub key will not really calculated due to no AGG_SIG_ME exist in this spend
      puzzle: modsprog[settlementModName],
      hash: settlement_tgt,
      address: "",
    });

  // console.log("generating requested", requested);
  // generate requested
  for (let i = 0; i < requested.length; i++) {
    const req = requested[i];
    if (!req.id) {
      // XCH
      const coin: OriginCoin = {
        parent_coin_info: "0x0000000000000000000000000000000000000000000000000000000000000000",
        puzzle_hash: settlement_tgt,
        amount: 0n,
      };

      const puzzle_reveal_text = modsprog[settlementModName];

      const solution_text = `((${prefix0x(nonce)} (${req.target} ${req.amount} (${req.target}))))`;
      const msg = await getPuzAnnoMsg(puzzle_reveal_text, solution_text);
      puz_anno_ids.push(getPuzzleAnnoId(coin.puzzle_hash, msg));

      const puzzle_reveal = prefix0x(await puzzle.encodePuzzle(puzzle_reveal_text));
      const solution = prefix0x(await puzzle.encodePuzzle(solution_text));

      spends.push({ coin, solution, puzzle_reveal });
    } else {
      const nftPuzzle = await getTransferNftPuzzle(nft, modsprog[settlementModName]);
      const nftPuzzleHash = prefix0x(await puzzle.getPuzzleHashFromPuzzle(nftPuzzle));

      const coin: OriginCoin = {
        parent_coin_info: "0x0000000000000000000000000000000000000000000000000000000000000000",
        puzzle_hash: nftPuzzleHash,
        amount: 0n,
      };

      // put special target into puzzle reverse dict
      puzzleCopy
        .filter((_) => _.symbol == net.symbol)[0]
        .puzzles.push({
          synPubKey: "()", // this syn pub key will not really calculated due to no AGG_SIG_ME exist in this spend
          puzzle: nftPuzzle,
          hash: nftPuzzleHash,
          address: "",
        });

      // console.log("puzzleCopy", puzzleCopy);
      const solution_text = `((${prefix0x(nonce)} (${req.target} ${req.amount} (${req.target}))))`;
      const msg = await getPuzAnnoMsg(modsprog["settlement_payments_v1"], solution_text);
      puz_anno_ids.push(getPuzzleAnnoId(coin.puzzle_hash, msg));

      const puzzle_reveal = prefix0x(await puzzle.encodePuzzle(nftPuzzle));
      const solution = prefix0x(await puzzle.encodePuzzle(solution_text));

      const sp = { coin, solution, puzzle_reveal };
      spends.push(sp);
    }
  }

  if (puz_anno_ids.length != 1) throw new Error(`unexpected puzzle annocement message number: ${puz_anno_ids.length}`);

  // console.log("generating offered");
  // genreate offered
  const getPuzzleAnnoConditions = (): ConditionType[] => {
    const conds: ConditionType[] = [];
    for (let k = 0; k < puz_anno_ids.length; k++) {
      const puz_anno_id = puz_anno_ids[k];
      conds.push(CoinConditions.ASSERT_PUZZLE_ANNOUNCEMENT(puz_anno_id));
    }
    return conds;
  };

  for (let i = 0; i < offered.length; i++) {
    const off = offered[i];
    const conds = getPuzzleAnnoConditions();
    if (off.id) {
      //NFT
      if (nftcoin) {
        const spbundle: UnsignedSpendBundle = await generateTransferNftBundle(
          puzzle.getAddressFromPuzzleHash(settlement_tgt, net.symbol),
          puzzle.getAddressFromPuzzleHash("0x0000000000000000000000000000000000000000000000000000000000000000", net.symbol),
          0n,
          nftcoin,
          nft,
          {},
          puzzles,
          net,
          undefined,
          conds,
        );
        puzzleCopy
          .filter((_) => _.symbol == net.symbol)[0]
          .puzzles.push({
            synPubKey: "()",
            puzzle: "()",
            hash: nftcoin.puzzle_hash,
            address: "",
          });
        spends.push(...spbundle.coin_spends);
      }
    } else {
      const sp = await stdBundle.generateCoinSpends(off.plan, puzzleCopy, conds);
      spends.push(...sp);
      // create royalty coin
      const parent = getCoinName0x(sp[sp.length - 1].coin);
      // royalty_amount = uint64(offered_amount * royalty_percentage / 10000)
      const amount = (off.plan.targets[0].amount * BigInt(nft.tradePricePercentage)) / BigInt(10000);
      // original settlement_payments implementation always has one zero royalty coin if applicable,
      // but settlement_payments_v1 don't have this zero royalty coin
      if (amount > 0 || settlementModName == "settlement_payments") {
        const solution_text = `((${prefix0x(nft.launcherId)} (${prefix0x(nft.royaltyAddress)} ${amount} (${prefix0x(
          nft.royaltyAddress
        )}))))`;
        const solution = prefix0x(await puzzle.encodePuzzle(solution_text));
        const roysp: CoinSpend = {
          coin: {
            parent_coin_info: parent,
            amount,
            puzzle_hash: settlement_tgt,
          },
          puzzle_reveal: modshex0x[settlementModName],
          solution,
        };
        spends.push(roysp);
      }
    }
  }

  return new UnsignedSpendBundle(spends);
}

export async function curryMod(mod: string, ...args: string[]): Promise<PlaintextPuzzle | null> {
  try {
    const m = assemble(mod);
    const astr = "(" + args.join(" ") + ")";
    const as = assemble(astr);
    const [, prog] = curry(m, as);

    const mods = disassemble(prog);
    return mods;
  } catch (err) {
    console.warn(`failed to curry args [${args}] to mod [${mod}]`, err)
    return null;
  }
}