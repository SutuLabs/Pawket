<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("send.ui.title.send") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-notification
        v-if="notificationMessage"
        :type="notificationType || 'is-success'"
        has-icon
        :icon="notificationIcon || 'heart'"
        :closable="notificationClosable"
      >
        {{ notificationMessage }}
      </b-notification>
      <b-field :label="$t('send.ui.label.address')">
        <b-input v-model="address" @change="reset()" expanded :disabled="!addressEditable"></b-input>
        <p class="control">
          <b-button @click="scanQrCode()">
            <b-icon icon="qrcode"></b-icon>
          </b-button>
        </p>
      </b-field>
      <b-field :message="amountMessage">
        <template #label>
          {{ $t("send.ui.label.amount") }}
          <span class="is-size-6">
            <b-tooltip :triggers="['click']" :auto-close="['outside', 'escape']" position="is-right" type="is-light" multilined>
              <template v-slot:content>
                Currently only support one coin mode,
                <a href="https://pawket.app" target="_blank">
                  Learn more
                  <b-icon icon="open-in-new" size="is-small"></b-icon>
                </a>
              </template>
              <b-icon icon="comment-question" size="is-small" type="is-info" class="px-4"></b-icon>
            </b-tooltip>
            <b-button tag="a" type="is-info is-light" size="is-small" @click="setMax(maxAmount)">
              <span v-if="maxStatus == 'Loading'">Loading {{ selectedToken }}</span>
              <span v-if="maxStatus == 'Loaded'">Max: {{ maxAmount }} {{ selectedToken }}</span>
            </b-button>
          </span>
        </template>
        <b-select v-model="selectedToken" @input="loadCoins()">
          <option v-for="token in tokenNames" :key="token" :value="token">
            {{ token }}
          </option>
        </b-select>
        <b-input
          v-model="amount"
          expanded
          :disabled="!amountEditable"
          @input="
            reset();
            selectMax = false;
          "
        ></b-input>
        <p class="control">
          <span class="button is-static">{{ selectedToken }}</span>
        </p>
      </b-field>
      <b-field :label="$t('send.ui.label.memo')">
        <b-input maxlength="100" v-model="memo" type="text" @input="reset()" :disabled="selectedToken == 'XCH'"></b-input>
      </b-field>
      <b-field :label="$t('send.ui.label.fee')">
        <b-numberinput
          controls-alignment="left"
          controls-position="compact"
          max="1000000000"
          min="0"
          v-model="fee"
          :exponential="true"
          @input="changeFee()"
          expanded
          :disabled="feeType > 0"
        ></b-numberinput>

        <p class="control">
          <span class="button is-static"><span class="is-size-7">mojos</span></span>
        </p>
        <p class="control">
          <span class="button" style="min-width: 150px">
            <b-slider :min="0" :max="3" v-model="feeType" :tooltip="false" @input="changeFee()">
              <b-slider-tick :value="0">Custom</b-slider-tick>
              <b-slider-tick :value="1">Low</b-slider-tick>
              <b-slider-tick :value="2">Medium</b-slider-tick>
              <b-slider-tick :value="3">High</b-slider-tick>
            </b-slider>
          </span>
        </p>
      </b-field>
      <b-field v-if="bundle">
        <template #label>
          {{ $t("send.ui.label.bundle") }}
          <key-box display="✂️" :value="JSON.stringify(bundle)" tooltip="Copy"></key-box>
          <a href="javascript:void(0)" v-if="debugMode" @click="debugBundle()">🐞</a>
        </template>
        <b-input type="textarea" disabled :value="bundleJson"></b-input>
      </b-field>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <div>
        <b-button :label="$t('send.ui.button.cancel')" @click="close()"></b-button>
        <b-button
          :label="$t('send.ui.button.sign')"
          v-if="!bundle"
          type="is-success"
          @click="sign()"
          :disabled="submitting"
        ></b-button>
      </div>
      <div>
        <b-button
          :label="$t('send.ui.button.submit')"
          v-if="bundle"
          type="is-primary"
          class="is-pulled-right"
          @click="submit()"
          :disabled="submitting"
        ></b-button>
      </div>
    </footer>
    <b-loading :is-full-page="false" v-model="submitting"></b-loading>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import { AccountEntity, TokenInfo } from "@/store/modules/account";
