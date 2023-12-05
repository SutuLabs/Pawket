
export interface TibetTokenEntity {
  asset_id: string;
  pair_id: string;
  name: string;
  short_name: string;
  image_url: string;
  verified: boolean;
}
export interface TibetPairEntity {
  launcher_id: string;
  asset_id: string;
  liquidity_asset_id: string;
  xch_reserve: number;
  token_reserve: number;
  liquidity: number;
  last_coin_id_on_chain: string;
}
export interface TibetQuoteEntity {
  amount_in: number;
  amount_out: number;
  asset_id: string;
  fee: number;
  input_reserve: number;
  output_reserve: number;
  price_impact: number;
  price_warning: boolean;
}

const rpcUrls: { [chainId: string]: string } = {
  "ae83525ba8d1dd3f09b277de18ca3e43fc0af20d20c4b3e92ef2a48bd291ccb2": "https://api.v2-testnet10.tibetswap.io",
  "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb": "https://api.v2.tibetswap.io/"
}

export function isSwapAvailable(chainId: string) {
  return !!rpcUrls[chainId]
}

export async function getSwapTokens(chainId: string): Promise<TibetTokenEntity[]> {
  const resp = await fetch(rpcUrls[chainId] + "/tokens");
  const tokens = (await resp.json()) as TibetTokenEntity[];
  return tokens;
}

export async function getSwapPair(pairId: string, chainId: string): Promise<TibetPairEntity> {
  const resp = await fetch(rpcUrls[chainId] + `/pair/${pairId}`);
  const pair = (await resp.json()) as TibetPairEntity;
  return pair;
}
export async function getSwapQuote(
  pairId: string,
  sellAmount: bigint | string,
  sellType: 'xch' | 'cat',
  chainId: string
): Promise<TibetQuoteEntity> {
  const resp = await fetch(
    rpcUrls[chainId] + `/quote/${pairId}` +
    `?amount_in=${sellAmount}` +
    `&xch_is_input=${sellType == 'xch'}` +
    `&estimate_fee=true`
  );

  const quote = (await resp.json()) as TibetQuoteEntity;
  return quote;
}

// Input ≈ sell
// Output ≈ buy
const liquidityFee = 7n; // 0.7%
export function getSellPrice(sell_amount: bigint, sell_reserve: bigint, buy_reserve: bigint): bigint {
  if (sell_amount == 0n) return 0n;

  const sell_amount_with_fee = sell_amount * (1000n - liquidityFee);
  const numerator = sell_amount_with_fee * buy_reserve;
  const denominator = sell_reserve * 1000n + sell_amount_with_fee;
  return numerator / denominator;
}

export function getBuyPrice(buy_amount: bigint, sell_reserve: bigint, buy_reserve: bigint): bigint {
  if (buy_amount > buy_reserve) return 0n;
  if (buy_amount == 0n) return 0n;

  const numerator = sell_reserve * buy_amount * 1000n;
  const denominator = (buy_reserve - buy_amount) * (1000n - liquidityFee);
  return numerator / denominator + 1n;
}

export function getPriceImpact(buy_reserve: bigint, buy_amount: bigint): number {
  // Formula used:
  // y = token_b_liquidity_pool
  // dy = number of tokens the user will get (based on their input)
  // price_impact = (y - dy)**2 / y**2 - 1
  const y = buy_reserve;
  const dy = buy_amount;
  const ddy = y - dy;
  const price_impact = -((ddy * ddy * 10000n) / (y * y) - 10000n);
  return Number(price_impact) / 100;
}