<template>
  <div class="modal-card">
    <section v-if="configureOption === 'Default'">
      <header class="modal-card-head">
        <p class="modal-card-title">
          {{ $t("accountConfigure.ui.title.configure") }}
        </p>
        <button type="button" class="delete" @click="close()"></button>
      </header>
      <section class="modal-card-body">
        <b-field :label="$t('accountConfigure.ui.label.maxAddress')">
          <b-slider v-model="maxAddress" :max="12" :min="1"></b-slider>
        </b-field>
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
          <!-- <p class="control">
          <b-button @click="addCat()">Add</b-button>
        </p> -->
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
        <div>
          <b-button
            :label="$t('accountConfigure.ui.button.changePassword')"
            type="is-warning"
            @click="changePassword()"
          ></b-button>
        </div>
      </footer>
    </section>
    <section v-if="configureOption === 'Password'">
      <change-password @close="close()" @back="back()"></change-password>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import store from "@/store/index";
import KeyBox from "@/components/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { DialogProgrammatic as Dialog } from "buefy";
import { sortable } from "@/directives/sortable";
import { AccountEntity, CustomCat } from "@/store/modules/account";
import ChangePassword from "./ChangePassword.vue";
import { Bytes } from "clvm";

@Component({
  directives: {
    sortable,
  },
  components: {
    KeyBox,
    ChangePassword,
  },
})
export default class AccountConfigure extends Vue {
  @Prop() private account!: AccountEntity;
  public maxAddress: number | null = null;
  sortableOptions = {
    chosenClass: "is-primary",
    draggable: ".tag",
  };
  cats: string[] = [];
  assetIds: CustomCat[] = [];
  configureOption: "Default" | "Password" = "Default";

  mounted(): void {
    if (!this.account) {
      console.error("account is empty, cannot get settings");
      return;
    }
    this.maxAddress = this.account.addressRetrievalCount;
    this.assetIds = [...(this.account.cats ?? [])];
    this.cats = this.assetIds.map((_) => _.name);
  }

  @Emit("close")
  close(): void {
    return;
  }

  back(): void {
    this.configureOption = "Default";
  }

  changePassword(): void {
    this.configureOption = "Password";
  }

  beforeAdd(name: string): boolean {
    const type = this.isAssetId(name) ? "ENTERNAME" : "ENTERASSETID";
    const msg = type == "ENTERNAME"
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
        }
        else {
          if (this.isAssetId(input)) {
            this.addOrUpdateAsset(name, input);
          }
          else {
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
      }
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
    } catch{
      return false;
    }
  }

  addCat(): void {
    Dialog.prompt({
      message: `Enter the Asset Name`,
      trapFocus: true,
      type: "is-info",
      onConfirm: (name: string) => {
        Dialog.prompt({
          message: this.$tc("accountConfigure.message.prompt.addAsset"),
          confirmText: this.$tc("accountConfigure.message.prompt.confirmText"),
          cancelText: this.$tc("accountConfigure.message.prompt.cancelText"),
          trapFocus: true,
          type: "is-info",
          onConfirm: (assetId) => {
            this.cats.push(name);
            this.addOrUpdateAsset(name, assetId);
          },
        });
      },
    });
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
