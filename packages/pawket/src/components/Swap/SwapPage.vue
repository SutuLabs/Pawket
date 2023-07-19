<template>
  <div class="modal-card margin-auto">
    <top-bar :title="$t('swap.ui.title')" @close="back()" :showClose="true"></top-bar>
    <section class="modal-card-body">
      <b-loading :is-full-page="false" v-model="loading"></b-loading>
      <template v-if="stage == 'sign'">
        <template v-if="swappableTokens.length > 0">
          <b-field>
            <b-select :placeholder="$t('swap.ui.dropdownPlaceholder')" expanded v-model="swapToken">
              <option v-for="token in swappableTokens" :value="token.short_name" :key="token.asset_id">{{ token.name }}</option>
            </b-select>
          </b-field>
          <template v-if="swapToken">
            <simplified-token-amount-field
              v-model="amountFrom"
              :selectedToken="tokenFrom"
              :token-names="[tokenFrom]"
              :fee="fee"
              :label="$t('swap.ui.label.amountFrom')"
              :max-amount="maxTokenFromAmount"
              :total-amount="totalTokenFromAmount"
              @input="changeAmount('from')"
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
              :label="$t('swap.ui.label.amountTo')"
              :max-amount="maxTokenToAmount"
              :total-amount="totalTokenToAmount"
              @input="changeAmount('to')"
            >
            </simplified-token-amount-field>
          </template>
          <template v-else>{{ $t("swap.ui.noCatSelected") }}</template>
          <fee-selector v-if="false" v-model="fee"></fee-selector>

          <b-field>
            <template #message>
              <div class="container my-5">
                <ul class="fee-container">
                  <li
                    v-if="priceComparison[0] && priceComparison[1]"
                    @click="selectedPriceComparison = selectedPriceComparison == 0 ? 1 : 0"
                  >
                    <span class="fee">{{ priceComparison[selectedPriceComparison] }}</span>
                  </li>
                  <li>
                    <span class="caption">{{ $t("swap.ui.brief.priceImpact") }}</span>
                    <span class="fee" :class="'has-text-' + impactColor">{{ priceImpact.toFixed(2) }}%</span>
                  </li>
                  <li>
                    <span class="caption">{{ $t("swap.ui.brief.liquidityFee") }}</span>
                    <span class="fee">0.70%</span>
                  </li>
                  <li>
                    <span class="caption">{{ $t("swap.ui.brief.devFee") }}</span>
                    <span class="fee">0.60%</span>
                  </li>
                </ul>
              </div>
            </template>
          </b-field>

          <b-field>
            <b-button :type="'is-' + impactColor" expanded icon-right="chevron-double-right" @click="checkOut()">
              {{ continueButtonText }}
            </b-button>
          </b-field>
        </template>
        <template v-if="swappableTokens.length == 0 && !loading">
          <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
            You don't have swappable token. Swappable tokens:
            {{ $t("swap.ui.noSwappableCat") }}
            <b-taglist>
              <b-tag v-for="token in allPoolTokens" :key="token.asset_id" type="is-info">{{ token.short_name }}</b-tag>
            </b-taglist>
          </b-notification>
        </template></template
      >
      <template v-if="stage == 'confirm'">
        <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
          <span v-html="$sanitize($tc('swap.ui.summary.notification'))"></span>
        </b-notification>

        <template v-if="summary">
          <div class="has-text-weight-bold px-5">
            <span class="is-size-6">{{ $t("swap.ui.summary.from") }}</span>
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
            <span class="is-size-6">{{ $t("swap.ui.summary.to") }}</span>
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
            <span class="is-size-6 has-text-grey">{{ $t("swap.ui.summary.txfee") }}</span>
            <span class="is-size-6 is-pulled-right has-text-grey">
              {{ demojo(summary.fee) }}
            </span>
          </div>
          <div class="has-text-weight-bold px-5">
            <span class="is-size-6 has-text-grey">{{ $t("swap.ui.summary.devfee") }}</span>
            <span class="is-size-6 is-pulled-right has-text-grey">
              {{ demojo(summary.devfee) }}
            </span>
          </div>
          <hr />
          <div class="has-text-weight-bold px-5">
            <span class="is-size-5">{{ $t("swap.ui.summary.total") }}</span>
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
        <b-button :label="$t('swap.ui.button.back')" @click="stage = 'sign'"></b-button>
        <b-button
          class="is-pulled-right"
          :label="$t('swap.ui.button.confirm')"
          type="is-primary"
          @click="$emit('confirm')"
          :loading="loading"
        ></b-button>
      </template>
      <p class="mt-3 has-text-grey is-size-7 has-text-centered">
        {{ $t("swap.ui.footer.attributingPrefix") }}
        <a :href="$t('swap.ui.footer.linkUrl')" target="_blank"
          ><u> {{ $t("swap.ui.footer.linkName") }} <i class="mdi mdi-open-in-new"></i></u></a
        >{{ $t("swap.ui.footer.attributingSuffix") }}
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
import { getCatIdDict, getCatNameDict } from "@/services/view/cat";
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
import bigDecimal from "js-big-decimal";
import { signSpendBundle, SpendBundle } from "../../../../pawket-chia-lib/services/spendbundle";
import BundleSummary from "@/components/Bundle/BundleSummary.vue";
import { getOfferEntities, OfferEntity } from "../../../../pawket-chia-lib/services/offer/summary";
import puzzle from "../../../../pawket-chia-lib/services/crypto/puzzle";
import { generateOffer, generateOfferPlan } from "../../../../pawket-chia-lib/services/offer/bundler";
import { lockCoins } from "../../../../pawket-chia-lib/services/coin/coinUtility";
import { encodeOffer } from "../../../../pawket-chia-lib/services/offer/encoding";
import { NotificationProgrammatic as Notification } from "buefy";
import { demojo } from "@/filters/unitConversion";
import {
  getSwapTokens,
  getSwapPair,
  getSwapQuote,
  TibetPairEntity,
  TibetTokenEntity,
  getBuyPrice,
  getPriceImpact,
  getSellPrice,
} from "../../../../pawket-chia-lib/services/swap/tibet";

