<template>
  <confirmation
    :value="bundle"
    :title="$t('updateCns.ui.title')"
    @close="close()"
    @back="cancel()"
    @sign="sign()"
    :signBtn="account.type == 'PublicKey' ? $t('common.button.generate') : $t('common.button.sign')"
    @cancel="cancel()"
    @confirm="submit()"
    :showClose="true"
    :loading="signing"
    :disabled="submitting"
    :submitting="submitting"
  >
    <template #sign>
      <b-field>
        <img v-if="nft.metadata.uri" :src="nft.metadata.uri" class="image is-64x64" />
        <img v-else src="@/assets/nft-no-image.png" class="image is-64x64" />
        <span class="pl-2 has-text-grey break-word">
          <p>
            {{ nft.metadata.name }}
            <br />
            {{ currentAddress }}
          </p>
        </span>
      </b-field>
      <address-field
        :label="$t('updateCns.ui.label.targetAddress')"
        :inputAddress="address"
        @updateAddress="updateAddress"
        @updateContactName="updateContactName"
      ></address-field>
      <fee-selector v-model="fee"></fee-selector>
    </template>
    <template #confirm>
      <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
        <span v-html="$sanitize($tc('updateCns.ui.confirmation'))"></span>
      </b-notification>
      <div class="mb-3">
        <b-field>
          <span class="break-word has-text-grey is-size-7" style="width: 80%">
            <span class="has-text-weight-bold is-size-5 has-text-dark">{{ $tc("updateCns.ui.label.cns") }}</span
            ><br />
            {{ $tc("updateCns.ui.label.currentBindingAddress") }}<br />
            {{ currentAddress }}
          </span>
          <div>
            <b-tooltip :label="nft.metadata.uri" multilined position="is-left" class="break-word">
              <a :href="nft.metadata.uri" target="_blank">
                <img v-if="nft.metadata.uri" :src="nft.metadata.uri" class="image is-96x96" />
                <img v-else src="@/assets/nft-no-image.png" class="image is-96x96"
              /></a>
            </b-tooltip>
          </div>
        </b-field>
        <b-field>
          <template #label>
            <span class="is-size-6">{{ $t("updateCns.ui.label.updateTo") }}</span>
            <span class="is-size-6 is-pulled-right">
              <span v-if="contactName" class="tag is-primary is-light">{{ contactName }}</span>
              <b-tooltip :label="address" multilined position="is-left" class="break-word">{{ shorten(address) }}</b-tooltip>
            </span>
          </template>
        </b-field>
        <b-field>
          <template #label>
            <span class="is-size-6 has-text-grey">{{ $t("sendSummary.ui.label.fee") }}</span>
            <span class="is-size-6 is-pulled-right has-text-grey">
              {{ demojo(fee) }}
            </span>
          </template>
        </b-field>
      </div>
      <bundle-summary :account="account" :bundle="bundle" :ignoreError="true"></bundle-summary>
    </template>
  </confirmation>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import { signSpendBundle, SpendBundle } from "@/services/spendbundle";
import { AccountEntity, OneTokenInfo } from "@/models/account";
import store from "@/store";
import AddressField from "@/components/Common/AddressField.vue";
import { SymbolCoins } from "@/services/transfer/transfer";
import { CnsDetail, TokenPuzzleDetail } from "@/services/crypto/receive";
import DevHelper from "@/components/DevHelper/DevHelper.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { networkContext, xchPrefix, xchSymbol } from "@/store/modules/network";
import { submitBundle } from "@/services/view/bundleAction";
import { generateUpdatedNftBundle } from "@/services/coin/nft";
import FeeSelector from "@/components/Send/FeeSelector.vue";
import { demojo } from "@/filters/unitConversion";
import { shorten } from "@/filters/addressConversion";
import BundleSummary from "../Bundle/BundleSummary.vue";
import Confirmation from "../Common/Confirmation.vue";
import puzzle from "@/services/crypto/puzzle";
import { Hex, prefix0x } from "@/services/coin/condition";
import { getAssetsRequestDetail, getAssetsRequestObserver, getAvailableCoins } from "@/services/view/coinAction";

