<template>
  <confirmation
    :value="bundle"
    :title="$t('did.addDid.title')"
    @close="close()"
    @back="cancel()"
    @sign="sign()"
    @cancel="cancel()"
    @confirm="offline ? showSend() : submit()"
    :signBtn="account.type == 'PublicKey' ? $t('common.button.generate') : $t('common.button.sign')"
    :confirmBtn="offline ? $t('send.ui.button.showSend') : $t('send.ui.button.submit')"
    :showClose="true"
    :loading="submitting"
    :disabled="submitting"
    :submitting="submitting"
  >
    <template #sign>
      <b-notification type="is-primary" has-icon icon="exclamation" :closable="false">
        <p>{{ $t("did.addDid.tip") }}</p>
        <p class="is-size-7" v-if="account.tokens && account.tokens.hasOwnProperty(xchSymbol)">
          {{ $t("did.addDid.balance") }}: {{ demojo(account.tokens[xchSymbol].amount) }}
        </p>
      </b-notification>
      <fee-selector v-model="fee" @input="changeFee()"></fee-selector>
    </template>
    <template #confirm>
      <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
        <span v-html="$sanitize($tc('did.addDid.confirmation'))"></span>
      </b-notification>
      <send-summary
        :leadingText="$t('did.addDid.spend')"
        :amount="amount"
        :unit="selectedToken"
        :fee="feeBigInt"
        :address="address"
      ></send-summary>
      <bundle-summary :account="account" :bundle="bundle" :ignoreError="true"></bundle-summary>
    </template>
  </confirmation>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import { AccountEntity, OneTokenInfo } from "@/models/account";
import KeyBox from "@/components/Common/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { TokenPuzzleDetail } from "@/services/crypto/receive";
import store from "@/store";
import { signSpendBundle, SpendBundle } from "@/services/spendbundle";
import { SymbolCoins } from "@/services/transfer/transfer";
import TokenAmountField from "@/components/Send/TokenAmountField.vue";
import { debugBundle, submitBundle } from "@/services/view/bundleAction";
import FeeSelector from "@/components/Send/FeeSelector.vue";
import OfflineSendShowBundle from "@/components/Offline/OfflineSendShowBundle.vue";
import BundleSummary from "@/components/Bundle/BundleSummary.vue";
import SendSummary from "@/components/Send/SendSummary.vue";
import { networkContext, xchSymbol } from "@/store/modules/network";
import { getCatNames } from "@/services/view/cat";
import TopBar from "@/components/Common/TopBar.vue";
import { generateMintDidBundle } from "@/services/coin/did";
import { demojo } from "@/filters/unitConversion";
import Confirmation from "../Common/Confirmation.vue";
import { Hex, prefix0x } from "@/services/coin/condition";
import { getAssetsRequestDetail, getAssetsRequestObserver, getAvailableCoins } from "@/services/view/coinAction";

@Component({
  components: {
    KeyBox,
    FeeSelector,
    TokenAmountField,
    BundleSummary,
    SendSummary,
    TopBar,
    Confirmation,
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
      this.requests = this.account.type == "PublicKey" ? [] : await getAssetsRequestDetail(this.account);
    }

    if (!this.availcoins) {
      try {
        const coins = await getAvailableCoins(this.account);
        this.availcoins = coins[0];
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
      const observers = await getAssetsRequestObserver(this.account);
      const ubundle = await generateMintDidBundle(tgt, change, this.feeBigInt, {}, this.availcoins, observers, networkContext());
      this.bundle = await signSpendBundle(ubundle, this.requests, networkContext());
      if (this.account.type == "PublicKey") {
        await this.offlineSignBundle();
      }
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
    submitBundle(this.bundle, this.account, (_) => (this.submitting = _), this.close);
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
          if (this.bundle) this.bundle.aggregated_signature = prefix0x(sig);
        },
      },
    });
  }
}
</script>

<style scoped lang="scss">
.field ::v-deep textarea {
  font-size: 0.6em;
}
</style>
