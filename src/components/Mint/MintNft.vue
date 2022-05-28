<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("mintNft.ui.title") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <div v-show="!bundle">
        <b-field :label="$t('mintNft.ui.label.address')">
          <b-input v-model="address" @input="reset()" expanded :disabled="!addressEditable"></b-input>
          <p class="control">
            <b-tooltip :label="$t('mintNft.ui.tooltip.qr')">
              <b-button @click="scanQrCode()" :disabled="!addressEditable">
                <b-icon icon="scan-helper"></b-icon>
              </b-button>
            </b-tooltip>
          </p>
        </b-field>
        <b-field v-if="false" :label="$t('mintNft.ui.label.memo')">
          <b-input maxlength="100" v-model="memo" type="text" @input="reset()" disabled></b-input>
        </b-field>
        <b-field :label="$t('mintNft.ui.label.uri')">
          <template #message>
            <a :href="uri" target="_blank">
              <img v-if="uri" :src="uri" class="image-preview" />
            </a>
          </template>
          <b-input maxlength="1024" v-model="uri" type="text" @input="reset()" required></b-input>
        </b-field>
        <b-field :label="$t('mintNft.ui.label.hash')">
          <b-input maxlength="64" v-model="hash" type="text" @input="reset()" required></b-input>
        </b-field>
        <fee-selector v-model="fee" @input="changeFee()"></fee-selector>
      </div>
      <template v-if="bundle">
        <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
          <span v-html="$sanitize($t('mintNft.ui.summary.notification'))"></span>
        </b-notification>
        <send-summary
          :nftUri="uri"
          :nftHash="hash"
          :fee="feeBigInt"
          :address="address"
          :leadingText="$t('mintNft.ui.summary.label.leadingText')"
          :total="total"
        ></send-summary>
        <bundle-summary :account="account" :bundle="bundle" :ignoreError="true"></bundle-summary>
      </template>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <div>
        <b-button :label="$t('mintNft.ui.button.cancel')" @click="cancel()"></b-button>
        <b-button
          :label="$t('mintNft.ui.button.sign')"
          v-if="!bundle"
          type="is-primary"
          @click="sign()"
          :disabled="!validity || submitting"
        ></b-button>
      </div>
      <div>
        <b-button
          :label="$t('mintNft.ui.button.submit')"
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
import { TokenPuzzleDetail } from "@/services/crypto/receive";
import store from "@/store";
import { SpendBundle } from "@/models/wallet";
import bigDecimal from "js-big-decimal";
import ScanQrCode from "@/components/ScanQrCode.vue";
import { SymbolCoins } from "@/services/transfer/transfer";
import TokenAmountField from "@/components/TokenAmountField.vue";
import coinHandler from "@/services/transfer/coin";
import { debugBundle, submitBundle } from "@/services/view/bundle";
import FeeSelector from "@/components/FeeSelector.vue";
import BundleSummary from "../BundleSummary.vue";
import SendSummary from "../SendSummary.vue";
import { xchSymbol } from "@/store/modules/network";
import { getTokenInfo } from "@/services/coin/cat";
import { generateMintNftBundle } from "@/services/coin/nft";

@Component({
  components: {
    KeyBox,
    FeeSelector,
    TokenAmountField,
    BundleSummary,
    SendSummary,
  },
})
export default class MintNft extends Vue {
  @Prop() private account!: AccountEntity;
  public addressEditable = true;
  public submitting = false;
  public fee = 0;
  public address = "";
  public memo = "";
  public bundle: SpendBundle | null = null;
  public availcoins: SymbolCoins | null = null;
  public maxAmount = "-1";
  public totalAmount = "-1";
  public maxStatus: "Loading" | "Loaded" = "Loading";
  // public uri = "https://aws1.discourse-cdn.com/business4/uploads/chia/original/1X/682754dfb596e0b4ec08dc23442cc5a9192418e3.png";
  // public hash = "76a1900b6931f7bf5f07ab310733270838b040385f285423f49e2f5518867335";
  public uri = "";
  public hash = "";
  public selectedToken = xchSymbol();
  public validity = false;

  public requests: TokenPuzzleDetail[] = [];

  mounted(): void {
    this.loadCoins();
    this.address = this.account.firstAddress ?? "";
  }

  @Emit("close")
  close(): void {
    return;
  }

  get decimal(): number {
    return this.selectedToken == xchSymbol() ? 12 : 3;
  }

  get tokenNames(): string[] {
    return [xchSymbol()];
  }

  get symbol(): string {
    return xchSymbol();
  }

  get feeBigInt(): bigint {
    return BigInt(this.fee);
  }

  get total(): bigint {
    return this.feeBigInt + 1n;
  }

  get debugMode(): boolean {
    return store.state.app.debug;
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

  get tokenInfo(): TokenInfo {
    return getTokenInfo(this.account);
  }

  changeToken(token: string): void {
    this.selectedToken = token;
    if (this.selectedToken == xchSymbol()) {
      this.memo = "";
    }
    this.reset();
    this.loadCoins();
  }

  changeValidity(valid: boolean): void {
    this.validity = valid;
    this.reset();
  }

  async loadCoins(): Promise<void> {
    this.bundle = null;
    this.maxAmount = "-1";
    this.totalAmount = "-1";
    this.maxStatus = "Loading";

    if (!this.requests || this.requests.length == 0) {
      this.requests = await coinHandler.getAssetsRequestDetail(this.account);
    }

    if (!this.availcoins) {
      this.availcoins = await coinHandler.getAvailableCoins(this.requests, this.tokenNames);
    }

    if (!this.availcoins || !this.availcoins[this.selectedToken]) {
      return;
    }

    const availcoins = this.availcoins[this.selectedToken].map((_) => _.amount);

    this.totalAmount = bigDecimal.divide(
      availcoins.reduce((a, b) => a + b, 0n),
      Math.pow(10, this.decimal),
      this.decimal
    );
    const singleMax = bigDecimal.divide(
      availcoins.reduce((a, b) => (a > b ? a : b), 0n),
      Math.pow(10, this.decimal),
      this.decimal
    );
    if (this.selectedToken == xchSymbol()) {
      this.maxAmount = this.totalAmount;
      this.totalAmount = "-1";
    } else {
      this.maxAmount = singleMax;
    }
    this.maxStatus = "Loaded";

    this.changeValidity(true);
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

      const { spendBundle } = await generateMintNftBundle(
        this.address,
        this.account.firstAddress,
        BigInt(this.fee),
        { uri: this.uri, hash: this.hash },
        this.availcoins,
        this.requests
      );

      this.bundle = spendBundle;
    } catch (error) {
      Notification.open({
        message: this.$tc("mintNft.ui.messages.failedToSign") + error,
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

    await store.dispatch("persistent");
    await store.dispatch("refreshBalance");
  }

  debugBundle(): void {
    if (!this.bundle) return;
    debugBundle(this, this.bundle);
  }

  scanQrCode(): void {
    this.$buefy.modal.open({
      parent: this,
      component: ScanQrCode,
      hasModalCard: true,
      trapFocus: true,
      props: {},
      events: {
        scanned: (value: string): void => {
          this.reset();
          this.address = value;
        },
      },
    });
  }

  changeFee(): void {
    this.reset();
  }
}
</script>

<style scoped lang="scss">
img.image-preview {
  width: 50%;
  height: 3rem;
  object-fit: cover;
  border: 1px solid;
}
</style>
