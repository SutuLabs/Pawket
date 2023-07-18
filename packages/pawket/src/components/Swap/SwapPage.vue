<template>
  <div class="modal-card margin-auto">
    <top-bar :title="$t('swap.ui.title')" @close="back()" :showClose="true"></top-bar>

    <section class="modal-card-body">
      <template v-if="swappableTokens.length > 0">
        <b-field>
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
            :showTokenSelector="false"
            @input="changeAmount()"
          >
          </simplified-token-amount-field>
          <simplified-token-amount-field
            v-model="amountTo"
            :selectedToken="tokenTo"
            :token-names="[tokenTo]"
            :fee="fee"
            :label="$t('swap.ui.label.amount')"
            :max-amount="-1"
            :total-amount="-1"
            :showTokenSelector="false"
            :showMaxAmount="false"
            :amountEditable="false"
          >
          </simplified-token-amount-field>
        </template>
        <template v-else> select a token to start </template>
        <fee-selector v-model="fee"></fee-selector>

        <b-field>
          <template #message>
            <div class="container my-5">
              <ul class="fee-container">
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
          <b-button :type="'is-' + impactColor" expanded icon-right="chevron-double-right" @click="showFrame = true">{{
            $t("swap.ui.button.continue")
          }}</b-button>
        </b-field>
      </template>
      <template v-else>
        You don't have swappable token. Swappable tokens:
        <ul>
          <li v-for="token in allPoolTokens" :key="token.asset_id">{{ token.short_name }}</li>
        </ul>
      </template>
      <p class="mt-6 pt-6 has-text-grey is-size-7 has-text-centered">
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
import { xchSymbol } from "@/store/modules/network";
import { getCatIdDict, getCatNameDict, getCatNames } from "@/services/view/cat";
import { AccountEntity } from "../../../../pawket-chia-lib/models/account";
import { TokenPuzzleDetail } from "../../../../pawket-chia-lib/services/crypto/receive";
import { getAssetsRequestDetail, getAvailableCoins, getAvailableCoinsWithRequests } from "@/services/view/coinAction";
import { SymbolCoins } from "../../../../pawket-chia-lib/services/transfer/transfer";
import { prefix0x } from "../../../../pawket-chia-lib/services/coin/condition";
import BuyUSDS from "../Home/BuyUSDS.vue";
import bigDecimal from "js-big-decimal";
import { isCryptoKey } from "util/types";

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

@Component({
  components: {
    TopBar,
    SimplifiedTokenAmountField,
    FeeSelector,
  },
})
export default class SwapPage extends Vue {
  @Prop() public account!: AccountEntity;
  showFrame = false;
  swapAction: "buy" | "sell" = "buy";

  public fee = 0;
  public requests: TokenPuzzleDetail[] = [];
  public availcoins: SymbolCoins | null = null;
  public swappableTokens: TibetTokenEntity[] = [];
  public allPoolTokens: TibetTokenEntity[] = [];

  public swapToken: string | null = null;
  // public swapTokenInfo: TibetTokenEntity|null = null;
  public swapTokenPair: TibetPairEntity | null = null;
  public priceImpact = -1;

  mounted(): void {
    this.loadSwapToken();
    this.loadCoins();
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
    // this.maxTokenToAmount = -1n;
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

    // const toavailcoins = this.availcoins[this.tokenTo].map((_) => _.amount);
    // this.maxTokenToAmount = toavailcoins.reduce((a, b) => a + b, 0n);
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

  //=========token amount input===================
  public amountFrom = "";
  public amountTo = "";
  public tokenFrom = xchSymbol();
  public tokenTo = xchSymbol();
  // public maxTokenToAmount = -1n;
  public maxTokenFromAmount = -1n;

  // get totalTokenToAmount(): bigint {
  //   return this.account.tokens[this.tokenTo].amount;
  // }

  get totalTokenFromAmount(): bigint {
    return this.account.tokens[this.tokenFrom].amount;
  }

  // get feeBigInt(): bigint {
  //   return BigInt(this.fee);
  // }

  changeAmount(): void {
    if (!this.swapTokenPair) return;
    const stp = this.swapTokenPair;
    const sell_reserve = this.swapAction == "buy" ? BigInt(stp.xch_reserve) : BigInt(stp.token_reserve);
    const buy_reserve = this.swapAction == "buy" ? BigInt(stp.token_reserve) : BigInt(stp.xch_reserve);
    const fromDecimal = this.swapAction == "buy" ? 12 : 3;
    const toDecimal = this.swapAction == "buy" ? 3 : 12;
    const mojo = bigDecimal.multiply(this.amountFrom, Math.pow(10, fromDecimal));
    const am = BigInt(mojo);
    const ato = this.getInputPrice(am, sell_reserve, buy_reserve).toString();
    this.amountTo = bigDecimal.divide(ato, Math.pow(10, toDecimal), toDecimal);
    this.priceImpact = this.getPriceImpact(buy_reserve, BigInt(ato));
  }
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
    if (this.showFrame) this.showFrame = false;
    else this.close();
  }

  // functions  ===============================================
  getInputPrice(sell_amount: bigint, sell_reserve: bigint, buy_reserve: bigint): bigint {
    if (sell_amount == 0n) return 0n;

    const liquidityFee = 7n; // 0.7%

    const sell_amount_with_fee = sell_amount * (1000n - liquidityFee);
    const numerator = sell_amount_with_fee * buy_reserve;
    const denominator = sell_reserve * 1000n + sell_amount_with_fee;
    return numerator / denominator;
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
</style>
