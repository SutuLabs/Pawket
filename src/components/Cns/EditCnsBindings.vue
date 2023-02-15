<template>
  <confirmation
    :title="$t('bindingInformation.ui.title')"
    @cancel="close()"
    @close="close()"
    :signBtn="$t('bindingInformation.ui.button.update')"
    :value="bundle"
    @back="cancel()"
    @sign="sign()"
    @confirm="submit()"
    :showClose="true"
    :loading="submitting || signing"
    :disabled="submitting || signing"
    :submitting="submitting"
  >
    <template #sign>
      <address-field :inputAddress="address" @updateAddress="updateAddress"></address-field>
      <b-field>
        <template #label>
          <span>{{ $t("bindingInformation.ui.label.publicKey") }}</span>
          <span v-if="isCurrentPk" class="tag is-primary is-light">{{
            $t("bindingInformation.ui.tag.currentPk")
          }}</span>
          <span v-else class="is-size-7 is-underlined mx-2 has-text-link is-clickable" @click="fillPubKey()">{{
            $t("bindingInformation.ui.tag.fillPk")
          }}</span>
        </template>
        <b-input v-model="publicKey" type="text"></b-input>
      </b-field>
      <b-field>
        <template #label>
          <span>{{ $t("bindingInformation.ui.label.did") }}</span>
          <span v-if="didName" class="tag is-primary is-light"> {{ didName }}</span>
        </template>
      </b-field>
      <b-input
        v-model="did"
        type="text"
        icon-right="menu-down"
        :icon-right-clickable="true"
        @icon-right-click="toggle()"
        expanded
      ></b-input>
      <b-dropdown aria-role="list" ref="dropdown" expanded>
        <b-dropdown-item :value="d.did" aria-role="listitem" v-for="(d, i) in dids" :key="i" @click="setDid(d)">
          <span>{{ d.name }}</span>
        </b-dropdown-item>
      </b-dropdown>
      <b-field :label="$t('bindingInformation.ui.label.text')">
        <b-input v-model="text" type="text"></b-input>
      </b-field>
      <fee-selector v-model="fee"></fee-selector>
    </template>
    <template #confirm>
      <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
        <span v-html="$sanitize($tc('bindingInformation.ui.notification'))"></span>
      </b-notification>
      <address-field :inputAddress="address" @updateAddress="updateAddress" :addressEditable="false"></address-field>
      <b-field>
        <template #label>
          <span>{{ $t("bindingInformation.ui.label.publicKey") }}</span>
          <span v-if="isCurrentPk" class="tag is-primary is-light"> Current account PK </span>
        </template>
        <b-input v-model="publicKey" type="text" disabled></b-input>
      </b-field>
      <b-field>
        <template #label>
          <span>{{ $t("bindingInformation.ui.label.did") }}</span>
          <span v-if="didName" class="tag is-primary is-light"> {{ didName }}</span>
        </template>
        <b-input v-model="did" type="text" disabled></b-input>
      </b-field>
      <b-field :label="$t('bindingInformation.ui.label.text')">
        <b-input v-model="text" type="text" disabled></b-input>
      </b-field>
      <b-field>
        <template #label>
          <span class="is-size-6 has-text-grey">{{ $t("sendSummary.ui.label.fee") }}</span>
          <span class="is-size-6 is-pulled-right has-text-grey">
            {{ demojo(fee) }}
          </span>
        </template>
      </b-field>
      <bundle-summary :account="account" :bundle="bundle" :ignoreError="true"></bundle-summary>
    </template>
  </confirmation>
</template>

