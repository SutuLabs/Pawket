<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p v-if="mode == 'List'" class="modal-card-title">{{ $t("addressBook.ui.title.list") }}</p>
      <p v-if="mode == 'Add'" class="modal-card-title">{{ $t("addressBook.ui.title.add") }}</p>
      <button type="button" class="delete" @click="back()"></button>
    </header>
    <section v-if="mode == 'List'" class="modal-card-body">
      <div v-if="!isNotEmpty">
        <p class="is-size-5 p-2">{{ $t("addressBook.ui.text.createYourAddressBook") }}</p>
      </div>
      <div>
        <div class="mb-3">
          <a @click="addContact()" class="button is-fullwidth is-primary is-outlined is-size-6">
            <b-icon icon="plus" size="is-small" class="mr-1"></b-icon>
            {{ $t("addressBook.ui.button.addContact") }}
          </a>
        </div>
        <a href="javascript:void(0)" @click="showInnerAcc = !showInnerAcc">
          <p
            :class="
              showInnerAcc
                ? 'py-2 has-background-primary has-text-white is-size-5 border-bottom'
                : 'py-2 has-text-primary is-size-5 border-bottom'
            "
          >
            <span class="pl-4">{{ $t("addressBook.ui.button.showInnerAcc") }}</span>
            <b-icon class="is-pulled-right" :icon="showInnerAcc ? 'menu-up' : 'menu-down'" size="is-medium"></b-icon>
          </p>
        </a>
        <div v-if="showInnerAcc" class="my-4 border-bottom">
          <a
            href="javascript:void(0)"
            v-for="(contact, i) of innerAccs"
            :key="i"
            @click="showDetail(contact, i, false)"
            class="ml-4 mb-2 panel-block columns is-mobile"
          >
            <div class="column is-flex is-11">
              <div class="mr-2">
                <b-icon icon="account-circle" size="is-medium" class="has-text-primary"></b-icon>
              </div>
              <div>
                <p class="has-text-grey-dark is-size-6">{{ contact.name | nameOmit }}</p>
                <p>
                  <span class="is-size-7 has-text-grey-light word-break">{{ contact.address }}</span>
                </p>
              </div>
            </div>
          </a>
        </div>
        <div class="mt-4">
          <a
            href="javascript:void(0)"
            v-for="(contact, i) of contacts"
            v-show="contact.network && contact.network == network"
            :key="i"
            @click="showDetail(contact, i)"
            class="panel-block columns is-mobile"
          >
            <div class="column is-flex is-11">
              <div class="mr-2">
                <b-icon icon="account-circle" size="is-medium" class="has-text-primary"></b-icon>
              </div>
              <div>
                <p class="has-text-grey-dark is-size-6">{{ contact.name | nameOmit }}</p>
                <p>
                  <span class="is-size-7 has-text-grey-light word-break">{{ contact.address }}</span>
                </p>
              </div>
            </div>
            <div class="column is-flex is-1">
              <b-tooltip :label="$t('addressBook.ui.tooltip.remove')">
                <b-button @click.stop="removeConfirm(i)" type="is-text"><b-icon icon="trash-can-outline"></b-icon></b-button>
              </b-tooltip>
            </div>
          </a>
        </div>
      </div>
    </section>
    <section v-if="mode == 'Add'" class="modal-card-body">
      <address-book-field :defaultAddress="address" :defaultName="name" @save="save" @cancel="cancel"></address-book-field>
    </section>
  </div>
</template>

<script lang="ts">
import { nameOmit } from "@/filters/nameConversion";
import { notifyPrimary } from "@/notification/notification";
import store from "@/store";
import { Component, Prop, Vue } from "vue-property-decorator";
import AddressBookField from "./AddressBook/AddressBookFields.vue";
import AddressDetail from "./AddressDetail.vue";
import ScanQrCode from "./ScanQrCode.vue";

type Mode = "List" | "Add";
type Parent = "Send" | "Configure";
export type Contact = {
  name: string;
  address: string;
  network?: string;
};
@Component({
  filters: { nameOmit },
  components: { AddressBookField },
})
export default class AddressBook extends Vue {
  @Prop({ default: "Configure" }) private parent!: Parent;
  @Prop({ default: "List" }) private defaultMode!: Mode;
  @Prop({ default: "" }) private defaultAddress!: string;
  public mode: Mode = this.defaultMode;
  public name = "";
  public address = this.defaultAddress;
  public contacts: Contact[] = [];
  public showInnerAcc = false;

