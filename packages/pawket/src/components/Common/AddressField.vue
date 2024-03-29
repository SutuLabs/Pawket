<template>
  <b-field>
    <template #label>
      {{ label ? label : $t("addressField.ui.label.address") }}
      <b-button v-if="isNewAddress" tag="a" type="is-primary is-light" size="is-small" @click="addAddress()">
        <span>
          {{ $t("addressField.ui.span.newAddress") }}
        </span>
      </b-button>
      <span v-if="contactName" class="tag is-primary is-light">
        {{ contactName }}
      </span>
    </template>
    <template #message>
      <span>
        <b-tag v-if="cnsResolve && cnsResolve.status == 'Found'" type="is-info is-light">{{ cnsResolve.cns }}</b-tag>
        <span v-if="!resolveAnswer || resolveAnswer.name != address.toLowerCase()"></span>
        <span v-else-if="resolveAnswer.status == 'Failure'">
          <b-icon type="is-warning" icon="alert-decagram-outline" size="is-small"></b-icon>
          {{ $t("addressField.ui.resolve.fail") }}
        </span>
        <span v-else-if="resolveAnswer.status == 'NotFound'">
          <b-icon type="is-danger" icon="alert-decagram" size="is-small"></b-icon>
          {{ $t("addressField.ui.resolve.notFound") }}
        </span>
        <span v-else-if="resolveAnswer.status == 'Found'" class="is-flex">
          <div>
            <a class="has-text-dark" :href="spaceScanUrl + nftAddress" target="_blank">
              <img v-if="cnsUrl" :src="cnsUrl" class="image is-128x128" />
              <div v-else class="image is-128x128">
                <b-loading active :is-full-page="false"></b-loading>
              </div>
            </a>
          </div>
          <div class="ml-4">
            <p class="mb-2">
              <b-tooltip :label="$t('addressField.ui.tooltip.confirmed')" v-if="onChainConfirmationStatus == 'Confirmed'">
                <b-icon type="is-success" icon="check-decagram"></b-icon>
              </b-tooltip>
              <b-tooltip :label="$t('addressField.ui.tooltip.confirming')" v-else-if="onChainConfirmationStatus == 'Confirming'">
                <b-icon type="is-info" icon="decagram" size="is-small"></b-icon>
              </b-tooltip>
              <b-tooltip :label="$t('addressField.ui.tooltip.wrong')" v-else-if="onChainConfirmationStatus == 'Wrong'">
                <b-icon type="is-danger" icon="alert-decagram" size="is-small"></b-icon>
              </b-tooltip>
              <b-tag type="is-info is-light">{{ address.toLowerCase() }}</b-tag>
            </p>
            <p class="mb-2">
              {{ $t("addressField.ui.label.bindingAddress") }}
              <key-box icon="checkbox-multiple-blank-outline" :value="resolvedAddress" :showValue="true"></key-box>
            </p>
            <p v-if="lastUpdate">
              {{ $t("addressField.ui.label.lastChanged") }}
              <span>{{ lastUpdate }}</span>
            </p>
          </div>
        </span>
      </span>
    </template>
    <b-input
      v-model="address"
      expanded
      :disabled="!addressEditable"
      :custom-class="validAddress ? '' : 'is-danger'"
      :loading="isResolving"
      :title="address"
    ></b-input>
    <p class="control">
      <b-tooltip :label="$t('addressField.ui.tooltip.addressBook')" v-if="showAddressBook">
        <b-button @click="openAddressBook()" :disabled="!addressEditable">
          <b-icon icon="account"></b-icon>
        </b-button>
      </b-tooltip>
      <b-tooltip :label="$t('addressField.ui.tooltip.qr')">
        <b-button @click="scanQrCode()" :disabled="!addressEditable">
          <b-icon icon="scan-helper"></b-icon>
        </b-button>
      </b-tooltip>
    </p>
  </b-field>
