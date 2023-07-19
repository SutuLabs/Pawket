<template>
  <div class="modal-card margin-auto">
    <top-bar :title="$t('swap.ui.title')" @close="back()" :showClose="true"></top-bar>
    <section class="modal-card-body">
      <b-loading :is-full-page="false" v-model="loading"></b-loading>
      <template v-if="stage == 'sign'">
        <template v-if="swappableTokens.length > 0">
          <b-field v-if="false">
            <b-radio-button v-model="swapAction" expanded native-value="buy" type="is-success is-light is-outlined">
              <b-icon icon="briefcase"></b-icon>
              <span>Buy</span>
            </b-radio-button>

            <b-radio-button v-model="swapAction" expanded native-value="sell" type="is-success is-light is-outlined">
              <b-icon icon="cash"></b-icon>
              <span>Sell</span>
            </b-radio-button>
          </b-field>

          <b-field>
            <b-select placeholder="Select a Token" expanded v-model="swapToken">
              <option v-for="token in swappableTokens" :value="token.short_name" :key="token.asset_id">{{ token.name }}</option>
            </b-select>
          </b-field>
          <template v-if="swapToken">
            <simplified-token-amount-field
              v-model="amountFrom"
              :selectedToken="tokenFrom"
              :token-names="[tokenFrom]"
              :fee="fee"
              :label="$t('swap.ui.label.amount')"
              :max-amount="maxTokenFromAmount"
              :total-amount="totalTokenFromAmount"
              @input="changeFromAmount()"
            >
            </simplified-token-amount-field>
            <b-field class="center">
              <b-button icon-left="swap-vertical-circle" size="is-large" type="is-text" @click="swapDirection()" />
            </b-field>
            <simplified-token-amount-field
              v-model="amountTo"
              :selectedToken="tokenTo"
              :token-names="[tokenTo]"
              :fee="fee"
              :label="$t('swap.ui.label.amount')"
              :max-amount="maxTokenToAmount"
              :total-amount="totalTokenToAmount"
              @input="changeToAmount()"
            >
            </simplified-token-amount-field>
          </template>
          <template v-else> select a token to start </template>
          <fee-selector v-model="fee"></fee-selector>

          <b-field>
            <template #message>
              <div class="container my-5">
                <ul class="fee-container">
                  <li
                    v-if="priceComparison[0] && priceComparison[1]"
                    @click="selectedPriceComparison = selectedPriceComparison == 0 ? 1 : 0"
                  >
                    <!-- <span class="caption">Price</span> -->
                    <span class="fee">{{ priceComparison[selectedPriceComparison] }}</span>
                  </li>
                  <li>
                    <span class="caption">Price Impact</span>
                    <span class="fee" :class="'has-text-' + impactColor">{{ priceImpact.toFixed(2) }}%</span>
                  </li>
                  <li>
                    <span class="caption">Liquidity Fee</span>
                    <span class="fee">0.70%</span>
                  </li>
                  <li>
                    <span class="caption">Dev Fee</span>
                    <span class="fee">0.60%</span>
                  </li>
                </ul>
              </div>
            </template>
          </b-field>

          <b-field>
            <b-button :type="'is-' + impactColor" expanded icon-right="chevron-double-right" @click="checkOut()">{{
              $t("swap.ui.button.continue")
            }}</b-button>
          </b-field>
        </template>
        <template v-if="swappableTokens.length == 0 && !loading">
          <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
            You don't have swappable token. Swappable tokens:
            <b-taglist>
              <b-tag v-for="token in allPoolTokens" :key="token.asset_id" type="is-info">{{ token.short_name }}</b-tag>
            </b-taglist>
          </b-notification>
        </template></template
      >
      <template v-if="stage == 'confirm'">
        <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
          <span v-html="$sanitize($tc('send.ui.summary.notification'))"></span>
        </b-notification>

        <template v-if="summary">
          <div class="has-text-weight-bold px-5">
            <span class="is-size-6">Swap from</span>
            <span class="is-pulled-right">
              <span v-if="summary.fromToken == xchSymbol">
                {{ demojo(summary.fromAmount) }}
              </span>
              <span v-else>
                {{ demojo(summary.fromAmount, { unit: summary.fromToken, decimal: 3, symbol: "" }) }}
              </span>
            </span>
          </div>
          <div class="has-text-weight-bold px-5">
            <span class="is-size-6">To</span>
            <span class="is-pulled-right">
              <span v-if="summary.toToken == xchSymbol">
                {{ demojo(summary.toAmount) }}
              </span>
              <span v-else>
                {{ demojo(summary.toAmount, { unit: summary.toToken, decimal: 3, symbol: "" }) }}
              </span>
            </span>
          </div>
          <div class="py-2"></div>
          <div class="has-text-weight-bold px-5">
            <span class="is-size-6 has-text-grey">Tx {{ $t("sendSummary.ui.label.fee") }}</span>
            <span class="is-size-6 is-pulled-right has-text-grey">
              {{ demojo(summary.fee) }}
            </span>
          </div>
          <div class="has-text-weight-bold px-5">
            <span class="is-size-6 has-text-grey">Dev fee</span>
            <span class="is-size-6 is-pulled-right has-text-grey">
              {{ demojo(summary.devfee) }}
            </span>
          </div>
          <hr />
          <div class="has-text-weight-bold px-5">
            <span class="is-size-5">{{ $t("sendSummary.ui.label.total") }}</span>
            <span class="is-pulled-right is-size-5 has-text-primary">
              <span v-if="summary.fromToken == xchSymbol">
                {{ demojo(summary.total) }}
              </span>
              <span v-else>
                {{ demojo(summary.fromAmount, { unit: summary.fromToken, decimal: 3, symbol: "" }) }}
                <span v-if="summary.totalFee > 0"> + {{ demojo(summary.totalFee) }} </span>
              </span>
            </span>
          </div>
        </template>

        <hr />
        <bundle-summary :account="account" :bundle="bundle"></bundle-summary>
        <b-button :label="'backBtnName'" @click="stage = 'sign'"></b-button>
        <b-button
          class="is-pulled-right"
          :label="'confirmBtnName'"
          type="is-primary"
          @click="$emit('confirm')"
          :loading="loading"
        ></b-button>
      </template>
      <p class="mt-3 has-text-grey is-size-7 has-text-centered">
        {{ $t("swap.ui.attributingPrefix") }}
        <a :href="$t('swap.ui.linkUrl')" target="_blank"
          ><u> {{ $t("swap.ui.linkName") }} <i class="mdi mdi-open-in-new"></i></u></a
        >{{ $t("swap.ui.attributingSuffix") }}
      </p>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Emit, Watch, Prop } from "vue-property-decorator";
