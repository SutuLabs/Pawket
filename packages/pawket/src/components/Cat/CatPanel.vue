<template>
  <div>
    <a
      v-for="cat of tokenList"
      :key="cat.id"
      class="panel-block is-justify-content-space-between py-4 has-text-grey-dark"
      v-show="account.tokens && account.tokens.hasOwnProperty(cat.name)"
    >
      <div class="column is-flex is-7" v-if="account.tokens && account.tokens.hasOwnProperty(cat.name)">
        <div class="mr-4">
          <span class="image is-32x32">
            <img v-if="cat.img" class="is-rounded" :src="cat.img" @error="fallBack($event)" />
            <img v-else-if="cat.name === xchSymbol" class="is-rounded" src="@/assets/chia-logo.svg" />
            <img v-else class="is-rounded" src="@/assets/custom-cat.svg" />
          </span>
        </div>
        <div class="py-1">
          <p class="has-text-grey-dark is-size-6" v-if="tokenInfo[cat.name]">
            <span v-if="account.tokens[cat.name].amount < 0">- {{ cat.name }}</span>
            <span v-else>{{ demojo(account.tokens[cat.name].amount, tokenInfo[cat.name]) }}</span>
          </p>
          <p>
            <span class="mr-2 is-size-7 has-text-grey" v-if="exchangeRate && cat.name === exchangeRate.from">{{
              xchToCurrency(account.tokens[cat.name].amount, rate, currency)
            }}</span>
          </p>
        </div>
      </div>
    </a>
    <div class="column is-full has-text-centered pt-5 mt-2">
      <a @click="$router.push('/home/cats')"
        ><span class="has-color-link">{{ $t("accountDetail.ui.button.manageCats") }}</span></a
      >
    </div>
  </div>
</template>
<script lang="ts">
import { demojo } from "@/filters/unitConversion";
import { xchToCurrency } from "@/filters/usdtConversion";
import { AccountEntity, AccountToken, CustomCat, OneTokenInfo, TokenInfo } from "../../../../pawket-chia-lib/models/account";
import { GetExchangeRateResponse } from "../../../../pawket-chia-lib/models/api";
import { CurrencyType } from "@/services/exchange/currencyType";
import { getExchangeRate } from "@/services/exchange/rates";
import { getTokenInfo } from "@/services/view/cat";
import store from "@/store";
import { getAllCats } from "@/store/modules/account";
import { xchSymbol } from "@/store/modules/network";
import { Component, Vue, Watch } from "vue-property-decorator";

@Component({
  components: {},
})
export default class CatPanel extends Vue {
  private readonly custom_cat = require("@/assets/custom-cat.svg");
  public exchangeRate: GetExchangeRateResponse | null = null;

  get selectedAccount(): number {
    return store.state.account.selectedAccount;
  }

  get account(): AccountEntity {
    return store.state.account.accounts[this.selectedAccount] ?? {};
  }

  get token(): AccountToken | null {
    return this.account.tokens ? this.account.tokens[xchSymbol()] : null;
  }

  get tokenList(): CustomCat[] {
    return getAllCats(this.account);
  }

  xchToCurrency(mojo: null | number | bigint, rate = -1, currency: CurrencyType = CurrencyType.USDT): string {
    return xchToCurrency(mojo, rate, currency);
  }

  demojo(mojo: null | number | bigint, token: OneTokenInfo | null = null, digits = -1): string {
    return demojo(mojo, token, digits);
  }

  get rate(): number {
    if (!this.exchangeRate) return -1;
    return this.exchangeRate.price;
  }

  get xchSymbol(): string {
    return xchSymbol();
  }

  get currency(): CurrencyType {
    return store.state.vault.currency ? store.state.vault.currency : CurrencyType.USDT;
  }

  get currencyName(): string {
    return CurrencyType[this.currency];
  }

  get tokenInfo(): TokenInfo {
    return getTokenInfo(this.account);
  }

  @Watch("xchSymbol")
  async updateRate(): Promise<void> {
    this.exchangeRate = await getExchangeRate(xchSymbol(), this.currencyName);
  }

  async mounted(): Promise<void> {
    this.exchangeRate = await getExchangeRate(xchSymbol(), this.currencyName);
  }

  fallBack(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src.endsWith(this.custom_cat)) return;
    img.src = this.custom_cat;
  }
}
</script>
<style scoped lang="scss"></style>