@Component({
  components: {
    KeyBox,
    FeeSelector,
    BundleSummary,
    Confirmation,
    AddressField,
  },
})
export default class NftUpdate extends Vue {
  @Prop() public account!: AccountEntity;
  @Prop() public nft!: CnsDetail;

  public bundle: SpendBundle | null = null;
  public step: "Input" | "Confirmation" = "Input";
  public availcoins: SymbolCoins | null = null;
  public tokenPuzzles: TokenPuzzleDetail[] = [];
  public signing = false;
  public submitting = false;
  public fee = 0n;
  public address = "";
  public contactName = "";

  get currentAddress(): string {
    try {
      return puzzle.getAddressFromPuzzleHash(this.nft.analysis.cnsAddress, xchPrefix());
    } catch (err) {
      return "";
    }
  }

  get bundleJson(): string {
    return JSON.stringify(this.bundle, null, 4);
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  @Emit("close")
  close(): void {
    return;
  }

  reset(): void {
    this.bundle = null;
    this.step = "Input";
  }

  updateAddress(value: string): void {
    this.address = value;
    this.reset();
  }

  updateContactName(value: string): void {
    this.contactName = value;
  }

  cancel(): void {
    if (this.bundle) {
      this.reset();
    } else {
      this.close();
    }
  }

  get tokenNames(): string[] {
    return [xchSymbol()];
  }

  async mounted(): Promise<void> {
    await this.loadCoins();
  }

  demojo(mojo: null | number | bigint, token: OneTokenInfo | null = null, digits = -1): string {
    return demojo(mojo, token, digits);
  }

  shorten(name: string): string {
    return shorten(name);
  }

  get xchSymbol(): string {
    return xchSymbol();
  }

  async loadCoins(): Promise<void> {
    if (!this.tokenPuzzles || this.tokenPuzzles.length == 0) {
      this.tokenPuzzles = this.account.type == "PublicKey" ? [] : await getAssetsRequestDetail(this.account);
    }

    if (!this.availcoins) {
      const coins = await getAvailableCoins(this.account);
      this.availcoins = coins[0];
    }
  }

  async sign(): Promise<void> {
    this.signing = true;
    try {
      if (!this.account.firstAddress) {
        this.signing = false;
        return;
      }

      if (this.availcoins == null) {
        this.signing = false;
        return;
      }

      const address_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.address));
      const md = Object.assign({}, this.nft.analysis.metadata.bindings);
      md.address = address_hex;
      const observers = await getAssetsRequestObserver(this.account);
      const ubundle = await generateUpdatedNftBundle(
        this.account.firstAddress,
        BigInt(this.fee),
        this.nft.coin,
        this.nft.analysis,
        "CNS",
        "bindings",
        md,
        this.availcoins,
        observers,
        networkContext()
      );

      this.bundle = await signSpendBundle(ubundle, this.tokenPuzzles, networkContext());
      this.step = "Confirmation";
      if (this.account.type == "PublicKey") {
        await this.offlineSignBundle();
      }
    } catch (error) {
      Notification.open({
        message: this.$tc("mintNft.ui.messages.failedToSign") + error,
        type: "is-danger",
        autoClose: false,
      });
      console.warn(error);
      this.signing = false;
    }
    this.signing = false;
  }

  async submit(): Promise<void> {
    if (!this.bundle) return;
    submitBundle(this.bundle, this.account, (_) => (this.submitting = _), this.close);

    await store.dispatch("persistent");
    await store.dispatch("refreshBalance");
  }

  debugBundle(): void {
    this.$buefy.modal.open({
      parent: this,
      component: DevHelper,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { inputBundleText: this.bundleJson },
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
.break-word {
  word-break: break-all;
}
img.nft-image {
  width: 100px;
  height: 1.5rem;
  object-fit: cover;
  border: 1px solid;
}
</style>
