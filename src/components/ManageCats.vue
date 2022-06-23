<template>
  <div class="modal-card">
    <b-loading :is-full-page="true" v-model="submitting"></b-loading>
    <section>
      <header class="modal-card-head">
        <p class="modal-card-title">
          {{ $t("ManageCats.ui.title.ManageCats") }}
        </p>
        <button type="button" class="delete" @click="close()"></button>
      </header>
      <section class="modal-card-body">
        <b-tabs position="is-centered" class="block" expanded v-model="activeTab">
          <b-tab-item label="Search">
            <search-cat :allCats="allCats" @addCats="addCats"></search-cat>
          </b-tab-item>
          <b-tab-item label="Custom">
            <b-field :label="$t('ManageCats.ui.label.name')">
              <b-input
                v-model="name"
                type="text"
                required
                maxlength="36"
                :validation-message="$t('ManageCats.ui.message.nameRequired')"
                ref="name"
                title=""
              ></b-input>
            </b-field>
            <b-field :label="$t('ManageCats.ui.label.assetID')">
              <b-input
                v-model="assetId"
                type="text"
                required
                ref="assetId"
                title=""
                :validation-message="$t('ManageCats.ui.message.assetIdRequired')"
              ></b-input>
            </b-field>
            <div class="mt-5 pt-3 has-text-centered">
              <b-button
                :label="$t('ManageCats.ui.button.add')"
                type="is-primary"
                rounded
                outlined
                class="mx-2"
                @click="add()"
              ></b-button>
            </div>
          </b-tab-item>
        </b-tabs>
        <hr class="mt-0 pt-0" />
        <b-field :label="$t('ManageCats.ui.label.listingCats')">
          <div class="y-scroll pt-5" style="max-height: 25vh">
            <token-item :catList="assetIds" @remove="remove" v-sortable="sortableOptions" @updateOrder="updateOrder"></token-item>
          </div>
        </b-field>
      </section>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import store from "@/store/index";
import { NotificationProgrammatic as Notification } from "buefy";
import { sortable } from "@/directives/sortable";
import { AccountEntity, CustomCat, getAccountCats, getDefaultCats } from "@/store/modules/account";
import TokenItem from "@/components/TokenItem.vue";
import { Bytes } from "clvm";
import { shorten } from "@/filters/addressConversion";
import SearchCat from "./AddCat/SearchCat.vue";
import { TailInfo } from "@/services/api/tailDb";

@Component({
  directives: {
    sortable,
  },
  filters: {
    shorten,
  },
  components: {
    TokenItem,
    SearchCat,
  },
})
export default class ManageCats extends Vue {
  @Prop() private account!: AccountEntity;
  @Prop({ default: "" }) defaultName!: string;
  @Prop({ default: "" }) defaultAssetId!: string;
  @Prop({ default: 0 }) activeTab!: number;

  public name = this.defaultName;
  public assetId = this.defaultAssetId;
  public assetIds: CustomCat[] = [];
  public defaultCats: CustomCat[] = [];

  sortableOptions = {
    chosenClass: "box",
    draggable: ".list-item",
    handle: ".drag-handle",
  };
  submitting = false;

  mounted(): void {
    if (!this.account) {
      console.error("account is empty, cannot get settings");
      return;
    }
    this.assetIds = getAccountCats(this.account);
    this.defaultCats = getDefaultCats();
  }

  get allCats(): CustomCat[] {
    return this.defaultCats.concat(this.assetIds);
  }

  close(): void {
    if (this.name.length || this.assetId.length) {
      this.$buefy.dialog.confirm({
        message: this.$tc("ManageCats.message.confirmation.closeWithContent"),
        confirmText: this.$tc("ManageCats.message.confirmation.confirm"),
        cancelText: this.$tc("ManageCats.message.confirmation.cancel"),
        onConfirm: () => this.$emit("close"),
      });
    } else {
      this.$emit("close");
    }
  }

  validate(): void {
    (this.$refs.name as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
    (this.$refs.assetId as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
  }

  isExisted(name: string, id: string): boolean {
    const allCats = this.defaultCats.concat(this.assetIds);
    for (let t of allCats) {
      if (t.id === id || t.name.toUpperCase() === name.toUpperCase()) {
        return true;
      }
    }
    return false;
  }

  async add(): Promise<void> {
    this.validate();
    if (this.name.length == 0 || this.assetId.length == 0) {
      return;
    }
    if (!this.isAssetId(this.assetId)) {
      Notification.open({
        message: this.$tc("ManageCats.message.notification.wrongAssetId"),
        type: "is-danger",
      });
      return;
    }
    if (this.isExisted(this.name, this.assetId)) {
      Notification.open({
        message: this.$tc("ManageCats.message.alert.isExisted"),
        type: "is-danger",
      });
      return;
    }
    this.assetIds.push({ name: this.name.toUpperCase(), id: this.assetId });
    this.submit();
    this.reset();
  }

  addCats(tails: TailInfo[]): void {
    tails.map((_) => {
      this.assetIds.push({ name: _.code, id: _.hash, img: _.logo_url });
    });
    this.submit();
  }

  remove(id: string): void {
    this.$buefy.dialog.confirm({
      message: this.$tc("ManageCats.message.confirmation.removeToken"),
      onConfirm: () => {
        const aid = this.assetIds.findIndex((a) => a.id == id);
        if (aid > -1) {
          this.assetIds.splice(aid, 1);
          this.submit();
        }
      },
    });
  }

  isAssetId(assetId: string): boolean {
    try {
      return Bytes.from(assetId, "hex").length == 32;
    } catch {
      return false;
    }
  }

  reset(): void {
    this.assetId = "";
    this.name = "";
  }

  async submit(): Promise<void> {
    this.submitting = true;
    const network = store.state.network.networkId;
    this.account.allCats = this.account.allCats
      .filter((_) => _.network != network)
      .concat(this.assetIds.map((_) => ({ name: _.name, id: _.id, img: _.img, network })));
    this.account.addressGenerated = 0;
    await store.dispatch("persistent");
    this.$emit("refresh");

    Notification.open({
      message: this.$tc("ManageCats.message.notification.saved"),
      type: "is-primary",
    });

    this.submitting = false;
  }

  updateOrder(newOrder: CustomCat[]): void {
    this.assetIds = newOrder;
    this.submit();
  }
}
</script>

<style scoped lang="scss">
.y-scroll {
  overflow-y: scroll;
  overflow-x: hidden;
}
</style>
