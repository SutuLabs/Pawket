<template>
  <div class="modal-card" @dragenter="dragenter" @dragleave="dragleave">
    <top-bar :title="$t('inscription.ui.title.inscribe')" @close="close()" :showClose="true"></top-bar>
    <section class="modal-card-body">
      <template v-if="!bundle">
        <b-tabs v-model="panel" position="is-centered" expanded class="no_content_panel">
          <b-tab-item value="mint" icon="lead-pencil" :label="$t('inscription.ui.tab.mint')"></b-tab-item>
          <b-tab-item
            value="transfer"
            icon="arrow-right-bold-circle-outline"
            :label="$t('inscription.ui.tab.transfer')"
          ></b-tab-item>
          <b-tab-item value="deploy" icon="sprout-outline" :label="$t('inscription.ui.tab.deploy')"></b-tab-item>
          <b-tab-item value="custom" icon="cogs" :label="$t('inscription.ui.tab.custom')" :visible="false"></b-tab-item>
        </b-tabs>

        <b-field v-if="panel == 'mint' || panel == 'transfer' || panel == 'deploy'" :label="$t('inscription.ui.label.tick')">
          <b-input maxlength="4" v-model="tick" type="text" :placeholder="$t('inscription.ui.placeholder.tick')"></b-input>
        </b-field>

        <b-field v-if="panel == 'mint' || panel == 'transfer'" :label="$t('inscription.ui.label.amount')">
          <b-field>
            <!-- <p class="control">
                    <b-button :label="$t('inscription.ui.button.max')" />
                  </p> -->
            <b-numberinput
              v-model="amount"
              :max="Number.MAX_SAFE_INTEGER"
              :min="1"
              expanded
              controls-position="compact"
              controls-alignment="right"
            />
          </b-field>
        </b-field>

        <b-field v-if="panel == 'mint'" :label="$t('inscription.ui.label.repeatMint')">
          <b-field>
            <b-numberinput
              v-model="repeat"
              expanded
              controls-position="compact"
              :max="MAX_REPEAT"
              :min="1"
              controls-alignment="left"
              type="is-warning"
            />
            <p class="control right_slider">
              <b-slider v-model="repeat" indicator :tooltip="false" :max="MAX_REPEAT" :min="1" format="raw"></b-slider>
            </p>
          </b-field>
        </b-field>

        <b-field v-if="panel == 'deploy'" :label="$t('inscription.ui.label.total')">
          <b-field>
            <b-numberinput
              v-model="total"
              :max="Number.MAX_SAFE_INTEGER"
              :min="1"
              expanded
              controls-position="compact"
              controls-alignment="right"
            />
          </b-field>
        </b-field>

        <b-field v-if="panel == 'deploy'" :label="$t('inscription.ui.label.limit')">
          <b-field>
            <b-numberinput
              v-model="limit"
              :max="Number.MAX_SAFE_INTEGER"
              :min="1"
              expanded
              controls-position="compact"
              controls-alignment="right"
            />
          </b-field>
        </b-field>

        <!-- Custom -->
        <template v-if="panel == 'custom'">
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
            <b-input type="textarea" v-model="csv" v-show="!isDragging" required ref="csv"></b-input>
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
        </template>

        <address-field
          :inputAddress="address"
          :validAddress="validAddress"
          :label="$t('inscription.ui.label.receiverAddress')"
          :addressEditable="true"
          @updateAddress="updateAddress"
          @updateEffectiveAddress="updateEffectiveAddress"
        ></address-field>

        <fee-selector v-model="fee"></fee-selector>
      </template>
      <template v-if="bundle">
        <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
          <span v-html="$sanitize($tc('inscription.ui.summary.notification'))"></span>
        </b-notification>

        <template v-if="summary">
          <div class="has-text-weight-bold px-5">
            <span class="is-size-6">{{ $t("inscription.ui.summary.memo") }}</span>
            <!-- <span class="is-pulled-right">
              {{ summary.memo }}
            </span> -->
            <b-notification type="is-info is-light" :closable="false">
              {{ summary.memo }}
            </b-notification>
          </div>
          <div v-if="summary.type == 'mint'" class="has-text-weight-bold px-5">
            <span class="is-size-6">{{ $t("inscription.ui.summary.repeat") }}</span>
            <span class="is-pulled-right">
              {{ summary.repeat }}
              (
              {{ demojo(summary.repeat) }}
              )
            </span>
          </div>
          <div class="py-2"></div>
          <div class="has-text-weight-bold px-5">
            <span class="is-size-6 has-text-grey">{{ $t("inscription.ui.summary.netfee") }}</span>
            <span class="is-size-6 is-pulled-right has-text-grey">
              {{ demojo(summary.netFee) }}
            </span>
          </div>
          <div class="has-text-weight-bold px-5">
            <span class="is-size-6 has-text-grey">{{ $t("inscription.ui.summary.devfee") }}</span>
            <span class="is-size-6 is-pulled-right has-text-grey">
              {{ demojo(summary.devFee) }}
            </span>
          </div>
          <hr />
          <div class="has-text-weight-bold px-5">
            <span class="is-size-5">{{ $t("inscription.ui.summary.total") }}</span>
            <span class="is-pulled-right is-size-5 has-text-primary">
              {{ demojo(summary.total) }}
            </span>
          </div>
        </template>

        <hr />
        <bundle-summary :account="account" :bundle="bundle"></bundle-summary>
      </template>
    </section>
    <footer class="modal-card-foot is-block">
      <div>
        <b-button v-if="!bundle" :label="$t('common.button.cancel')" class="is-pulled-left" @click="cancel()"></b-button>
        <b-button v-if="bundle" :label="$t('common.button.back')" class="is-pulled-left" @click="cancel()"></b-button>
        <b-button
          :label="account.type == 'PublicKey' ? $t('common.button.generate') : $t('common.button.sign')"
          v-if="!bundle"
          type="is-primary"
          @click="sign()"
          :loading="submitting"
          :disabled="status == 'Loading' || submitting"
        ></b-button>
      </div>
      <div>
        <b-button
          :label="$t('common.button.submit')"
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
import { Component, Prop, Vue, Emit, Watch } from "vue-property-decorator";
import { AccountEntity, OneTokenInfo } from "../../../../lib-chia/models/account";
import KeyBox from "@/components/Common/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { TokenPuzzleDetail } from "../../../../lib-chia/services/crypto/receive";
import { signSpendBundle, SpendBundle, UnsignedSpendBundle } from "../../../../lib-chia/services/spendbundle";
import puzzle from "../../../../lib-chia/services/crypto/puzzle";
import { Hex, Hex0x, prefix0x } from "../../../../lib-chia/services/coin/condition";
import transfer, { SymbolCoins, TransferTarget } from "../../../../lib-chia/services/transfer/transfer";
import TokenAmountField from "@/components/Send/TokenAmountField.vue";
import { submitBundle } from "@/services/view/bundleAction";
import FeeSelector from "@/components/Send/FeeSelector.vue";
import BundleSummary from "@/components/Bundle/BundleSummary.vue";
import { networkContext, xchPrefix, xchSymbol } from "@/store/modules/network";
import { getAssetsRequestDetail, getAssetsRequestObserver, getAvailableCoins } from "@/services/view/coinAction";
import TopBar from "../Common/TopBar.vue";
import AddressField from "@/components/Common/AddressField.vue";
import store from "@/store";
import { demojo } from "@/filters/unitConversion";
import { sha256 } from "../../../../lib-chia/services/offer/bundler";
import { getBootstrapSpendBundle } from "../../../../lib-chia/services/coin/nft";

