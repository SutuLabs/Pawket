<template>
  <div class="modal-card">
    <section>
      <header class="modal-card-head">
        <p class="modal-card-title">
          添加CAT
        </p>
        <button type="button" class="delete" @click="close()"></button>
      </header>
      <section class="modal-card-body">
        <b-field :label="$t('accountConfigure.ui.label.listingCATs')">
          <b-taginput
            class="taginput-sortable"
            v-sortable="sortableOptions"
            v-model="cats"
            ellipsis
            icon="label"
            :before-adding="beforeAdd"
            :placeholder="$t('accountConfigure.ui.placeholder.addCAT')"
          >
          </b-taginput>
          <template #message>
            <ul>
              <li v-for="asset in assetIds" :key="asset.id">{{ asset.name }}: {{ asset.id }}</li>
            </ul>
          </template>
        </b-field>
      </section>
       <footer class="modal-card-foot is-justify-content-space-between">
        <div>
          <b-button :label="$t('accountConfigure.ui.button.cancel')" @click="close()"></b-button>
          <b-button :label="$t('accountConfigure.ui.button.submit')" type="is-primary" @click="submit()"></b-button>
        </div>
      </footer>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import store from "@/store/index";
import { NotificationProgrammatic as Notification } from "buefy";
import { DialogProgrammatic as Dialog } from "buefy";
import { sortable } from "@/directives/sortable";
import { AccountEntity, CustomCat } from "@/store/modules/account";
import { Bytes } from "clvm";

@Component({
  directives: {
    sortable,
  },
})
export default class AddCAT extends Vue {
  @Prop() private account!: AccountEntity;
  public maxAddress: number | null = null;
  public displayMaxAddressSlider = false;

  sortableOptions = {
    chosenClass: "is-primary",
    draggable: ".tag",
  };
  cats: string[] = [];
  assetIds: CustomCat[] = [];

  mounted(): void {
    if (!this.account) {
      console.error("account is empty, cannot get settings");
      return;
    }
    this.assetIds = [...(this.account.cats ?? [])];
    this.cats = this.assetIds.map((_) => _.name);
  }

  @Emit("close")
  close(): void {
    return;
  }

  beforeAdd(name: string): boolean {
    const type = this.isAssetId(name) ? "ENTERNAME" : "ENTERASSETID";
    const msg =
      type == "ENTERNAME"
        ? this.$tc("accountConfigure.message.prompt.enterAssetName")
        : this.$tc("accountConfigure.message.prompt.enterAssetId");
    Dialog.prompt({
      message: msg,
      confirmText: this.$tc("accountConfigure.message.prompt.confirmText"),
      cancelText: this.$tc("accountConfigure.message.prompt.cancelText"),
      trapFocus: true,
      type: "is-info",
      onConfirm: (input) => {
        if (type == "ENTERNAME") {
          this.remove(name);
          this.cats.push(input);
          this.addOrUpdateAsset(input, name);
        } else {
          if (this.isAssetId(input)) {
            this.addOrUpdateAsset(name, input);
          } else {
            this.remove(name);
            Notification.open({
              message: this.$tc("accountConfigure.message.notification.wrongAssetId"),
              type: "is-danger",
            });
          }
        }
      },
      onCancel: () => {
        this.remove(name);
      },
    });
    return true;
  }

  remove(name: string): void {
    const eidx = this.cats.findIndex((_) => _ == name);
    if (eidx > -1) this.cats.splice(eidx, 1);
  }

  addOrUpdateAsset(name: string, assetId: string): void {
    const eidx = this.assetIds.findIndex((_) => _.id == assetId);
    if (eidx > -1) this.assetIds.splice(eidx, 1);
    this.assetIds.push({ name: name, id: assetId });
  }

  isAssetId(assetId: string): boolean {
    try {
      return Bytes.from(assetId, "hex").length == 32;
    } catch {
      return false;
    }
  }

  async submit(): Promise<void> {
    if (this.maxAddress) this.account.addressRetrievalCount = this.maxAddress;
    const dict = Object.assign({}, ...this.assetIds.map((x) => ({ [x.name]: x.id })));
    this.account.cats = this.cats.map((_) => ({ name: _, id: dict[_] }));
    await store.dispatch("persistent");

    Notification.open({
      message: this.$tc("accountConfigure.message.notification.saved"),
      type: "is-success",
    });

    this.close();
  }
}
</script>

<style scoped lang="scss">
.taginput-sortable::v-deep .tag {
  cursor: grab !important;
}
</style>
