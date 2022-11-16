import { CoinSpend, combineSpendBundle, OriginCoin, UnsignedSpendBundle } from "../spendbundle";
import { Hex0x, prefix0x } from "../coin/condition";
import puzzle from "../crypto/puzzle";
import { TokenPuzzleObserver } from "../crypto/receive";
import transfer, { SymbolCoins, TransferTarget } from "../transfer/transfer";
import { curryMod } from "../offer/bundler";
import { modshash, modsprog } from "../coin/mods";
import { getCoinName0x, NetworkContextWithOptionalApi } from "../coin/coinUtility";

export interface MintCatInfo {
  spendBundle: UnsignedSpendBundle;
  assetId: Hex0x;
  catPuzzle: PuzzleInfo;
}

interface CatPuzzleResponse {
  innerPuzzle: PuzzleInfo;
  catPuzzle: PuzzleInfo;
  assetId: Hex0x;
  bootstrapCoin: Hex0x;
}

interface PuzzleInfo {
  plaintext: string;
  hash: Hex0x;
}

export async function generateMintCatBundle(
  targetAddress: string,
  changeAddress: string,
  amount: bigint,
  fee: bigint,
  memo: string,
  availcoins: SymbolCoins,
  requests: TokenPuzzleObserver[],
  net: NetworkContextWithOptionalApi,
  catModName: "cat_v1" | "cat_v2" = "cat_v2",
): Promise<MintCatInfo> {
  const tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(targetAddress));
  const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(changeAddress));

  // there is error in checking this regular expression
  // eslint-disable-next-line no-useless-escape
  memo = memo.replace(/[&/\\#,+()$~%.'":*?<>{}\[\] ]/g, "_");

  const { innerPuzzle, catPuzzle, assetId, bootstrapCoin } = await constructCatPuzzle(tgt_hex, change_hex, amount, fee, memo, availcoins, net.symbol, catModName);
  const ibundle = await constructInternalBundle(catPuzzle.hash, change_hex, amount, fee, availcoins, requests, net);
  const ebundle = await constructExternalBundle(innerPuzzle, catPuzzle, bootstrapCoin, amount);
  const bundle = combineSpendBundle(ibundle, ebundle);

  return {
    spendBundle: bundle,
    assetId,
    catPuzzle,
  }
}

async function constructCatPuzzle(
  tgt_hex: Hex0x,
  change_hex: Hex0x,
  amount: bigint,
  fee: bigint,
  memo: string,
  availcoins: SymbolCoins,
  tokenSymbol: string,
  catModName: "cat_v1" | "cat_v2" = "cat_v2",
): Promise<CatPuzzleResponse> {
  const baseSymbol = Object.keys(availcoins)[0];
  const itgts: TransferTarget[] = [
    { address: "0x0000000000000000000000000000000000000000000000000000000000000000", amount, symbol: baseSymbol },
  ];

  const tempplan = transfer.generateSpendPlan(availcoins, itgts, change_hex, fee, tokenSymbol);
  const catmod = prefix0x(modshash[catModName]);
  const bootstrapCoin = getCoinName0x(tempplan[baseSymbol].coins[0]);
  const curried_tail = await curryMod(modsprog["genesis_by_coin_id"], bootstrapCoin);
  if (!curried_tail) throw new Error("failed to curry tail.");

  const tail_hash = prefix0x(await puzzle.getPuzzleHashFromPuzzle(curried_tail));
  const inner_puzzle = `(q (51 () -113 ${curried_tail} ()) (51 ${tgt_hex} ${amount} (${tgt_hex} ${memo})))`;
  const inner_puzzle_hash = prefix0x(await puzzle.getPuzzleHashFromPuzzle(inner_puzzle));

  const catPuzzle = await curryMod(modsprog[catModName], catmod, tail_hash, inner_puzzle);
  if (!catPuzzle) throw new Error("failed to curry cat.");
  const catPuzzleHash = prefix0x(await puzzle.getPuzzleHashFromPuzzle(catPuzzle));

  return {
    innerPuzzle: { plaintext: inner_puzzle, hash: inner_puzzle_hash },
    catPuzzle: { plaintext: catPuzzle, hash: catPuzzleHash },
    assetId: tail_hash,
    bootstrapCoin,
  }
}

async function constructInternalBundle(
  tgt_hex: Hex0x,
  change_hex: Hex0x,
  amount: bigint,
  fee: bigint,
  availcoins: SymbolCoins,
  requests: TokenPuzzleObserver[],
  net: NetworkContextWithOptionalApi,
): Promise<UnsignedSpendBundle> {
  const baseSymbol = Object.keys(availcoins)[0];
  const tgts: TransferTarget[] = [{ address: tgt_hex, amount, symbol: baseSymbol },];
  tgts[0].address = tgt_hex;
  const plan = transfer.generateSpendPlan(availcoins, tgts, change_hex, fee, net.symbol);
  const bundle = await transfer.generateSpendBundleWithoutCat(plan, requests, [], net);
  return bundle;
}

async function constructExternalBundle(
  innerPuzzle: PuzzleInfo,
  catPuzzle: PuzzleInfo,
  bootstrapCoin: Hex0x,
  amount: bigint,
): Promise<UnsignedSpendBundle> {
  const coin: OriginCoin = { parent_coin_info: bootstrapCoin, amount, puzzle_hash: catPuzzle.hash };
  const coin_name = getCoinName0x(coin);

  const catsln = `(() () ${coin_name} (${bootstrapCoin} ${catPuzzle.hash} ${amount}) (${bootstrapCoin} ${innerPuzzle.hash} ${amount}) () ())`;
  const puzzle_reveal = prefix0x(await puzzle.encodePuzzle(catPuzzle.plaintext));
  const solution = prefix0x(await puzzle.encodePuzzle(catsln));

  const coin_spends: CoinSpend[] = [{ coin, puzzle_reveal, solution }];

  return new UnsignedSpendBundle(coin_spends);
}