type SwapActionType = "buy" | "sell";

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
    const tokens = await getSwapTokens(this.chainId);

    const localTokens = getCatNameDict(this.account);
    this.allPoolTokens = tokens;
    this.swappableTokens.splice(0, this.swappableTokens.length); // clear whole array

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (localTokens[prefix0x(t.asset_id)]) this.swappableTokens.push(t);
    }
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
  async onSwapTokenChange(): Promise<void> {
    if (!this.swapToken) return;
    const swap = this.allPoolTokens.filter((_) => _.short_name == this.swapToken)[0];
    this.swapTokenPair = await getSwapPair(swap.pair_id, this.chainId);

    this.onSwapActionChange();

    this.amountFrom = "0";
    this.amountTo = "0";
  }

  get impactColor(): string {
    if (this.priceImpact < 0) return "light";
    if (this.priceImpact < 5) return "primary";
    if (this.priceImpact < 10) return "warning";
    return "danger";
  }

  get continueButtonText(): string {
    if (this.priceImpact < 0) return this.$tc("swap.ui.button.continueWithNoInfo");
    if (this.priceImpact < 5) return this.$tc("swap.ui.button.continueWithNoWarning");
    if (this.priceImpact < 10) return this.$tc("swap.ui.button.continueWithWarning");
    return this.$tc("swap.ui.button.continueWithGreatWarning");
  }

  swapDirection(): void {
    this.swapAction = this.swapAction == "buy" ? "sell" : "buy";
  }

  public signing = false;
  public signed = false;
  public offerText = "";

  async checkOut(): Promise<void> {
    if (!this.swapTokenPair || !this.swapToken) return;
    if (!this.availcoins || !this.requests || !this.account.firstAddress) return;

    try {
      this.signing = true;

      const sellDecimal = this.swapAction == "buy" ? 12 : 3;
      const buyDecimal = this.swapAction == "buy" ? 3 : 12;
      const xch_is_input = this.swapAction == "buy" ? true : false;
      let mojo = bigDecimal.multiply(this.amountFrom, Math.pow(10, sellDecimal));

      let quote = await getSwapQuote(this.swapTokenPair.launcher_id, mojo, xch_is_input ? "xch" : "cat", this.chainId);

      const buymojo = bigDecimal.multiply(this.amountTo, Math.pow(10, buyDecimal));
      const newmojo = getBuyPrice(BigInt(buymojo), BigInt(quote.input_reserve), BigInt(quote.output_reserve)).toString();
      // newmojo < mojo
      if (bigDecimal.compareTo(newmojo, mojo) == -1) mojo = newmojo;
      console.log(mojo, newmojo, quote);

      quote = await getSwapQuote(this.swapTokenPair.launcher_id, mojo, xch_is_input ? "xch" : "cat", this.chainId);

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

      if (this.bundle && this.signed) lockCoins(this.account, this.bundle.coin_spends, Date.now(), this.chainId);
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

  //========= begin token amount input===================
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

  changeAmount(changeType: "from" | "to"): void {
    if (!this.swapTokenPair) return;
    const stp = this.swapTokenPair;
    const sell_reserve = this.swapAction == "buy" ? BigInt(stp.xch_reserve) : BigInt(stp.token_reserve);
    const buy_reserve = this.swapAction == "buy" ? BigInt(stp.token_reserve) : BigInt(stp.xch_reserve);
    const sellDecimal = this.swapAction == "buy" ? 12 : 3;
    const buyDecimal = this.swapAction == "buy" ? 3 : 12;

    if (changeType == "from") {
      const mojo = bigDecimal.multiply(this.amountFrom, Math.pow(10, sellDecimal));
      const ato = getSellPrice(BigInt(mojo), sell_reserve, buy_reserve).toString();
      this.amountTo = bigDecimal.divide(ato, Math.pow(10, buyDecimal), buyDecimal);
      this.priceImpact = getPriceImpact(buy_reserve, BigInt(ato));
    } else {
      const mojo = bigDecimal.multiply(this.amountTo, Math.pow(10, buyDecimal));
      const am = BigInt(mojo);
      const ato = getBuyPrice(am, sell_reserve, buy_reserve).toString();
      this.amountFrom = bigDecimal.divide(ato, Math.pow(10, sellDecimal), sellDecimal);
      this.priceImpact = getPriceImpact(buy_reserve, am);
    }

    const fromDecimal = this.swapAction == "buy" ? 12 : 3;
    const toDecimal = this.swapAction == "buy" ? 3 : 12;
    this.priceComparison = [
      `1 ${this.tokenFrom} ≈ ${bigDecimal.divide(this.amountTo, this.amountFrom, toDecimal)} ${this.tokenTo}`,
      `1 ${this.tokenTo} ≈ ${bigDecimal.divide(this.amountFrom, this.amountTo, fromDecimal)} ${this.tokenFrom}`,
    ];
  }
  //========= end token amount input===================

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

  get chainId(): string {
    return networkContext().chainId;
  }

  get catIds(): { [name: string]: string } {
    return getCatIdDict(this.account);
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
