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
        <span v-if="!resolveAnswer"></span>
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
              <b-tag type="is-info is-light">{{ address }}</b-tag>
            </p>
            <p class="mb-2">
              {{ $t("addressField.ui.label.bindingAddress") }}
              <key-box icon="checkbox-multiple-blank-outline" :value="resolvedAddress" :showValue="true"></key-box>
            </p>
            <p v-if="hoursAgo > 0">
              {{ $t("addressField.ui.label.lastChanged") }}
              <span>{{ hoursAgo.toFixed(0) }} {{ $t("addressField.ui.label.hoursAgo") }}</span>
            </p>
          </div>
        </span>
      </span>
    </template>
    <b-input
      v-model="address"
      @input="reset()"
      expanded
      :disabled="!addressEditable"
      :custom-class="validAddress ? '' : 'is-danger'"
    ></b-input>
    <p class="control">
      <b-tooltip :label="$t('addressField.ui.tooltip.addressBook')">
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
import puzzle from "@/services/crypto/puzzle";
import debug from "@/services/api/debug";
import { CoinSpend } from "@/services/spendbundle";
import { analyzeNftCoin, getScalarString } from "@/services/coin/nft";
import { decodeAddress } from "@/services/view/camera";

@Component({
  components: {
    KeyBox,
  },
})
export default class AddressField extends Vue {
  @Prop() public inputAddress!: string;
  @Prop({ default: true }) public validAddress!: boolean;
  @Prop({ default: true }) public addressEditable!: boolean;
  @Prop() public label!: string;

  public address = "";
  public cnsUrl = "";
  public contacts: Contact[] = [];
  public resolveAnswer: StandardResolveAnswer | ResolveFailureAnswer | null = null;
  public proofCoin: CoinSpend | null = null;
  public onChainConfirmationStatus: "None" | "Confirming" | "Confirmed" | "Wrong" = "None";

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

  get hoursAgo(): number {
    if (this.resolveAnswer?.status != "Found" || !this.resolveAnswer?.proof_coin_spent_index) return -1;
    if (!store.state.network.peekHeight) return -1;
    return (store.state.network.peekHeight - this.resolveAnswer.proof_coin_spent_index) / (6 * 32);
  }

  async reset(): Promise<void> {
    this.validAddress = true;
    if (
      this.address.match(/[a-zA-Z0-9-]{4,}\.xch$/) &&
      (this.resolveAnswer?.status == "Found" && this.resolveAnswer?.name) != this.address
    ) {
      this.onChainConfirmationStatus = "None";
      this.resolveAnswer = await resolveName(this.address);
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
          nftAnalysis.cnsName == this.address &&
          this.resolveAnswer?.data == nftAnalysis.cnsAddress
        ) {
          this.cnsUrl = getScalarString(nftAnalysis.metadata.imageUri) ?? "";
          this.onChainConfirmationStatus = "Confirmed";
        } else {
          this.onChainConfirmationStatus = "Wrong";
        }
      }
    } else {
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

export interface StandardResolveQueryRequest {
  queries?: StandardResolveQuery[];
}
export interface StandardResolveQueryResponse {
  answers?: StandardResolveAnswer[];
}
export interface StandardResolveQuery {
  name: string;
  type: string;
}
export interface StandardResolveAnswer {
  name?: string;
  type?: string;
  time_to_live?: number;
  data?: string;
  proof_coin_name?: string;
  proof_coin_spent_index?: number;
  nft_coin_name?: string;
  status: "Found";
}
export interface ResolveFailureAnswer {
  status: "NotFound" | "Failure";
}

export type resolveType = "address" | "did" | "publicKey" | "text";

export async function resolveName(
  name: string,
  resType: resolveType = "address"
): Promise<StandardResolveAnswer | ResolveFailureAnswer> {
  try {
    const resp = await fetch(rpcUrl() + "Name/resolve", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queries: [{ name, type: resType }],
      }),
    });
    const qresp = (await resp.json()) as StandardResolveQueryResponse;
    const answer = qresp.answers?.at(0);
    if (answer) answer.status = "Found";
    return answer || { status: "NotFound" };
  } catch (error) {
    console.warn(error);
    return { status: "Failure" };
  }
}
</script>
