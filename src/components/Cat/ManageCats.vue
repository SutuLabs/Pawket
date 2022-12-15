<template>
  <div class="modal-card" style="overflow-y: auto">
    <b-loading :active="submitting" :is-full-page="false"></b-loading>
    <section>
      <top-bar :title="$t('ManageCats.ui.title.ManageCats')" @close="close()" :showClose="true"></top-bar>
      <section class="modal-card-body">
        <b-tabs position="is-centered" class="block" expanded v-model="activeTab">
          <b-tab-item :label="$t('ManageCats.ui.label.search')">
            <search-cat :allCats="allCats" @addCats="addCats"></search-cat>
          </b-tab-item>
          <b-tab-item :label="$t('ManageCats.ui.label.custom')">
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
        <b-field :label="$t('ManageCats.ui.label.listingCats')" class="border-top-1 pt-5">
          <div class="y-scroll pt-5" style="max-height: 30vh">
            <token-item :catList="assetIds" @remove="remove" v-sortable="sortableOptions" @updateOrder="updateOrder"></token-item>
          </div>
        </b-field>
      </section>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import store from "@/store/index";
import { NotificationProgrammatic as Notification } from "buefy";
import { sortable } from "@/directives/sortable";
import { AccountEntity, CustomCat } from "@/models/account";
import { getAccountCats, getAllCats } from "@/store/modules/account";
import TokenItem from "@/components/Cat/TokenItem.vue";
import { Bytes } from "clvm";
import SearchCat from "@/components/Cat/SearchCat.vue";
import { TailInfo } from "@/services/api/tailDb";
import { unprefix0x } from "@/services/coin/condition";
import { chainId, convertToChainId } from "@/store/modules/network";
import TopBar from "../Common/TopBar.vue";

@Component({
  directives: {
    sortable,
  },
  components: {
    TokenItem,
    SearchCat,
    TopBar,
  },
})
export default class ManageCats extends Vue {
  @Prop() public account!: AccountEntity;
  @Prop({ default: "" }) defaultName!: string;
  @Prop({ default: "" }) defaultAssetId!: string;
  @Prop({ default: 0 }) defaultTab!: number;

  public name = "";
  public assetId = "";
  public assetIds: CustomCat[] = [];
  public defaultCats: CustomCat[] = [];
  public activeTab = 0;
  submitting = false;

  sortableOptions = {
    chosenClass: "box",
    draggable: ".list-item",
    handle: ".drag-handle",
  };

  mounted(): void {
    if (!this.account) {
      console.error("account is empty, cannot get settings");
      return;
    }
    this.assetIds = getAccountCats(this.account);

    this.name = this.defaultName;
    this.assetId = this.defaultAssetId;
    this.activeTab = this.defaultTab;
  }

  get allCats(): CustomCat[] {
    return getAllCats(this.account);
  }

  get path(): string {
    return this.$route.path;
  }

  @Watch("path")
  onPathChange(): void {
    this.close();
  }

  async close(): Promise<void> {
    this.submitting = true;
    if (this.name.length || this.assetId.length) {
      this.$buefy.dialog.confirm({
        message: this.$tc("ManageCats.message.confirmation.closeWithContent"),
        confirmText: this.$tc("ManageCats.message.confirmation.confirm"),
        cancelText: this.$tc("ManageCats.message.confirmation.cancel"),
        onConfirm: async () => {
          this.name = "";
          this.assetId = "";
          await store.dispatch("persistent");
          this.submitting = false;
          this.$emit("refresh");
          this.$emit("close");
        },
        onCancel: () => (this.submitting = false),
      });
    } else {
      await store.dispatch("persistent");
      this.submitting = false;
      this.$emit("refresh");
      this.$emit("close");
    }
  }

  validate(): void {
    (this.$refs.name as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
    (this.$refs.assetId as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
  }

  isExisted(name: string, id: string): boolean {
    for (let t of this.allCats) {
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
    this.assetId = unprefix0x(this.assetId);
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

  async addCats(tails: TailInfo[]): Promise<void> {
    tails.map((_) => {
      if (this.isExisted(_.code, _.hash)) {
        Notification.open({
          message: this.$tc("ManageCats.message.alert.isExisted") + " " + _.code,
          type: "is-danger",
          duration: 3000,
        });
      } else {
        this.assetIds.push({ name: _.code, id: _.hash, img: _.logo_url });
      }
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
        }
        this.submit();
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
    const network = chainId();
    this.account.allCats = this.account.allCats
      .filter((_) => convertToChainId(_.network) != network)
      .concat(this.assetIds.map((_) => ({ name: _.name, id: _.id, img: _.img, network })));
    this.account.addressGenerated = 0;
  }

  updateOrder(detail: { oldIndex: number; newIndex: number }): void {
    const oldIndex = detail.oldIndex;
    const newIndex = detail.newIndex;
    const data = this.assetIds;
    const item = data[oldIndex];
    if (newIndex > oldIndex) {
      for (let i = oldIndex; i < newIndex; i++) {
        data[i] = data[i + 1];
      }
    } else {
      for (let i = oldIndex; i > newIndex; i--) {
        data[i] = data[i - 1];
      }
    }
    data[newIndex] = item;
    const newOrder: CustomCat[] = [];
    for (let i = 0; i < data.length; i++) {
      newOrder.push({ name: data[i].name, id: data[i].id, img: data[i].img });
    }
    this.assetIds = newOrder;
    this.submit();
  }
}
</script>

<style scoped lang="scss">
@import "~bulma/sass/utilities/derived-variables";

.y-scroll {
  overflow-y: auto;
  overflow-x: hidden;
}

.border-top-1 {
  border-top: 1px solid $grey-lighter;
}
</style>
