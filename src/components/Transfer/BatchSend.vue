<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("batchSend.ui.title.send") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <template v-if="!bundle">
        <b-field>
          <template #label>
            {{ $t("batchSend.ui.field.csv.title") }}
            <b-tooltip :label="$t('batchSend.ui.tooltip.unit')" position="is-bottom" multilined>
              <b-icon icon="help-circle" size="is-small"> </b-icon>
            </b-tooltip>
            <b-button size="is-small" tag="a" @click="fillSample()">{{ $t("batchSend.ui.field.csv.fillSample") }}</b-button>
          </template>
          <b-input type="textarea" v-model="csv"></b-input>
        </b-field>

        <fee-selector v-model="fee"></fee-selector>
      </template>
      <template v-if="bundle">
        <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
          <span v-html="$sanitize($t('batchSend.ui.summary.notification'))"></span>
        </b-notification>
        <bundle-summary :account="account" :bundle="bundle"></bundle-summary>
      </template>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <div>
        <b-button :label="$t('batchSend.ui.button.cancel')" @click="cancel()"></b-button>
        <b-button
          :label="$t('batchSend.ui.button.sign')"
          v-if="!bundle"
          type="is-primary"
          @click="sign()"
          :disabled="status == 'Loading' || submitting"
        ></b-button>
      </div>
      <div>
        <b-button
          :label="$t('batchSend.ui.button.submit')"
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
import { AccountEntity } from "@/store/modules/account";
import KeyBox from "@/components/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { TokenPuzzleDetail } from "@/services/crypto/receive";
import { SpendBundle } from "@/models/wallet";
import puzzle from "@/services/crypto/puzzle";
import { prefix0x } from "@/services/coin/condition";
import transfer, { SymbolCoins, TransferTarget } from "@/services/transfer/transfer";
import TokenAmountField from "@/components/TokenAmountField.vue";
import coinHandler from "@/services/transfer/coin";
import { submitBundle } from "@/services/view/bundle";
import FeeSelector from "@/components/FeeSelector.vue";
import BundleSummary from "@/components/BundleSummary.vue";
import { csvToArray } from "@/services/util/csv";
import { xchPrefix, xchSymbol } from "@/store/modules/network";

@Component({
  components: {
    KeyBox,
    FeeSelector,
    TokenAmountField,
    BundleSummary,
  },
})
export default class BatchSend extends Vue {
  @Prop() private account!: AccountEntity;
  @Prop({ default: "mainnet" }) private network!: string;
  public submitting = false;
  public fee = 0;
  public bundle: SpendBundle | null = null;
  public availcoins: SymbolCoins | null = null;
  public status: "Loading" | "Loaded" = "Loading";
  public csv = "";

  public requests: TokenPuzzleDetail[] = [];

  mounted(): void {
    this.loadCoins();
  }

  @Emit("close")
  close(): void {
    return;
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
    this.status = "Loading";

    if (!this.requests || this.requests.length == 0) {
      this.requests = await coinHandler.getAssetsRequestDetail(this.account);
    }

    if (!this.availcoins) {
      this.availcoins = await coinHandler.getAvailableCoins(this.requests, coinHandler.getTokenNames(this.account));
    }

    this.status = "Loaded";
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

      const inputs = csvToArray(this.csv);
      const tgts: TransferTarget[] = [];
      const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.account.firstAddress));

      for (let i = 0; i < inputs.length; i++) {
        const line = inputs[i];

        const address = line[0];
        if (!address.startsWith(xchPrefix())) {
          Notification.open({
            message: this.$tc("batchSend.messages.error.ADDRESS_NOT_MATCH_NETWORK"),
            type: "is-danger",
            duration: 5000,
          });
          this.submitting = false;
          return;
        }
        const symbol = line[1];
        const amount = BigInt(line[2]);
        const memo = line[3];
        // there is error in checking this regular expression
        // eslint-disable-next-line no-useless-escape
        const std_memo = memo.replace(/[&/\\#,+()$~%.'":*?<>{}\[\] ]/g, "_");
        const tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(address));

        tgts.push({ address: tgt_hex, amount, symbol, memos: [tgt_hex, std_memo] });
      }

      const plan = transfer.generateSpendPlan(this.availcoins, tgts, change_hex, BigInt(this.fee));
      this.bundle = await transfer.generateSpendBundle(plan, this.requests, []);
    } catch (error) {
      Notification.open({
        message: this.$tc("batchSend.ui.messages.failedToSign") + error,
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

  fillSample(): void {
    const address =
      this.network == "mainnet"
        ? "xch1kjllpsx4mz9gh36clzmzr69kze965almufz7vrch5xq3jymlsjjsysq7uh"
        : "txch1kjllpsx4mz9gh36clzmzr69kze965almufz7vrch5xq3jymlsjjsfh8gay";
    this.csv = `${address},BSH,150,hello_memo
${address},${xchSymbol()},150,`;
  }
}
</script>

<style scoped lang="scss">
.field ::v-deep textarea {
  font-size: 0.9em;
}
</style>
