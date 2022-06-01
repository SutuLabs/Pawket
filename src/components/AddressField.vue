<template>
  <b-field>
    <template #label>
      {{ $t("addressField.ui.label.address") }}
      <b-button v-if="isNewAddress" tag="a" type="is-primary is-light" size="is-small" @click="addAddress()">
        <span>
          {{ $t("addressField.ui.span.newAddress") }}
        </span>
      </b-button>
      <span v-if="contactName" class="tag is-primary is-light">
        {{ contactName }}
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
import AddressBook, { Contact } from "./AddressBook.vue";
import ScanQrCode from "./ScanQrCode.vue";

@Component
export default class AddressField extends Vue {
  @Prop() private inputAddress!: string;
  @Prop({ default: true }) private validAddress!: boolean;
  @Prop({ default: true }) private addressEditable!: boolean;

  public address = "";
  public contacts: Contact[] = [];

  mounted(): void {
    if (this.inputAddress) this.address = this.inputAddress;
    this.updateContacts();
  }

  @Watch("inputAddress")
  onInputAddressChanged(): void {
    this.address = this.inputAddress;
  }

  @Watch("address")
  onAddressChanged(): void {
    this.$emit("update", this.address);
  }

  get network(): string {
    return store.state.network.networkId;
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
    console.log(store.state.account.accounts);
    store.state.account.accounts.forEach((acc) => {
      if (acc.key.fingerprint !== this.accountFinger) innerAccs.push({ name: acc.name, address: acc.firstAddress ?? "" });
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
      this.contacts.push({ name: c.name, address: c.address, network: c.network ? c.network : "mainnet" });
    }
  }

  reset(): void {
    this.validAddress = true;
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

  openAddressBook(): void {
    this.$buefy.modal.open({
      parent: this,
      component: AddressBook,
      hasModalCard: true,
      trapFocus: true,
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
      props: { parent: "Send", defaultMode: "Add", defaultAddress: this.address },
      events: { added: this.updateContacts },
    });
    return;
  }
}
</script>
