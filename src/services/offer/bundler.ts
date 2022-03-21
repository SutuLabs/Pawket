import { CoinSpend, SpendBundle } from "@/models/wallet";
import { Bytes } from "clvm";
import { CoinConditions, ConditionType, prefix0x } from '@/services/coin/condition';
import puzzle from "../crypto/puzzle";
import { ConditionOpcode } from "../coin/opcode";
import transfer, { GetPuzzleApiCallback, SymbolCoins, TransferTarget } from "../transfer/transfer";
import { TokenPuzzleDetail } from "../crypto/receive";
import catBundle from "../transfer/catBundle";
import stdBundle from "../transfer/stdBundle";
import { OfferEntity, OfferPlan, OfferSummary } from "./summary";
import store from "@/store";

export async function generateOffer(
  offered: OfferPlan[],
  requested: OfferEntity[],
  puzzles: TokenPuzzleDetail[],
  nonceHex: string | null = null,
  getPuzzle: GetPuzzleApiCallback | null = null,
): Promise<SpendBundle> {
  if (offered.length != 1 || requested.length != 1) throw new Error("currently, only support single offer/request");
  if (offered[0].id && offered[0].plan.coins.length != 1) throw new Error("currently, only support single coin for CAT");

  const settlement_tgt = "0xbae24162efbd568f89bc7a340798a6118df0189eb9e3f8697bcea27af99f8f79";
  const cat_settlement_tgt = "0x54164c700ed2fd4349227e4e346d0d22c92b694bf1ef9ce10fe9b0686390ca87";
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
  // generate requested
  for (let i = 0; i < requested.length; i++) {
    const req = requested[i];
    if (!req.id) {// XCH
      const coin = {
        parent_coin_info: "0x0000000000000000000000000000000000000000000000000000000000000000",
        puzzle_hash: settlement_tgt,
        amount: 0n,
      };

      const puzzle_reveal_text = puzzle.getSettlementPaymentsPuzzle();

      // put special target into puzzle reverse dict
      puzzles.filter(_ => _.symbol == "XCH")[0].puzzles.push({
        privateKey: puzzle.getEmptyPrivateKey(), // this private key will not really calculated due to no AGG_SIG_ME exist in this spend
        puzzle: puzzle_reveal_text,
        hash: settlement_tgt,
        address: "",
      })

      const solution_text = `((${prefix0x(nonce)} (${prefix0x(req.target)} ${req.amount} ())))`;
      const msg = await getPuzAnnoMsg(puzzle_reveal_text, solution_text);
      puz_anno_ids.push(getPuzzleAnnoId(coin.puzzle_hash, msg));

      const puzzle_reveal = prefix0x(await puzzle.encodePuzzle(puzzle_reveal_text));
      const solution = prefix0x(await puzzle.encodePuzzle(solution_text));

      spends.push({ coin, solution, puzzle_reveal })
    }
    else {
      if (!req.symbol) throw new Error("symbol cannot be empty.");

      const coin = {
        parent_coin_info: "0x0000000000000000000000000000000000000000000000000000000000000000",
        puzzle_hash: cat_settlement_tgt,
        amount: 0n,
      };

      const puzzle_reveal_text = puzzle.getCatSettlementPuzzle(req.id);

      // put special target into puzzle reverse dict
      puzzles.filter(_ => _.symbol == req.symbol)[0].puzzles.push({
        privateKey: puzzle.getEmptyPrivateKey(), // this private key will not really calculated due to no AGG_SIG_ME exist in this spend
        puzzle: puzzle_reveal_text,
        hash: cat_settlement_tgt,
        address: "",
      })

      const solution_text = `((${prefix0x(nonce)} (${prefix0x(req.target)} ${req.amount} (${prefix0x(req.target)}))))`;
      const msg = await getPuzAnnoMsg(puzzle.getSettlementPaymentsPuzzle(), solution_text);
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
    if (off.id) {//CAT
      for (let j = 0; j < off.plan.coins.length; j++) {
        // const coin = off.plan.coins[j];
        const conds = getPuzzleAnnoConditions();

        const css = await catBundle.generateCoinSpends(off.plan, puzzles, conds, getPuzzle);
        spends.push(...css);
      }
    } else {
      for (let j = 0; j < off.plan.coins.length; j++) {
        // const coin = off.plan.coins[j];
        const conds = getPuzzleAnnoConditions();

        const css = await stdBundle.generateCoinSpends(off.plan, puzzles, conds);
        spends.push(...css);
      }
    }
  }

  // combine into one spendbundle
  return transfer.getSpendBundle(spends, puzzles);
}

export function sha256(...args: (string | Uint8Array)[]): string {
  const cont = new Uint8Array(args.map(_ => Bytes.from(_, "hex").raw()).reduce((acc, cur) => [...acc, ...cur], [] as number[]));
  const result = Bytes.SHA256(cont);
  return prefix0x(result.hex());
}

const settlement_tgt = "0xbae24162efbd568f89bc7a340798a6118df0189eb9e3f8697bcea27af99f8f79";

export async function generateOfferPlan(
  offered: OfferEntity[],
  change_hex: string,
  availcoins: SymbolCoins,
  fee: bigint,
): Promise<OfferPlan[]> {
  const plans: OfferPlan[] = [];
  change_hex = prefix0x(change_hex);

  for (let i = 0; i < offered.length; i++) {
    const off = offered[i];

    const tgt: TransferTarget = {
      address: settlement_tgt,
      amount: off.amount,
      symbol: off.symbol ?? "XCH",
      memos: off.symbol == "XCH" ? undefined : [settlement_tgt],
    };

    const plan = transfer.generateSpendPlan(availcoins, [tgt], change_hex, fee);
    const keys = Object.keys(plan);
    if (keys.length != 1) {
      throw new Error("spend plan must be 1");
    }

    const offplan = { id: off.id, plan: plan[keys[0]] };
    plans.push(offplan);
  }

  return plans;
}

export function getReversePlan(
  summary: OfferSummary,
  change_hex: string,
): OfferSummary {
  return { offered: summary.requested, requested: summary.offered.map(_ => Object.assign({}, _, { target: change_hex })) };
}

export async function combineSpendBundle(
  spendbundles: SpendBundle[]
): Promise<SpendBundle> {
  if (!store.state.app.bls) throw new Error("bls not initialized");
  const BLS = store.state.app.bls;
  const sigs = spendbundles.map(_ => BLS.G2Element.from_bytes(Bytes.from(_.aggregated_signature, "hex").raw()));
  const agg_sig = BLS.AugSchemeMPL.aggregate(sigs);
  const sig = Bytes.from(agg_sig.serialize()).hex();
  const spends = spendbundles.flatMap(_ => _.coin_spends);
  return {
    aggregated_signature: sig,
    coin_spends: spends,
  }
}