<script lang="ts">
import { AccountEntity, OneTokenInfo } from "@/models/account";
import { Hex, prefix0x } from "@/services/coin/condition";
import { generateUpdatedNftBundle } from "@/services/coin/nft";
import puzzle from "@/services/crypto/puzzle";
import { DidDetail, NftDetail, TokenPuzzleDetail } from "@/services/crypto/receive";
import utility from "@/services/crypto/utility";
import { signSpendBundle, SpendBundle } from "@/services/spendbundle";
import { SymbolCoins } from "@/services/transfer/transfer";
import { getAssetsRequestDetail, getAssetsRequestObserver, getAvailableCoins } from "@/services/view/coinAction";
import store from "@/store";
import { networkContext, xchPrefix } from "@/store/modules/network";
import { Component, Prop, Vue } from "vue-property-decorator";
import AddressField from "../Common/AddressField.vue";
import Confirmation from "../Common/Confirmation.vue";
import FeeSelector from "../Send/FeeSelector.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { submitBundle } from "@/services/view/bundleAction";
import { demojo } from "@/filters/unitConversion";
import BundleSummary from "../Bundle/BundleSummary.vue";
import { CnsBindingValues, CnsMetadataValues } from "@/models/nft";

@Component({
  components: { Confirmation, FeeSelector, AddressField, BundleSummary },
})
export default class EditCnsBindings extends Vue {
  @Prop() public nft!: NftDetail;
  @Prop() public account!: AccountEntity;

  public bundle: SpendBundle | null = null;
  public availcoins: SymbolCoins | null = null;
  public tokenPuzzles: TokenPuzzleDetail[] = [];
  public signing = false;
  public submitting = false;
  public fee = 0;
  public address = "";
  public publicKey = "";
  public currentPublicKey = "";
  public did = "";
  public didName = "";
  public text = "";

  get dids(): DidDetail[] {
    return this.account.dids ?? [];
  }

  get metadata(): CnsMetadataValues {
    return this.nft.analysis.metadata as CnsMetadataValues;
  }

  get isCurrentPk(): boolean {
    return prefix0x(this.publicKey) == prefix0x(this.currentPublicKey);
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

  updateAddress(value: string): void {
    this.address = value;
  }

  demojo(mojo: null | number | bigint, token: OneTokenInfo | null = null, digits = -1): string {
    return demojo(mojo, token, digits);
  }

  close(): void {
    this.$emit("close");
  }

  cancel(): void {
    this.bundle = null;
  }

  toggle(): void {
    (this.$refs.dropdown as Vue & { toggle: () => void }).toggle();
  }

  setDid(did: DidDetail): void {
    const did_hex = prefix0x(puzzle.getPuzzleHashFromAddress(did.did));
    this.did = did_hex;
    this.didName = did.name;
  }

  fillPubKey(): void {
    this.publicKey = prefix0x(this.currentPublicKey);
  }

  async mounted(): Promise<void> {
    if (this.metadata.bindings) {
      if (this.metadata.bindings.address)
        this.address = puzzle.getAddressFromPuzzleHash(this.metadata.bindings.address, xchPrefix());
      this.publicKey = this.metadata.bindings.publicKey ?? "";
      this.did = this.metadata.bindings.did ?? "";
      this.text = this.metadata.bindings.text ?? "";
    }
    if (this.account.type == "PublicKey") {
      this.currentPublicKey = this.account.key.publicKey ?? "";
    } else {
      const privkey = utility.fromHexString(this.account.key.privateKey);
      utility.getPrivateKey(privkey).then((sk) => {
        this.currentPublicKey = utility.toHexString(sk.get_g1().serialize());
      });
    }
    await store.dispatch("refreshDids");
  }

  async sign(): Promise<void> {
    this.signing = true;
    try {
      if (!this.account.firstAddress) {
        this.signing = false;
        return;
      }

      await this.loadCoins();

      if (this.availcoins == null) {
        this.signing = false;
        return;
      }

      const md = Object.assign({}, this.metadata.bindings) as CnsBindingValues;
      if (this.address) {
        const address_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.address));
        md.address = address_hex;
      }
      if (this.did) {
        md.did = this.did;
      }
      if (this.publicKey) {
        md.publicKey = this.publicKey;
      }
      if (this.text) {
        md.text = this.text;
      }

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

  async submit(): Promise<void> {
    if (!this.bundle) return;
    submitBundle(this.bundle, this.account, (_) => (this.submitting = _), this.close);

    await store.dispatch("persistent");
    await store.dispatch("refreshBalance");
  }
}
</script>

<style scoped lang="scss"></style>
