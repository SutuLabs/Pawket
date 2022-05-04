<template>
  <div class="modal-card">
    <b-loading :is-full-page="true" v-model="submitting"></b-loading>
    <section>
      <header class="modal-card-head">
        <p class="modal-card-title">
          {{ $t("addToken.ui.title.addToken") }}
        </p>
        <button type="button" class="delete" @click="close()"></button>
      </header>
      <section class="modal-card-body">
        <b-field :label="$t('addToken.ui.label.name')">
          <b-input
            v-model="name"
            type="text"
            required
            maxlength="36"
            :validation-message="$t('addToken.ui.message.nameRequired')"
            ref="name"
          ></b-input>
        </b-field>
        <b-field :label="$t('addToken.ui.label.assetID')">
          <b-input
            v-model="assetId"
            type="text"
            required
            ref="assetId"
            :validation-message="$t('addToken.ui.message.assetIdRequired')"
          ></b-input>
        </b-field>
        <div class="has-text-centered">
          <b-button :label="$t('addToken.ui.button.add')" type="is-primary" class="mx-2" @click="add()"></b-button>
        </div>
        <hr />
        <div class="y-scroll pt-5" style="height: 40vh">
          <b-field :label="$t('addToken.ui.label.listingCats')">
            <token-item :catList="assetIds" @remove="remove" v-sortable="sortableOptions" @updateOrder="updateOrder"></token-item>
          </b-field>
        </div>
      </section>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import store from "@/store/index";
import { NotificationProgrammatic as Notification } from "buefy";
import { sortable } from "@/directives/sortable";
import { AccountEntity, CustomCat } from "@/store/modules/account";
import TokenItem from "@/components/TokenItem.vue";
import { Bytes } from "clvm";
import { shorten } from "@/filters/addressConversion";

@Component({
  directives: {
    sortable,
  },
  filters: {
    shorten,
  },
  components: {
    TokenItem,
  },
})
export default class AddToken extends Vue {
  @Prop() private account!: AccountEntity;

  sortableOptions = {
    chosenClass: "box",
    draggable: ".panel-block",
    handle: ".drag-handle",
  };
  assetIds: CustomCat[] = [];
  name = "";
  assetId = "";
  submitting = false;

  mounted(): void {
    if (!this.account) {
      console.error("account is empty, cannot get settings");
      return;
    }
    this.assetIds = [...(this.account.cats ?? [])];
  }

  @Emit("close")
  close(): void {
    return;
  }

  validate(): void {
    (this.$refs.name as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
    (this.$refs.assetId as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
  }

  async add(): Promise<void> {
    this.validate();
    if (this.name.length == 0 || this.assetId.length == 0) {
      return;
    }
    if (!this.isAssetId(this.assetId)) {
      Notification.open({
        message: this.$tc("addToken.message.notification.wrongAssetId"),
        type: "is-danger",
      });
      return;
    }
    const idx = this.assetIds.findIndex((a) => a.name == this.name);
    if (idx > -1) {
      this.$buefy.dialog.alert({
        message: this.$tc("addToken.message.alert.nameExists"),
      });
      return;
    }
    const eidx = this.assetIds.findIndex((_) => _.id == this.assetId);
    if (eidx > -1) {
      this.$buefy.dialog.alert({
        message: this.$tc("addToken.message.alert.idExists"),
      });
      return;
    }
    const defaultCats = Object.values(store.state.account.tokenInfo)
      .map((_) => ({ name: _.symbol, id: _.id }))
      .filter((_) => _.id);
    const didx = defaultCats.findIndex((_) => _.id == this.assetId);
    const dname = defaultCats.findIndex((_) => _.name == this.name);
    if (didx > -1 || dname > -1) {
      this.$buefy.dialog.alert({
        message: this.$tc("addToken.message.alert.isDefaultCat"),
      });
      return;
    }
    this.assetIds.push({ name: this.name, id: this.assetId });
    this.submit();
    this.reset();
  }

  remove(id: string): void {
    this.$buefy.dialog.confirm({
      message: this.$tc("addToken.message.confirm.removeToken"),
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
    this.account.cats = this.assetIds;
    await store.dispatch("persistent");
    this.$emit("refresh");

    Notification.open({
      message: this.$tc("addToken.message.notification.saved"),
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
}
</style>
