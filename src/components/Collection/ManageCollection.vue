<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("collection.createCollection.title") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-field :label="$t('collection.createCollection.label.id')">
        <b-input required v-model="id" ref="id" :disabled="mode == 'EDIT'"></b-input>
      </b-field>
      <b-field :label="$t('collection.createCollection.label.name')">
        <b-input required v-model="name" ref="name"></b-input>
      </b-field>
      <b-field :label="$t('collection.createCollection.label.description')">
        <b-input type="textarea" v-model="description"></b-input>
      </b-field>
      <b-field>
        <template #label
          ><span>{{ $t("collection.createCollection.label.icon") }}<b-icon icon="help-circle" size="is-small"></b-icon></span
          ><span class="is-pulled-right"
            ><b-switch v-model="fillUrl">{{ $t("collection.createCollection.label.fillUrl") }}</b-switch></span
          >
        </template>
        <div class="is-block" v-if="!fillUrl">
          {{ $t("collection.createCollection.label.uploadImage") }}
          <b-upload v-model="imageFile">
            <b-button type="is-primary" outlined size="is-small">{{ $t("collection.createCollection.button.upload") }}</b-button>
          </b-upload>
        </div>
      </b-field>
      <div v-if="fillUrl" class="pb-5">
        <b-field :label="$t('collection.createCollection.label.iconUrl')">
          <b-input required expanded v-model="imageUrl" ref="imageUrl"></b-input>
        </b-field>
        <img v-if="imageUrl" class="image is-64x64 is-inline-block" :src="imageUrl" />
        <b-field :label="$t('collection.createCollection.label.iconHash')">
          <b-input required expanded v-model="imageHash" ref="imageHash"></b-input>
        </b-field>
      </div>
      <div class="is-flex pb-5" v-else>
        <img
          class="image is-64x64 is-inline-block"
          src="https://images.taildatabase.com/tails/3cf6d329-39d7-4ae1-8f5c-f038b7595bca.png"
        />
        <div class="pl-2">
          <div class="pb-2 has-text-grey">
            {{ $t("collection.createCollection.label.url")
            }}<key-box
              class="ml-2"
              icon="checkbox-multiple-blank-outline"
              :tooltip="$t('common.tooltip.copy')"
              value="https://images.taildatabase.com/tails/3cf6d329-39d7-4ae1-8f5c-f038b7595bca.png"
              :showValue="true"
            ></key-box>
          </div>
          <div class="has-text-grey">
            {{ $t("collection.createCollection.label.hash") }}
            <key-box
              class="ml-2"
              icon="checkbox-multiple-blank-outline"
              :tooltip="$t('common.tooltip.copy')"
              value="509deafe3cd8bbfbb9ccce1d930e3d7b57b40c964fa33379b18d628175eb7a8f"
              :showValue="true"
            ></key-box>
          </div>
        </div>
      </div>
      <b-field :label="$t('collection.createCollection.label.properties')"> </b-field>
      <b-field v-for="(_, index) of properties" :key="index">
        <p class="control">
          <b-input required expanded v-model="properties[index].attribute" placeholder="attribute"></b-input>
        </p>
        <b-input required expanded v-model="properties[index].value" placeholder="value"></b-input>
        <p v-if="index == 0" class="control">
          <span class="button is-primary" @click="addProperty()">+</span>
        </p>
        <p v-else class="control">
          <span class="button is-danger" @click="removeProperty(index)">-</span>
        </p>
      </b-field>
      <b-field :label="$t('collection.createCollection.label.creator')">
        <b-select expanded v-model="creator"></b-select>
      </b-field>
      <address-field
        :label="$t('collection.createCollection.label.address')"
        @updateAddress="updateAddress"
        :validAddress="validAddress"
        :inputAddress="address"
      ></address-field>
      <b-field :label="$t('collection.createCollection.label.royaltyPercentage')">
        <b-numberinput
          controls-alignment="left"
          controls-position="compact"
          step="0.01"
          min="0"
          max="100"
          v-model="royalPercentage"
          expanded
        ></b-numberinput>
        <p class="control">
          <span class="button is-static">%</span>
        </p>
      </b-field>
      <address-field
        :label="$t('collection.createCollection.label.royaltyAddress')"
        :validAddress="validRoyalAddress"
        :inputAddress="royalAddress"
        @updateAddress="updateRoyalAddress"
      ></address-field>
      <b-field :label="$t('collection.createCollection.label.licenseUrl')">
        <b-input expanded required v-model="licenseUrl" ref="licenseUrl"></b-input>
      </b-field>
      <b-field v-if="mode == 'EDIT'">
        <b-button :label="$t('common.button.delete')" expanded outlined type="is-danger" @click="remove()"></b-button>
      </b-field>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <b-button :label="$t('common.button.cancel')" @click="close()"></b-button>
      <b-button :label="$t('common.button.save')" type="is-primary" @click="save()"></b-button>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import AddressField from "@/components/Common/AddressField.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { v4 as uuidv4 } from "uuid";