import KeyBox from "@/components/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { ApiResponse } from "@/models/api";
import receive, { TokenPuzzleDetail } from "../services/crypto/receive";
import store from "@/store";
import { CoinItem, SpendBundle } from "@/models/wallet";
import puzzle from "@/services/crypto/puzzle";
import DevHelper from "@/components/DevHelper.vue";
import bigDecimal from "js-big-decimal";
import ScanQrCode from "@/components/ScanQrCode.vue";
import { prefix0x } from '../services/coin/condition';
import transfer, { SymbolCoins } from '../services/transfer/transfer';

@Component({
  components: {
    KeyBox,
  },
})
export default class Send extends Vue {
  @Prop() private account!: AccountEntity;
  @Prop() private inputAddress!: string;
  @Prop() private inputAmount!: string;
  @Prop({ default: true }) private addressEditable!: boolean;
  @Prop({ default: true }) private amountEditable!: boolean;
  @Prop() private notificationMessage!: string;
  @Prop() private notificationType!: string;
  @Prop() private notificationIcon!: string;
  @Prop() private notificationClosable!: boolean;

  public submitting = false;
  public amount = "0";
  public fee = 0;
  public feeType = 0;
  public address = "";
  public selectedToken = "XCH";
  public memo = "";
  public bundle: SpendBundle | null = null;
  public availcoins: SymbolCoins | null = null;
  public maxAmount = "-1";
  public INVALID_AMOUNT_MESSAGE = "Invalid amount";
  public maxStatus: "Loading" | "Loaded" = "Loading";
  public selectMax = false;

  public requests: TokenPuzzleDetail[] = [];

  mounted(): void {
    if (this.inputAddress) this.address = this.inputAddress;
    if (this.inputAmount) this.amount = this.inputAmount;
    this.loadCoins();
  }

  @Emit("close")
  close(): void {
    return;
  }

  get amountMessage(): string {
    if (!this.amount) return "";
    try { new bigDecimal(this.amount); }
    catch { return ""; }
    if (Number(this.amount) == 0) return "";

    if (bigDecimal.compareTo(this.amount, this.maxAmount) > 0) return this.INVALID_AMOUNT_MESSAGE;

    const mojo = bigDecimal.multiply(this.amount, Math.pow(10, this.decimal));
    if (Number(mojo) < 1) return this.INVALID_AMOUNT_MESSAGE;
    return bigDecimal.getPrettyValue(mojo, 3, ",") + " mojos";
  }

  get decimal(): number { return this.selectedToken == "XCH" ? 12 : 3; }

  get tokenNames(): string[] {
    return Object.keys(store.state.account.tokenInfo).concat(this.account.cats.map((_) => _.name));
  }