type PanelType = "mint" | "transfer" | "deploy" | "custom";

@Component({
  components: {
    KeyBox,
    FeeSelector,
    TokenAmountField,
    BundleSummary,
    TopBar,
    AddressField,
  },
})
export default class Inscription extends Vue {
  @Prop() public account!: AccountEntity;
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
  public amount = 1;
  public tick = "";
  public panel: PanelType = "mint";
  public repeat = 1;
  public limit = 1;
  public total = 21000000;

  public summary: {
    memo: string;
    type: PanelType;
    repeat: number;
    devFee: bigint;
    netFee: bigint;
    totalFee: bigint;
    total: bigint;
  } | null = null;

  public validAddress = true;
  public address = "";
  public signAddress = "";

  public readonly MAX_REPEAT = 25;

  public requests: TokenPuzzleDetail[] = [];

  mounted(): void {
    this.loadCoins();
    this.address = this.account.firstAddress ?? "";
  }

  get path(): string {
    return this.$route.path;
  }

  @Watch("path")
  onPathChange(): void {
    this.close();
  }

  @Emit("close")
  close(): void {
    if (this.path.endsWith("inscribe")) this.$router.back();
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

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  async loadCoins(): Promise<void> {
    this.bundle = null;
    this.status = "Loading";

    if (!this.requests || this.requests.length == 0) {
      this.requests = await getAssetsRequestDetail(this.account);
    }

    if (!this.availcoins) {
      this.availcoins = await getAvailableCoins(this.account);
    }

    this.status = "Loaded";
  }

  // readonly deployFee = 20n;
  // readonly transferFee = 10n;
  // readonly mintFee = 3n;
  readonly deployFee = 50000000000n;
  readonly transferFee = 0n;
  readonly mintFee = 50000000n;
  readonly service_hex: Hex0x = "0xe8022865bd618645ba1f20f1205ddd02207f93a2cfec6241e66f47d12fcbdfea";

  calculateAmount(): bigint {
    if (this.panel == "deploy") {
      return this.deployFee;
    } else if (this.panel == "mint") {
      return this.mintFee * BigInt(this.repeat);
    } else if (this.panel == "transfer") {
      return this.transferFee;
    } else {
      throw Error("not support");
    }
  }

  calculateMemo(): string {
    if (this.panel == "deploy") {
      return `{'p':'xchs','op':'deploy','tick':'${this.tick}','max':'${this.total}','lim':'${this.limit}'}`;
    } else if (this.panel == "mint") {
      return `{'p':'xchs','op':'mint','tick':'${this.tick}','amt':'${this.amount}'}`;
    } else if (this.panel == "transfer") {
      return `{'p':'xchs','op':'transfer','tick':'${this.tick}','amt':'${this.amount}'}`;
    } else {
      throw Error("not support");
    }
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

      const amount = this.calculateAmount();
      const repeat = this.panel == "mint" ? this.repeat : 1;

      let tgt_hex: Hex0x = "()";
      let change_hex: Hex0x = "()";
      try {
        tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.signAddress));
        change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.account.firstAddress));
      } catch (err) {
        Notification.open({
          message: this.$tc("send.messages.error.INVALID_ADDRESS"),
          type: "is-danger",
          duration: 5000,
        });
        this.validAddress = false;
        this.submitting = false;
        return;
      }

      if (!this.signAddress.startsWith(xchPrefix())) {
        Notification.open({
          message: this.$tc("send.messages.error.ADDRESS_NOT_MATCH_NETWORK"),
          type: "is-danger",
          duration: 5000,
        });
        this.validAddress = false;
        this.submitting = false;
        return;
      }

      const hint = prefix0x(sha256(Buffer.from(`{'p':'xchs','tick':'${this.tick}'}`)));
      const memo = this.calculateMemo();
      const observers = this.requests.length ? this.requests : await getAssetsRequestObserver(this.account);
      const fee = BigInt(this.fee);

      let ubundle: UnsignedSpendBundle;
      if (this.panel == "deploy" || this.panel == "transfer") {
        const tgts: TransferTarget[] = [{ address: tgt_hex, amount: 1n, symbol: xchSymbol(), memos: [hint, memo] }];
        if (amount > 0n) tgts.push({ address: this.service_hex, amount: amount, symbol: xchSymbol(), memos: [] });

        const plan = transfer.generateSpendPlan(this.availcoins, tgts, change_hex, fee, xchSymbol());
        ubundle = await transfer.generateSpendBundleWithoutCat(plan, observers, [], networkContext());
      } else if (this.panel == "mint") {
        const ms = Array(repeat).fill([hint, memo]);
        const init = repeat == 1 ? [[hint, memo]] : undefined;
        const etgts: TransferTarget[] =
          amount > 0n ? [{ address: this.service_hex, amount, symbol: xchSymbol(), memos: [] }] : [];

        const net = networkContext();
        const ac = this.availcoins;
        ubundle = await getBootstrapSpendBundle(tgt_hex, change_hex, fee, ac, observers, repeat, net, undefined, init, ms, etgts);
      } else {
        throw Error("not support");
      }

      if (this.account.type == "PublicKey") {
        this.bundle = await signSpendBundle(ubundle, [], networkContext());
        await this.offlineSignBundle();
      } else {
        this.bundle = await signSpendBundle(ubundle, this.requests, networkContext());
      }

      this.summary = {
        memo,
        netFee: fee,
        devFee: amount,
        totalFee: amount + fee,
        total: amount + fee + BigInt(repeat),
        type: this.panel,
        repeat,
      };
    } catch (error) {
      Notification.open({
        message: this.$tc("inscription.ui.messages.failedToSign") + error,
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

  get csvSampleUri(): string {
    const address = puzzle.getAddressFromPuzzleHash(
      "d19c05a54dacbf2b40ff4843534c47976de90246c3fc42ac1f42ea81b434b8ea",
      xchPrefix()
    );
    const dataPrefix = "data:text/csv;charset=utf-8";
    const fields = `${this.$tc("inscription.sample.address")},${this.$tc("inscription.sample.coin")},${this.$tc(
      "inscription.sample.amount"
    )},${this.$tc("inscription.sample.memo")}\n`;
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
        message: this.$tc("inscription.ui.messages.onlyOneFile"),
        type: "is-danger",
        autoClose: false,
      });
      this.dragfile = [];
      return;
    }
    if (f[0].type !== "text/csv") {
      Notification.open({
        message: this.$tc("inscription.ui.messages.wrongFileType"),
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

  updateEffectiveAddress(value: string): void {
    this.signAddress = value;
  }

  updateAddress(value: string): void {
    this.address = value;
    this.validAddress = true;
  }

  demojo(mojo: null | number | bigint, token: OneTokenInfo | null = null): string {
    return demojo(mojo, token);
  }
}
</script>

<style scoped lang="scss">
.field ::v-deep textarea {
  font-size: 0.9em;
}
.right_slider {
  min-width: 180px;
  margin: 0 30px;
}

.no_content_panel {
  margin-bottom: 0;
}
</style>