import TopBar from "@/components/Common/TopBar.vue";
import store from "@/store";
import SimplifiedTokenAmountField from "./SimplifiedTokenAmountField.vue";
import FeeSelector from "@/components/Send/FeeSelector.vue";
import { chainId, networkContext, xchSymbol } from "@/store/modules/network";
import { getCatIdDict, getCatNameDict, getCatNames } from "@/services/view/cat";
import { AccountEntity, OneTokenInfo } from "../../../../pawket-chia-lib/models/account";
import { TokenPuzzleDetail } from "../../../../pawket-chia-lib/services/crypto/receive";
import {
  getAssetsRequestDetail,
  getAssetsRequestObserver,
  getAvailableCoins,
  getAvailableCoinsWithRequests,
} from "@/services/view/coinAction";
import { SymbolCoins } from "../../../../pawket-chia-lib/services/transfer/transfer";
import { Hex, prefix0x } from "../../../../pawket-chia-lib/services/coin/condition";
import BuyUSDS from "../Home/BuyUSDS.vue";
import bigDecimal from "js-big-decimal";
import { isCryptoKey } from "util/types";
import { signSpendBundle, SpendBundle } from "../../../../pawket-chia-lib/services/spendbundle";
import BundleSummary from "@/components/Bundle/BundleSummary.vue";
import { getOfferEntities, OfferEntity, OfferTokenAmount } from "../../../../pawket-chia-lib/services/offer/summary";
import puzzle from "../../../../pawket-chia-lib/services/crypto/puzzle";
import { generateOffer, generateOfferPlan } from "../../../../pawket-chia-lib/services/offer/bundler";
import { lockCoins } from "../../../../pawket-chia-lib/services/coin/coinUtility";
import { encodeOffer } from "../../../../pawket-chia-lib/services/offer/encoding";
import { NotificationProgrammatic as Notification } from "buefy";
import { demojo } from "@/filters/unitConversion";