  get bundleJson(): string {
    return JSON.stringify(this.bundle, null, 4);
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  reset(): void {
    this.bundle = null;
  }

  get tokenInfo(): TokenInfo {
    const tokenInfo = Object.assign({}, store.state.account.tokenInfo);
    if (this.account.cats) {
      for (let i = 0; i < this.account.cats.length; i++) {
        const cat = this.account.cats[i];
        tokenInfo[cat.name] = {
          id: cat.id,
          symbol: cat.name,
          decimal: 3,
          unit: cat.name,
        };
      }
    }

    return tokenInfo;
  }

  setMax(amount: string, excludingFee = false): void {
    this.reset();
    excludingFee = this.selectedToken != "XCH" ? true : excludingFee;
    const newAmount = excludingFee
      ? amount
      : bigDecimal.subtract(amount, bigDecimal.divide(this.fee, Math.pow(10, this.decimal), this.decimal));
    this.amount = newAmount;
    this.selectMax = true;
  }

  async loadCoins(): Promise<void> {
    this.bundle = null;
    this.maxStatus = "Loading";

    const maxId = this.account.addressRetrievalCount;
    const sk_hex = this.account.key.privateKey;
    if (!this.requests || this.requests.length == 0) {
      this.requests = await receive.getAssetsRequestDetail(sk_hex, maxId, this.account.cats ?? []);
    }

    if (!this.availcoins) {
      const coins = (await receive.getCoinRecords(this.requests, false))
        .filter(_ => _.coin).map(_ => _.coin as CoinItem).map(_ => ({
          amount: BigInt(_.amount),
          parent_coin_info: _.parentCoinInfo,
          puzzle_hash: _.puzzleHash,
        }));

      this.availcoins =
        this.tokenNames.map(symbol => {
          const tgtpuzs = this.requests.filter(_ => _.symbol == symbol)[0].puzzles.map(_ => prefix0x(_.hash));
          return { symbol, coins: coins.filter(_ => tgtpuzs.findIndex(p => p == _.puzzle_hash) > -1) };
        }).reduce((a, c) => ({ ...a, [c.symbol]: c.coins }), {});
    }


    const availcoins = this.availcoins[this.selectedToken].map(_ => _.amount);

    this.maxAmount = bigDecimal.divide(availcoins.reduce((a, b) => a + b, 0n), Math.pow(10, this.decimal), this.decimal);
    this.maxStatus = "Loaded";
  }

  async sign(): Promise<void> {
    this.submitting = true;
    try {
      if (!this.account.firstAddress) {
        this.submitting = false;
        return;
      }

      const decimal = this.selectedToken == "XCH" ? 12 : 3;
      const amount = BigInt(bigDecimal.multiply(this.amount, Math.pow(10, decimal)));

      if (this.availcoins == null) return;
      const tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.address));
      const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.account.firstAddress));
      const tgts = [{ address: tgt_hex, amount, symbol: this.selectedToken, memo: this.memo }];
      const plan = transfer.generateSpendPlan(this.availcoins, tgts, change_hex, BigInt(this.fee));
      this.bundle = await transfer.generateSpendBundle(plan, this.requests);
    } catch (error) {
      Notification.open({
        message: `failed to sign: ${error}`,
        type: "is-danger",
        autoClose: false,
      });
      console.warn(error);
      this.submitting = false;
    }
    this.submitting = false;
  }

  async submit(): Promise<void> {
    this.submitting = true;

    try {
      const resp = await fetch(process.env.VUE_APP_API_URL + "Wallet/pushtx", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bundle: this.bundle }),
      });
      const json = (await resp.json()) as ApiResponse;
      this.submitting = false;
      if (json.success) {
        Notification.open({
          message: `Submitted to memory pool.`,
          type: "is-success",
        });
        this.close();
      } else {
        Notification.open({
          message: `Submit failed: ${json.error}`,
          type: "is-danger",
        });
      }
    } catch (error) {
      Notification.open({
        message: `failed to submit: ${error}`,
        type: "is-danger",
      });
      console.warn(error);
      this.submitting = false;
    }
  }

  debugBundle(): void {
    this.$buefy.modal.open({
      parent: this,
      component: DevHelper,
      hasModalCard: true,
      trapFocus: true,
      props: { inputBundleText: this.bundleJson },
    });
  }

  scanQrCode(): void {
    this.$buefy.modal.open({
      parent: this,
      component: ScanQrCode,
      hasModalCard: true,
      trapFocus: true,
      props: {},
      events: {
        "scanned": (value: string): void => {
          this.address = value;
        },
      },
    });
  }

  changeFee(): void {
    this.reset();
    const fees: { [type: number]: number } = {
      1: 5,
      2: 100,
      3: 1000,
    };
    if (this.feeType > 0) {
      this.fee = fees[this.feeType];
    }

    if (!this.fee) this.fee = 0;
    if (this.selectMax) this.setMax(this.maxAmount);
  }
}
</script>

<style scoped lang="scss">
.field ::v-deep textarea {
  font-size: 0.6em;
}
</style>
