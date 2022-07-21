<template>
  <div class="modal-card" @dragenter="dragenter" @dragleave="dragleave">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("batchSend.ui.title.send") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <template v-if="!bundle">
        <span class="label">
          <b-tooltip :label="$t('batchSend.ui.tooltip.upload')" position="is-right">
            <b-upload v-model="file" accept=".csv" class="file-label" @input="afterUploadCsv">
              <b-tag icon="tray-arrow-up" size="is-small">{{ $t("batchSend.ui.button.upload") }}</b-tag>
            </b-upload>
          </b-tooltip>
          <b-tooltip :label="$t('batchSend.ui.tooltip.help')" position="is-bottom" multilined>
            <b-icon icon="help-circle" size="is-small"> </b-icon>
          </b-tooltip>
          <a @click="fillSample"
            ><span class="is-size-7 is-underlined">{{ $t("batchSend.ui.field.csv.fillSample") }}</span></a
          >
          <span class="is-size-7">{{ $t("batchSend.ui.field.csv.or") }}</span>
          <a :href="csvSampleUri" :download="$t('batchSend.ui.field.csv.sampleName') + '.csv'"
            ><span class="is-size-7 is-underlined">{{ $t("batchSend.ui.field.csv.downloadSample") }}</span></a
          >
        </span>
        <b-field>
          <b-input type="textarea" v-model="csv" v-show="!isDragging"></b-input>
        </b-field>
        <b-field v-show="isDragging">
          <b-upload v-model="dragfile" drag-drop expanded multiple @input="afterDragged">
            <section class="section">
              <div class="content has-text-centered">
                <p>
                  <b-icon icon="upload" size="is-large"> </b-icon>
                </p>
                <p>{{ $t("batchSend.ui.field.csv.drag") }}</p>
              </div>
            </section>
          </b-upload>
        </b-field>
        <b-field>
          <b-tag v-if="file" icon="paperclip" size="is-small" closable aria-close-label="Close tag" @close="deleteFile">
            {{ file.name }}
          </b-tag>
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
    <footer class="modal-card-foot is-block">
      <div>
        <b-button :label="$t('batchSend.ui.button.cancel')" class="is-pulled-left" @click="cancel()"></b-button>
        <b-button
          :label="$t('batchSend.ui.button.sign')"
          v-if="!bundle"
          type="is-primary"
          class="is-pulled-right"
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
import { AccountEntity } from "@/models/account";
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
import { chainId, xchPrefix, xchSymbol } from "@/store/modules/network";

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
  public submitting = false;
  public fee = 0;
  public bundle: SpendBundle | null = null;
  public availcoins: SymbolCoins | null = null;
  public status: "Loading" | "Loaded" = "Loading";
  public csv = "";
  public file: File | null = null;
  public dragfile: File[] = [];
  public isDragging = false;
  public transitioning = false;

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
        if (this.availcoins[symbol] == undefined) {
          Notification.open({
            message: this.$tc("batchSend.messages.error.COIN_NOT_EXIST", 0, { symbol: symbol }),
            type: "is-danger",
            duration: 5000,
          });
          this.submitting = false;
          return;
        }
        const amount = BigInt(line[2]);
        const memo = line[3];
        // there is error in checking this regular expression
        // eslint-disable-next-line no-useless-escape
        const std_memo = memo.replace(/[&/\\#,+()$~%.'":*?<>{}\[\] ]/g, "_");
        const tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(address));

        tgts.push({ address: tgt_hex, amount, symbol, memos: [tgt_hex, std_memo] });
      }

      const plan = transfer.generateSpendPlan(this.availcoins, tgts, change_hex, BigInt(this.fee), xchSymbol());
      this.bundle = await transfer.generateSpendBundle(plan, this.requests, [], xchSymbol(), chainId());
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

  get csvSampleUri(): string {
    const address = puzzle.getAddressFromPuzzleHash(
      "d19c05a54dacbf2b40ff4843534c47976de90246c3fc42ac1f42ea81b434b8ea",
      xchPrefix()
    );
    const dataPrefix = "data:text/csv;charset=utf-8";
    const fields = `${this.$tc("batchSend.sample.address")},${this.$tc("batchSend.sample.coin")},${this.$tc(
      "batchSend.sample.amount"
    )},${this.$tc("batchSend.sample.memo")}\n`;
    const content = `${dataPrefix},${fields}${address},BSH,150,hello_memo\n${address},${xchSymbol()},150,`;
    return encodeURI(content);
  }

  fillSample(): void {
    const address = puzzle.getAddressFromPuzzleHash(
      "d19c05a54dacbf2b40ff4843534c47976de90246c3fc42ac1f42ea81b434b8ea",
      xchPrefix()
    );
    this.csv = `${address},BSH,150,hello_memo\n${address},${xchSymbol()},150,`;
  }

  async afterUploadCsv(f: File): Promise<void> {
    this.isDragging = false;
    const csvText = await f.text();
    const idx = csvText.search("\n");
    this.csv = csvText.substring(idx + 1);
  }

  deleteFile(): void {
    this.file = null;
    this.csv = "";
  }

  dragenter(event: Event): void {
    event.preventDefault();
    this.isDragging = true;
    this.transitioning = true;
    setTimeout(() => (this.transitioning = false), 1);
  }

  dragleave(event: Event): void {
    event.preventDefault();
    if (!this.transitioning) this.isDragging = false;
  }

  afterDragged(f: File[]): void {
    this.isDragging = false;
    if (f.length > 1) {
      Notification.open({
        message: this.$tc("batchSend.ui.messages.onlyOneFile"),
        type: "is-danger",
        autoClose: false,
      });
      this.dragfile = [];
      return;
    }
    if (f[0].type !== "text/csv") {
      Notification.open({
        message: this.$tc("batchSend.ui.messages.wrongFileType"),
        type: "is-danger",
        autoClose: false,
      });
      this.dragfile = [];
      return;
    }
    this.file = f[0];
    this.afterUploadCsv(f[0]);
    this.dragfile = [];
  }
}
</script>

<style scoped lang="scss">
.field ::v-deep textarea {
  font-size: 0.9em;
}
</style>