interface TibetTokenEntity {
  asset_id: string;
  pair_id: string;
  name: string;
  short_name: string;
  image_url: string;
  verified: boolean;
}
interface TibetPairEntity {
  launcher_id: string;
  asset_id: string;
  liquidity_asset_id: string;
  xch_reserve: number;
  token_reserve: number;
  liquidity: number;
  last_coin_id_on_chain: string;
}
interface TibetQuoteEntity {
  amount_in: number;
  amount_out: number;
  asset_id: string;
  fee: number;
  input_reserve: number;
  output_reserve: number;
  price_impact: number;
  price_warning: boolean;
}

type SwapActionType = "buy" | "sell";

// interface SwapCalculateEntity {
//   reserve: bigint;
//   decimal: number;
// }

@Component({
  components: {
    TopBar,
    SimplifiedTokenAmountField,
    FeeSelector,
    BundleSummary,
  },
})
export default class SwapPage extends Vue {
  @Prop() public account!: AccountEntity;
  public swapAction: SwapActionType = "buy";

  public loading = true;
  public fee = 0;
  public requests: TokenPuzzleDetail[] = [];
  public availcoins: SymbolCoins | null = null;
  public swappableTokens: TibetTokenEntity[] = [];
  public allPoolTokens: TibetTokenEntity[] = [];

  public swapToken: string | null = null;
  // public swapTokenInfo: TibetTokenEntity|null = null;
  public swapTokenPair: TibetPairEntity | null = null;
  public priceImpact = -1;
  public stage: "sign" | "confirm" = "sign";
  public bundle: SpendBundle | null = null;
  public summary: {
    fromToken: string;
    toToken: string;
    fromAmount: bigint;
    toAmount: bigint;
    fee: bigint;
    devfee: bigint;
    totalFee: bigint;
    total: bigint;
  } | null = null;
  public priceComparison: [string, string] = ["", ""];
  public selectedPriceComparison: 0 | 1 = 0;

  mounted(): void {
    this.loadInfo();
  }

  async loadInfo(): Promise<void> {
    this.loading = true;
    try {
      await this.loadSwapToken();
      await this.loadCoins();
    } finally {
      this.loading = false;
    }
  }