</template>
<script lang="ts">
import store from "@/store";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import AddressBook, { Contact } from "@/components/AddressBook/AddressBook.vue";
import { chainId, convertToChainId, ensureAddress, rpcUrl, xchPrefix } from "@/store/modules/network";
import KeyBox from "@/components/Common/KeyBox.vue";
import puzzle from "../../../../pawket-chia-lib/services/crypto/puzzle";
import debug from "../../../../pawket-chia-lib/services/api/debug";
import { CoinSpend } from "../../../../pawket-chia-lib/services/spendbundle";
import { analyzeNftCoin, getScalarString } from "../../../../pawket-chia-lib/services/coin/nft";
import { decodeAddress } from "@/services/view/camera";
import { resolveName, StandardResolveAnswer } from "@/services/api/resolveName";
import { getCnsName, reverseResolveAnswer } from "@/services/api/reverseResolve";
import { tc } from "@/i18n/i18n";

@Component({
  components: {
    KeyBox,
  },
})
export default class AddressField extends Vue {
  @Prop() public inputAddress!: string;
  @Prop({ default: true }) public validAddress!: boolean;
  @Prop({ default: true }) public addressEditable!: boolean;
  @Prop({ default: true }) public showAddressBook!: boolean;
  @Prop() public label!: string;

  public address = "";
  public cnsUrl = "";
  public contacts: Contact[] = [];
  public resolveAnswer: StandardResolveAnswer | null = null;
  public cnsResolve: reverseResolveAnswer | null = null;
  public proofCoin: CoinSpend | null = null;
  public onChainConfirmationStatus: "None" | "Confirming" | "Confirmed" | "Wrong" = "None";
  public inputing = false;
  public isResolving = false;

  mounted(): void {
    if (this.inputAddress) {
      this.address = this.inputAddress;
      this.reset();
    }
    this.updateContacts();
  }

  @Watch("inputAddress")
  onInputAddressChanged(): void {
    this.address = this.inputAddress;
  }

  @Watch("outputAddress")
  onOutputAddressChanged(): void {
    this.$emit("updateEffectiveAddress", this.outputAddress);
  }

  @Watch("address")
  onAddressChanged(): void {
    this.$emit("updateAddress", this.address);
    if (!this.inputing) {
      setTimeout(() => {
        this.reset();
        this.inputing = false;
      }, 1000);
    }
    this.inputing = true;
  }

  @Watch("contactName")
  onContactNameChanged(): void {
    this.$emit("updateContactName", this.contactName);
  }

  get network(): string {
    return chainId();
  }

  get outputAddress(): string {
    if (this.resolvedAddress) {
      this.$emit("updateContactName", this.address);
      return this.resolvedAddress;
    } else {
      return this.address;
    }
  }

  get isNewAddress(): boolean {
    if (this.address.length < 32) return false;
    return this.contactName == "";
  }

  get accountFinger(): number {
    return store.state.account.accounts[store.state.account.selectedAccount].key.fingerprint;
  }

  get innerAccs(): Contact[] {
    const innerAccs: Contact[] = [];
    store.state.account.accounts.forEach((acc) => {
      if (acc.firstAddress) innerAccs.push({ name: acc.name, address: ensureAddress(acc.firstAddress) });
    });
    return innerAccs;
  }

  get contactName(): string {
    for (let c of this.contacts) {
      if (c.address === this.address) return c.name;
    }

    for (let ia of this.innerAccs) {
      if (ia.address === this.address) return ia.name;
    }

    if (this.cnsResolve && this.cnsResolve.cns) return this.cnsResolve.cns;

    return "";
  }

  updateContacts(): void {
    const contactsJson = localStorage.getItem("CONTACTS");
    if (contactsJson == null) {
      return;
    }
    let contacts = JSON.parse(contactsJson);
    for (let c of contacts) {
      this.contacts.push({ name: c.name, address: c.address, network: convertToChainId(c.network) });
    }
  }

  get resolvedAddress(): string | null {
    if (this.resolveAnswer?.status != "Found" || !this.resolveAnswer?.data) return null;
    return puzzle.getAddressFromPuzzleHash(this.resolveAnswer?.data, xchPrefix());
  }