import { CollectionItem, Property } from "@/models/collection";
import { prefix0x } from "@/services/coin/condition";
import puzzle from "@/services/crypto/puzzle";

type Mode = "EDIT" | "CREATE";

@Component({ components: { KeyBox, AddressField } })
export default class ManageCollection extends Vue {
  @Prop() collections!: CollectionItem[];
  @Prop({ default: "CREATE" }) mode!: Mode;
  @Prop() collection!: CollectionItem;

  id = "";
  name = "";
  description = "";
  imageFile: File | null = null;
  imageUrl = "";
  imageHash = "";
  properties: Property[] = [{ attribute: "", value: "" }];
  creator = "";
  address = "";
  royalPercentage = 5;
  royalAddress = "";
  licenseUrl = "";

  fillUrl = false;
  validRoyalAddress = true;
  validAddress = true;

  get uuid(): string {
    return uuidv4();
  }

  @Emit("close")
  close(): void {
    return;
  }

  save(): void {
    if (!this.check()) return;
    const collection: CollectionItem = {
      id: this.id,
      name: this.name,
      description: this.description,
      imageUrl: this.imageUrl,
      imageHash: this.imageHash,
      properties: this.properties,
      creator: this.creator,
      address: this.address,
      royalAddress: this.royalAddress,
      royalPercentage: this.royalPercentage,
      licenseUrl: this.licenseUrl,
    };
    if (this.mode == "EDIT") {
      this.$emit("update", collection);
    } else {
      this.collections.push(collection);
      localStorage.setItem("COLLECTION", JSON.stringify(this.collections));
    }
    this.close();
  }

  remove(): void {
    this.$buefy.dialog.confirm({
      message: this.$tc("collection.myCollection.messages.confirmation.delete"),
      confirmText: this.$tc("common.button.confirm"),
      cancelText: this.$tc("common.button.cancel"),
      trapFocus: true,
      type: "is-danger",
      onConfirm: () => {
        this.$emit("remove", this.collection.id);
        this.close();
      },
    });
  }

  check(): boolean {
    if (!(this.$refs.id as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity()) return false;
    if (!(this.$refs.name as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity()) return false;

    if (this.fillUrl) {
      if (!(this.$refs.imageUrl as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity()) return false;
      if (!(this.$refs.imageHash as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity()) return false;
    }

    if (this.properties[0].attribute == "" || this.properties[0].value == "") {
      Notification.open({
        message: this.$tc("collection.createCollection.messages.error.INVALID_PROPERTY"),
        type: "is-danger",
        duration: 5000,
      });
      return false;
    }

    try {
      puzzle.getPuzzleHashFromAddress(this.address);
    } catch (err) {
      this.validAddress = false;
      Notification.open({
        message: this.$tc("collection.createCollection.messages.error.INVALID_ADDRESS"),
        type: "is-danger",
        duration: 5000,
      });
      return false;
    }

    try {
      prefix0x(puzzle.getPuzzleHashFromAddress(this.royalAddress));
    } catch (err) {
      this.validRoyalAddress = false;
      Notification.open({
        message: this.$tc("collection.createCollection.messages.error.INVALID_ADDRESS"),
        type: "is-danger",
        duration: 5000,
      });
      return false;
    }

    if (!(this.$refs.licenseUrl as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity()) return false;

    return true;
  }

  addProperty(): void {
    this.properties.push({ attribute: "", value: "" });
  }

  removeProperty(index: number): void {
    this.properties.splice(index, 1);
  }

  updateAddress(value: string): void {
    this.validAddress = true;
    this.address = value;
  }

  updateRoyalAddress(value: string): void {
    this.validRoyalAddress = true;
    this.royalAddress = value;
  }

  mounted(): void {
    if (this.mode == "EDIT" && this.collection) {
      this.id = this.collection.id;
      this.name = this.collection.name;
      this.description = this.collection.description;
      this.imageUrl = this.collection.imageUrl;
      this.imageHash = this.collection.imageHash;
      this.properties = this.collection.properties;
      this.creator = this.collection.creator ?? "";
      this.address = this.collection.address;
      this.royalAddress = this.collection.royalAddress;
      this.royalPercentage = this.collection.royalPercentage;
      this.licenseUrl = this.collection.licenseUrl;
      return;
    }
    this.id = this.uuid;
  }
}
</script>