  async loadSwapToken(): Promise<void> {
    const resp = await fetch("https://api.v2-testnet10.tibetswap.io/tokens");
    const tokens = (await resp.json()) as TibetTokenEntity[];

    const localTokens = getCatNameDict(this.account);
    this.allPoolTokens = tokens;
    this.swappableTokens.splice(0, this.swappableTokens.length);
    // this.swappableTokens = [];
    // Vue.set(this, "swappableTokens", this.swappableTokens);
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (localTokens[prefix0x(t.asset_id)]) this.swappableTokens.push(t);
    }
    // console.log(this.allPoolTokens, this.swappableTokens);
  }

  async loadCoins(): Promise<void> {
    this.maxTokenToAmount = -1n;
    this.maxTokenFromAmount = -1n;
    this.amountFrom = "0";
    this.amountTo = "0";

    if (!this.requests || this.requests.length == 0) {
      this.requests = this.account.type == "PublicKey" ? [] : await getAssetsRequestDetail(this.account);
    }

    if (!this.availcoins) {
      try {
        this.availcoins =
          this.account.type == "PublicKey"
            ? await getAvailableCoins(this.account)
            : await getAvailableCoinsWithRequests(this.account, this.requests);
      } catch (err) {
        console.warn("Unable to get available coins");
      }
    }

    this.initializeMax();
  }

  initializeMax(): void {
    if (!this.availcoins || !this.availcoins[this.tokenFrom] || !this.availcoins[this.tokenTo]) {
      return;
    }

    const toavailcoins = this.availcoins[this.tokenTo].map((_) => _.amount);
    this.maxTokenToAmount = toavailcoins.reduce((a, b) => a + b, 0n);
    const fromavailcoins = this.availcoins[this.tokenFrom].map((_) => _.amount);
    this.maxTokenFromAmount = fromavailcoins.reduce((a, b) => a + b, 0n);
  }

  @Watch("swapAction")
  onSwapActionChange(): void {
    if (!this.swapToken) return;
    if (this.swapAction == "buy") {
      this.tokenFrom = xchSymbol();
      this.tokenTo = this.swapToken;
    } else {
      this.tokenFrom = this.swapToken;
      this.tokenTo = xchSymbol();
    }

    const t = this.amountFrom;
    this.amountFrom = this.amountTo;
    this.amountTo = t;
    this.initializeMax();
  }

  @Watch("swapToken")
  onSwapTokenChange(): void {
    if (!this.swapToken) return;
    const swap = this.allPoolTokens.filter((_) => _.short_name == this.swapToken)[0];
    this.loadPair(swap.pair_id);

    this.onSwapActionChange();

    this.amountFrom = "0";
    this.amountTo = "0";
  }

  async loadPair(pairId: string): Promise<void> {
    const resp = await fetch(`https://api.v2-testnet10.tibetswap.io/pair/${pairId}`);
    const pair = (await resp.json()) as TibetPairEntity;
    this.swapTokenPair = pair;
  }

  get impactColor(): string {
    if (this.priceImpact < 0) return "light";
    if (this.priceImpact < 5) return "primary";
    if (this.priceImpact < 10) return "warning";
    return "danger";
  }

  swapDirection(): void {
    this.swapAction = this.swapAction == "buy" ? "sell" : "buy";
  }

  public signing = false;
  public signed = false;
  public offerText = "";

  get catIds(): { [name: string]: string } {
    return getCatIdDict(this.account);
  }

  async checkOut(): Promise<void> {
    if (!this.swapTokenPair || !this.swapToken) return;
    if (!this.availcoins || !this.requests || !this.account.firstAddress) return;

    try {
      this.signing = true;

      const sellDecimal = this.swapAction == "buy" ? 12 : 3;
      const buyDecimal = this.swapAction == "buy" ? 3 : 12;
      const xch_is_input = this.swapAction == "buy" ? true : false;
      let mojo = bigDecimal.multiply(this.amountFrom, Math.pow(10, sellDecimal));

      const resp = await fetch(
        `https://api.v2-testnet10.tibetswap.io/quote/${this.swapTokenPair.launcher_id}` +
          `?amount_in=${mojo}` +
          `&xch_is_input=${xch_is_input}` +
          `&estimate_fee=true`
      );

      let quote = (await resp.json()) as TibetQuoteEntity;

      const buymojo = bigDecimal.multiply(this.amountTo, Math.pow(10, buyDecimal));
      const newmojo = this.getBuyPrice(BigInt(buymojo), BigInt(quote.input_reserve), BigInt(quote.output_reserve)).toString();
      // newmojo < mojo
      if (bigDecimal.compareTo(newmojo, mojo) == -1) mojo = newmojo;
      console.log(mojo, newmojo, quote);

      const resp2 = await fetch(
        `https://api.v2-testnet10.tibetswap.io/quote/${this.swapTokenPair.launcher_id}` +
          `?amount_in=${mojo}` +
          `&xch_is_input=${xch_is_input}` +
          `&estimate_fee=true`
      );
      quote = (await resp2.json()) as TibetQuoteEntity;

      console.log(quote);

      const sellToken = this.swapAction == "buy" ? xchSymbol() : this.swapToken;
      const buyToken = this.swapAction == "buy" ? this.swapToken : xchSymbol();

      const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.account.firstAddress));

      const offs: OfferEntity[] = getOfferEntities(
        [{ token: sellToken, amount: quote.amount_in.toString() }],
        "()",
        this.catIds,
        xchSymbol(),
        true
      );
      const reqs: OfferEntity[] = getOfferEntities(
        [{ token: buyToken, amount: quote.amount_out.toString() }],
        change_hex,
        this.catIds,
        xchSymbol(),
        true
      );

      const xchMojo = this.swapAction == "buy" ? mojo : buymojo;
      const tibetFee = BigInt(bigDecimal.ceil(bigDecimal.multiply(xchMojo, "0.003")));
      const pawketFee = tibetFee;
      const devfee = tibetFee + pawketFee;

      const offplan = await generateOfferPlan(offs, change_hex, this.availcoins, 0n, xchSymbol());
      console.log("offplan", offplan);
      const observers = await getAssetsRequestObserver(this.account);
      const ubundle = await generateOffer(offplan, reqs, observers, networkContext());
      this.bundle = await signSpendBundle(ubundle, this.requests, networkContext());

      if (this.account.type == "PublicKey") {
        this.signed = false;
        await this.offlineSignBundle();
      }

      if (this.bundle && this.signed) lockCoins(this.account, this.bundle.coin_spends, Date.now(), chainId());
      this.offerText = await encodeOffer(this.bundle, 6);

      this.summary = {
        fromToken: this.tokenFrom,
        toToken: this.tokenTo,
        fromAmount: BigInt(quote.amount_in),
        toAmount: BigInt(quote.amount_out),
        fee: BigInt(this.fee),
        devfee,
        totalFee: devfee + BigInt(this.fee),
        total: 0n,
      };
      this.summary.total = this.tokenFrom == xchSymbol() ? this.summary.fromAmount + this.summary.totalFee : 0n;

      this.stage = "confirm";
    } catch (error) {
      Notification.open({
        message: this.$tc("offer.make.messages.failedToSign") + error,
        type: "is-danger",
        autoClose: false,
      });
      console.warn(error);
      this.signing = false;
    }
    this.signing = false;
  }

  async offlineSignBundle(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: (await import("@/components/Offline/OfflineSpendBundleQr.vue")).default,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { bundle: this.bundle, mode: "ONLINE_CLIENT" },
      events: {
        signature: (sig: Hex): void => {
          if (this.bundle) {
            this.bundle.aggregated_signature = prefix0x(sig);
            this.signed = true;
            if (this.bundle) lockCoins(this.account, this.bundle.coin_spends, Date.now(), chainId());
          }
        },
      },
    });
  }

  //=========token amount input===================
  public amountFrom = "";
  public amountTo = "";
  public tokenFrom = xchSymbol();
  public tokenTo = xchSymbol();
  public maxTokenToAmount = -1n;
  public maxTokenFromAmount = -1n;

  get totalTokenToAmount(): bigint {
    return this.account.tokens[this.tokenTo].amount;
  }

  get totalTokenFromAmount(): bigint {
    return this.account.tokens[this.tokenFrom].amount;
  }

  // get feeBigInt(): bigint {
  //   return BigInt(this.fee);
  // }

  changeFromAmount(): void {
    this.changeAmount("buy", "from");
  }

  changeToAmount(): void {
    this.changeAmount("buy", "to");
  }

  changeAmount(direction: SwapActionType, changeType: "from" | "to"): void {
    if (!this.swapTokenPair) return;
    const stp = this.swapTokenPair;
    const sell_reserve = this.swapAction == direction ? BigInt(stp.xch_reserve) : BigInt(stp.token_reserve);
    const buy_reserve = this.swapAction == direction ? BigInt(stp.token_reserve) : BigInt(stp.xch_reserve);
    const sellDecimal = this.swapAction == direction ? 12 : 3;
    const buyDecimal = this.swapAction == direction ? 3 : 12;

    if (changeType == "from") {
      const mojo = bigDecimal.multiply(this.amountFrom, Math.pow(10, sellDecimal));
      const am = BigInt(mojo);
      const ato = this.getSellPrice(am, sell_reserve, buy_reserve).toString();
      this.amountTo = bigDecimal.divide(ato, Math.pow(10, buyDecimal), buyDecimal);
      this.priceImpact = this.getPriceImpact(buy_reserve, BigInt(ato));
    } else {
      const mojo = bigDecimal.multiply(this.amountTo, Math.pow(10, buyDecimal));
      const am = BigInt(mojo);
      const ato = this.getBuyPrice(am, sell_reserve, buy_reserve).toString();
      this.amountFrom = bigDecimal.divide(ato, Math.pow(10, sellDecimal), sellDecimal);
      // const ato = this.getSellPrice(am, buy_reserve, sell_reserve).toString();
      // this.amountFrom = bigDecimal.divide(ato, Math.pow(10, sellDecimal), sellDecimal);
      this.priceImpact = this.getPriceImpact(buy_reserve, am);
    }

    const fromDecimal = this.swapAction == direction ? 12 : 3;
    const toDecimal = this.swapAction == direction ? 3 : 12;
    this.priceComparison = [
      `1 ${this.tokenFrom} ≈ ${bigDecimal.divide(this.amountTo, this.amountFrom, toDecimal)} ${this.tokenTo}`,
      `1 ${this.tokenTo} ≈ ${bigDecimal.divide(this.amountFrom, this.amountTo, fromDecimal)} ${this.tokenFrom}`,
    ];
  }

  // calculateSwap(sell:SwapCalculateEntity, buy:SwapCalculateEntity):{amount:string, priceImpact:number}{
  //     const sell_reserve = this.swapAction == direction ? BigInt(stp.xch_reserve) : BigInt(stp.token_reserve);
  //     const buy_reserve = this.swapAction == direction ? BigInt(stp.token_reserve) : BigInt(stp.xch_reserve);
  //     const fromDecimal = this.swapAction == direction ? 12 : 3;
  //     const toDecimal = this.swapAction == direction ? 3 : 12;

  //     const mojo = bigDecimal.multiply( this.amountFrom, Math.pow(10, fromDecimal));
  //     const am = BigInt(mojo);
  //     const ato = this.getSellPrice(am, sell_reserve, buy_reserve).toString();
  //     this.amountTo = bigDecimal.divide(ato, Math.pow(10, toDecimal), toDecimal);
  //     this.priceImpact = this.getPriceImpact(buy_reserve, BigInt(ato));
  // }

  //====================================

  get path(): string {
    return this.$route.path;
  }

  get address(): string {
    return store.state.account.accounts[store.state.account.selectedAccount].firstAddress ?? "xch";
  }

  @Watch("path")
  onPathChange(): void {
    this.close();
  }

  @Emit("close")
  close(): void {
    return;
  }

  back(): void {
    this.close();
  }

  demojo(mojo: null | number | bigint, token: OneTokenInfo | null = null): string {
    return demojo(mojo, token);
  }

  get xchSymbol(): string {
    return xchSymbol();
  }

  // functions  ===============================================
  // Input ≈ sell
  // Output ≈ buy
  getSellPrice(sell_amount: bigint, sell_reserve: bigint, buy_reserve: bigint): bigint {
    if (sell_amount == 0n) return 0n;

    const liquidityFee = 7n; // 0.7%

    const sell_amount_with_fee = sell_amount * (1000n - liquidityFee);
    const numerator = sell_amount_with_fee * buy_reserve;
    const denominator = sell_reserve * 1000n + sell_amount_with_fee;
    console.log(sell_amount, sell_reserve, buy_reserve,sell_amount_with_fee, numerator,denominator)
    return numerator / denominator;
  }

  getBuyPrice(buy_amount: bigint, sell_reserve: bigint, buy_reserve: bigint): bigint {
    if (buy_amount > buy_reserve) return 0n;
    console.log(buy_amount);

    if (buy_amount == 0n) return 0n;
    const liquidityFee = 7n; // 0.7%

    const numerator = sell_reserve * buy_amount * 1000n;
    const denominator = (buy_reserve - buy_amount) * (1000n - liquidityFee);
    return numerator / denominator + 1n;
  }

  getPriceImpact(buy_reserve: bigint, buy_amount: bigint): number {
    // console.log("getPriceImpact", buy_reserve, buy_amount);
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
}
</script>
<style scoped lang="scss">
ul.fee-container {
  margin: 0.5rem 2rem 0.5rem 2rem;
  padding: 0;

  li {
    text-align: right;
  }

  .fee {
    font-weight: bold;
    margin-left: 3rem;
  }
}
.center {
  text-align: center;
}
</style>
