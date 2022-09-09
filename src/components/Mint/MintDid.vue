<template>
  <div class="modal-card m-0">
    <top-bar :title="$t('did.addDid.title')" @close="$emit('close')" :showClose="showClose"></top-bar>
    <section class="modal-card-body">
      <div v-show="!bundle">
        <!-- <b-field :label="$t('send.ui.label.memo')">
          <b-input maxlength="100" v-model="memo" type="text" @input="reset()"></b-input>
        </b-field> -->
        <b-notification type="is-primary" has-icon icon="exclamation" :closable="false">
          <p>{{ $t("did.addDid.tip") }}</p>
          <p class="is-size-7" v-if="account.tokens && account.tokens.hasOwnProperty(xchSymbol)">
            {{ $t("did.addDid.balance") }}:{{ demojo(account.tokens[xchSymbol].amount) }}
          </p>
        </b-notification>
        <fee-selector v-model="fee" @input="changeFee()"></fee-selector>
      </div>
      <template v-if="bundle">
        <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
          <span v-html="$sanitize($t('did.addDid.confirmation'))"></span>
        </b-notification>
        <send-summary :leadingText="$t('did.addDid.spend')" :amount="amount" :unit="selectedToken" :fee="feeBigInt" :address="address"></send-summary>
        <bundle-summary :account="account" :bundle="bundle"></bundle-summary>
      </template>
    </section>
    <footer class="is-block buttons modal-card-foot pb-2 my-0">
      <div>
        <b-button :label="$t('send.ui.button.cancel')" class="is-pulled-left" @click="cancel()"></b-button>
        <b-button
          :label="$t('send.ui.button.sign')"
          v-if="!bundle"
          type="is-primary"
          @click="sign()"
          :loading="submitting"
          :disabled="submitting"
        ></b-button>
      </div>
      <div>
        <b-button
          :label="$t('send.ui.button.submit')"
          v-if="bundle && !offline"
          type="is-primary"
          class="is-pulled-right"
          @click="submit()"
          :disabled="submitting"
        ></b-button>
        <b-button
          :label="$t('send.ui.button.showSend')"
          v-if="bundle && offline"
          type="is-primary"
          class="is-pulled-right"
          @click="showSend()"
          :disabled="submitting"
        ></b-button>
      </div>
    </footer>
    <b-loading :is-full-page="false" v-model="submitting"></b-loading>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import { AccountEntity, OneTokenInfo } from "@/models/account";
import KeyBox from "@/components/Common/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { TokenPuzzleDetail } from "@/services/crypto/receive";
import store from "@/store";
import { SpendBundle } from "@/models/wallet";
import { SymbolCoins } from "@/services/transfer/transfer";
import TokenAmountField from "@/components/Send/TokenAmountField.vue";
import coinHandler from "@/services/transfer/coin";
import { debugBundle, submitBundle } from "@/services/view/bundle";
import FeeSelector from "@/components/Send/FeeSelector.vue";
import OfflineSendShowBundle from "@/components/Offline/OfflineSendShowBundle.vue";
import BundleSummary from "@/components/Bundle/BundleSummary.vue";
import SendSummary from "@/components/Send/SendSummary.vue";
import { chainId, xchSymbol } from "@/store/modules/network";
import { getCatNames } from "@/services/view/cat";
import TopBar from "@/components/Common/TopBar.vue";
import { generateMintDidBundle } from "@/services/coin/did";
import { demojo } from "@/filters/unitConversion";

@Component({
  components: {
    KeyBox,
    FeeSelector,
    TokenAmountField,
    BundleSummary,
    SendSummary,
    TopBar,
  },
})
export default class MintDid extends Vue {
  @Prop() public account!: AccountEntity;
  @Prop({ default: true }) public showClose!: boolean;

  public submitting = false;
  public fee = 0;
  public address = "";
  public memo = "";
  public bundle: SpendBundle | null = null;
  public availcoins: SymbolCoins | null = null;
  public maxStatus: "Loading" | "Loaded" = "Loading";
  public amount = 1n;
  public selectedToken = xchSymbol();
  public offline = false;

  public requests: TokenPuzzleDetail[] = [];

  mounted(): void {
    this.loadCoins();
  }

  @Emit("close")
  close(): void {
    return;
  }

  demojo(mojo: null | number | bigint, token: OneTokenInfo | null = null, digits = -1): string {
    return demojo(mojo, token, digits);
  }

  get decimal(): number {
    return this.selectedToken == xchSymbol() ? 12 : 3;
  }

  get network(): string {
    return store.state.network.networkId;
  }

  get tokenNames(): string[] {
    return getCatNames(this.account);
  }

  get bundleJson(): string {
    return JSON.stringify(this.bundle, null, 4);
  }

  get feeBigInt(): bigint {
    return BigInt(this.fee);
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get xchSymbol(): string {
    return xchSymbol();
  }

  reset(): void {
    this.bundle = null;
  }

  cancel(): void {
    if (this.bundle) {
      this.reset();
    } else {
      this.close();
    }
  }

  async loadCoins(): Promise<void> {
    this.bundle = null;
    this.maxStatus = "Loading";

    if (!this.requests || this.requests.length == 0) {
      this.requests = await coinHandler.getAssetsRequestDetail(this.account);
    }

    if (!this.availcoins) {
      try {
        this.availcoins = await coinHandler.getAvailableCoins(this.requests, coinHandler.getTokenNames(this.account));
      } catch (err) {
        this.offline = true;
      }
    }

    if (!this.availcoins || !this.availcoins[this.selectedToken]) {
      return;
    }

    this.maxStatus = "Loaded";
  }

  async sign(): Promise<void> {
    this.submitting = true;
    try {
      if (!this.account.firstAddress) {
        this.submitting = false;
        return;
      }

      if (this.availcoins == null) {
        this.submitting = false;
        return;
      }
      const tgt = this.account.firstAddress;
      const change = this.account.firstAddress;

      // there is error in checking this regular expression
      // eslint-disable-next-line no-useless-escape
      // const memo = this.memo.replace(/[&/\\#,+()$~%.'":*?<>{}\[\] ]/g, "_");
      // const tgts: TransferTarget[] = [{ address: tgt_hex, amount, symbol: this.selectedToken, memos: [tgt_hex, memo] }];
      // const plan = transfer.generateSpendPlan(this.availcoins, tgts, change_hex, BigInt(this.fee), xchSymbol());
      // this.bundle = await transfer.generateSpendBundle(plan, this.requests, [], xchSymbol(), chainId());
      this.bundle = await (
        await generateMintDidBundle(tgt, change, this.feeBigInt, {}, this.availcoins, this.requests, xchSymbol(), chainId())
      ).spendBundle;
    } catch (error) {
      Notification.open({
        message: this.$tc("send.ui.messages.failedToSign") + error,
        type: "is-danger",
        autoClose: false,
      });
      console.warn(error);
      this.submitting = false;
    }
    this.submitting = false;
  }

  async submit(): Promise<void> {
    if (!this.bundle) return;
    submitBundle(this.bundle, (_) => (this.submitting = _), this.close);
  }

  debugBundle(): void {
    if (!this.bundle) return;
    debugBundle(this, this.bundle);
  }

  changeFee(): void {
    this.reset();
  }

  showSend(): void {
    this.$buefy.modal.open({
      parent: this,
      component: OfflineSendShowBundle,
      hasModalCard: true,
      trapFocus: false,
      props: { bundle: this.bundle },
    });
  }
}
</script>

<style scoped lang="scss">
.field ::v-deep textarea {
  font-size: 0.6em;
}
</style>