  get nftAddress(): string | null {
    if (this.resolveAnswer?.status != "Found" || !this.resolveAnswer?.nft_coin_name) return null;
    return puzzle.getAddressFromPuzzleHash(this.resolveAnswer?.nft_coin_name, "nft");
  }

  get spaceScanUrl(): string {
    return store.state.network.network.spaceScanUrl;
  }

  get lastUpdate(): string {
    if (this.resolveAnswer?.status != "Found" || !this.resolveAnswer?.proof_coin_spent_index) return "";
    if (!store.state.network.peekHeight) return "";
    const hoursAgo = (store.state.network.peekHeight - this.resolveAnswer.proof_coin_spent_index) / (6 * 32);
    if (hoursAgo < 24) return tc("addressField.ui.label.hour", undefined, { value: hoursAgo.toFixed(0) });
    const daysAgo = hoursAgo / 24;
    if (daysAgo < 7) return tc("addressField.ui.label.day", undefined, { value: daysAgo.toFixed(0) });
    const weeksAgo = daysAgo / 7;
    if (weeksAgo < 4) return tc("addressField.ui.label.week", undefined, { value: weeksAgo.toFixed(0) });
    const monthsAgo = weeksAgo / 4;
    if (monthsAgo < 12) return tc("addressField.ui.label.month", undefined, { value: monthsAgo.toFixed(0) });
    const yearsAgo = monthsAgo / 12;
    return tc("addressField.ui.label.year", undefined, { value: yearsAgo.toFixed(0) });
  }

  async reset(): Promise<void> {
    this.validAddress = true;
    if (
      this.address.match(/[a-zA-Z0-9-]{4,}\.xch$/) &&
      (this.resolveAnswer?.status == "Found" && this.resolveAnswer?.name) != this.address
    ) {
      this.onChainConfirmationStatus = "None";
      this.isResolving = true;
      this.resolveAnswer = await resolveName(this.address);
      this.isResolving = false;
      if (this.resolveAnswer?.status == "Found" && this.resolveAnswer?.proof_coin_name) {
        this.onChainConfirmationStatus = "Confirming";
        this.proofCoin = await debug.getCoinSolution(this.resolveAnswer?.proof_coin_name, rpcUrl());
        const nftAnalysis = await analyzeNftCoin(
          this.proofCoin.puzzle_reveal,
          undefined,
          this.proofCoin.coin,
          this.proofCoin.solution
        );
        if (
          nftAnalysis != null &&
          "cnsName" in nftAnalysis &&
          nftAnalysis.cnsName == this.address.toLowerCase() &&
          this.resolveAnswer?.data == nftAnalysis.cnsAddress
        ) {
          this.cnsUrl = getScalarString(nftAnalysis.metadata.imageUri) ?? "";
          this.onChainConfirmationStatus = "Confirmed";
        } else {
          this.onChainConfirmationStatus = "Wrong";
        }
      }
    } else {
      this.cnsResolve = null;
      if (this.address.startsWith(xchPrefix())) {
        this.isResolving = true;
        var res = await getCnsName([puzzle.getPuzzleHashFromAddress(this.address)]);
        if (res.length) this.cnsResolve = res[0];
        this.isResolving = false;
      }
      this.resolveAnswer = null;
      this.cnsUrl = "";
    }
  }

  async scanQrCode(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: (await import("@/components/Common/ScanQrCode.vue")).default,
      hasModalCard: true,
      trapFocus: true,
      props: {},
      events: {
        scanned: (value: string): void => {
          this.reset();
          this.address = decodeAddress(xchPrefix(), value) ?? this.address;
        },
      },
    });
  }

  openAddressBook(): void {
    this.$buefy.modal.open({
      parent: this,
      component: AddressBook,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { parent: "Send" },
      events: {
        selected: (value: string): void => {
          this.reset();
          this.address = value;
        },
      },
    });
  }

  addAddress(): void {
    this.$buefy.modal.open({
      parent: this,
      component: AddressBook,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { parent: "Send", defaultMode: "Add", defaultAddress: this.address },
      events: { added: this.updateContacts },
    });
    return;
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }
}
</script>