  get network(): string {
    return store.state.network.networkId;
  }

  get accountFinger(): number {
    return store.state.account.accounts[store.state.account.selectedAccount].key.fingerprint;
  }

  get innerAccs(): Contact[] {
    const innerAccs: Contact[] = [];
    store.state.account.accounts.forEach((acc) => {
      if (acc.key.fingerprint !== this.accountFinger) innerAccs.push({ name: acc.name, address: acc.firstAddress ?? "" });
    });
    return innerAccs;
  }

  get isNotEmpty(): boolean {
    for (let c of this.contacts) {
      if (c.network === this.network) return true;
    }
    return false;
  }

  removeConfirm(idx: number): void {
    this.$buefy.dialog.confirm({
      message: this.$tc("addressBook.messages.confirmation.removeConfirm"),
      confirmText: this.$tc("addressBook.ui.button.confirm"),
      cancelText: this.$tc("addressBook.ui.button.cancel"),
      onConfirm: () => this.remove(idx),
    });
  }

  updateContacts(): void {
    const contactsJson = localStorage.getItem("CONTACTS");
    if (contactsJson == null) {
      return;
    }
    this.contacts = [];
    let contacts = JSON.parse(contactsJson);
    for (let c of contacts) {
      this.contacts.push({ name: c.name, address: c.address, network: c.network ? c.network : "mainnet" });
    }
  }

  mounted(): void {
    this.updateContacts();
  }

  reset(): void {
    this.name = "";
    this.address = "";
  }

  back(): void {
    if (this.parent === "Configure") {
      this.mode === "Add" ? (this.mode = "List") : this.$emit("back");
    } else {
      this.$emit("close");
    }
  }

  addContact(): void {
    this.mode = "Add";
  }

  cancel(): void {
    this.mode = "List";
  }

  save(name: string, address: string): void {
    const idx = this.contacts.findIndex((c) => c.network == this.network && c.address === address);
    if (idx > -1) {
      this.$buefy.dialog.alert(this.$tc("addressBook.messages.alert.addressExists"));
      return;
    }
    this.contacts.push({ name: name, address: address, network: this.network });
    localStorage.setItem("CONTACTS", JSON.stringify(this.contacts));
    notifyPrimary(this.$tc("addressBook.messages.notification.contactAdded"));
    this.mode = "List";
    this.$emit("added");
  }

  remove(index: number): void {
    this.contacts.splice(index, 1);
    localStorage.setItem("CONTACTS", JSON.stringify(this.contacts));
    notifyPrimary(this.$tc("addressBook.messages.notification.contactRemoved"));
    return;
  }

  edit(index: number, contact: Contact): void {
    const idx = this.contacts.findIndex((c) => c.network == contact.network && c.address === contact.address);
    if (idx > -1 && idx !== index) {
      this.$buefy.dialog.alert(this.$tc("addressBook.messages.alert.addressExists"));
      return;
    }
    this.contacts[index] = contact;
    localStorage.setItem("CONTACTS", JSON.stringify(this.contacts));
    notifyPrimary(this.$tc("addressBook.messages.notification.saved"));
    this.updateContacts();
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
          this.address = value;
        },
      },
    });
  }

  showDetail(contact: Contact, index: number, editable = true): void {
    if (this.parent === "Send") {
      this.selected(contact.address);
      return;
    }
    this.$buefy.modal.open({
      parent: this,
      component: AddressDetail,
      hasModalCard: true,
      trapFocus: true,
      canCancel: ["x", "outside"],
      props: { contact: contact, index: index, isEditable: editable },
      events: { edit: this.edit },
    });
  }

  selected(address: string): void {
    this.$emit("selected", address);
    this.$emit("close");
  }

  setName(value: string): void {
    this.name = value;
  }

  setAddress(value: string): void {
    this.address = value;
  }
}
</script>
<style lang="scss">
.word-break {
  word-break: break-all;
}

.border-bottom {
  border-bottom: 1px solid #ededed;
}
</style>
