<template>
  <div class="modal-card">
    <top-bar v-if="mode == 'Detail'" :title="$t('addressDetail.ui.title.detail')" @close="back()" :showClose="true"></top-bar>
    <top-bar v-if="mode == 'Edit'" :title="$t('addressDetail.ui.title.edit')" @close="back()" :showClose="true"></top-bar>
    <section class="modal-card-body" v-if="mode == 'Detail'">
      <b-field :label="$t('addressDetail.ui.label.name')">
        <span>{{ name }}</span>
      </b-field>
      <b-field :label="$t('addressDetail.ui.label.address')">
        <span class="word-break"
          >{{ address }}
          <key-box
            icon="checkbox-multiple-blank-outline"
            :tooltip="$t('addressDetail.ui.tooltip.copy')"
            :value="address"
            :showValue="false"
          ></key-box
        ></span>
      </b-field>
      <div class="has-text-centered">
        <b-button v-if="isEditable" type="is-primary" @click="edit()">{{ $t("addressDetail.ui.button.edit") }}</b-button>
      </div>
    </section>
    <section class="modal-card-body" v-if="mode == 'Edit'">
      <address-book-field
        :defaultName="name"
        :defaultAddress="address"
        :isEdit="true"
        @save="save"
        @cancel="cancel"
      ></address-book-field>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Contact } from "./AddressBook.vue";
import AddressBookField from "./AddressBookFields.vue";
import KeyBox from "@/components/Common/KeyBox.vue";
import TopBar from "../Common/TopBar.vue";

type Mode = "Detail" | "Edit";
@Component({
  components: { KeyBox, AddressBookField, TopBar },
})
export default class AddressDetail extends Vue {
  @Prop() contact?: Contact;
  @Prop() index?: number;
  @Prop({ default: true }) isEditable?: boolean;

  public mode: Mode = "Detail";
  public name = "";
  public address = "";

  setValue(): void {
    if (this.contact) {
      this.name = this.contact.name;
      this.address = this.contact.address;
    }
  }

  mounted(): void {
    this.setValue();
  }

  back(): void {
    this.$emit("close");
  }

  cancel(): void {
    this.mode = "Detail";
    this.setValue();
    return;
  }

  save(name: string, address: string): void {
    this.name = name;
    this.address = address;
    const newContact: Contact = { name: name, address: address, network: this.contact?.network };
    this.$emit("edit", this.index, newContact);
    this.mode = "Detail";
    return;
  }

  edit(): void {
    this.mode = "Edit";
  }
}
</script>
<style scoped type="text/scss">
.word-break {
  word-break: break-all;
}
</style>
