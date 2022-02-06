<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Configure</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-field label="Max privacy addresses to search">
        <b-slider v-model="maxAddress" :max="8" :min="1"></b-slider>
      </b-field>
      <b-field label="Listing CATs">
        <b-taginput
          class="taginput-sortable"
          v-sortable="sortableOptions"
          v-model="cats"
          ellipsis
          icon="label"
          :before-adding="beforeAdd"
          placeholder="Add a CAT"
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
        <b-button label="Cancel" @click="close()"></b-button>
        <b-button label="Save" type="is-primary" @click="submit()"></b-button>
      </div>
      <div>
        <b-button label="Change Password" type="is-warning" @click="changePassword()"></b-button>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import store, { Account, CustomCat } from "@/store/index";
import KeyBox from "@/components/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { DialogProgrammatic as Dialog } from "buefy";
import { sortable } from "@/services/sortable";

@Component({
  directives: {
    sortable
  },
  components: {
    KeyBox,
  },
})
export default class AccountConfigure extends Vue {
  @Prop() private account!: Account;
  public maxAddress: number | null = null;
  sortableOptions = {
    chosenClass: 'is-primary',
    draggable: '.tag'
  };
  cats: string[] = [];
  assetIds: CustomCat[] = []

  mounted(): void {
    if (!this.account) {
      console.error("account is empty, cannot get settings");
      return;
    }
    this.maxAddress = this.account.addressRetrievalCount;
    this.assetIds = this.account.cats ?? [];
    this.cats = this.assetIds.map(_ => _.name);
  }

  @Emit("close")
  close(): void {
    return;
  }
  beforeAdd(name: string): boolean {
    Dialog.prompt({
      message: `Enter the Asset ID`,
      trapFocus: true,
      type: "is-info",
      onConfirm: (assetId) => {
        this.addOrUpdateAsset(name, assetId);
      },
    });
    return true;
  }

  addOrUpdateAsset(name: string, assetId: string): void {
    const eidx = this.assetIds.findIndex(_ => _.id == assetId);
    if (eidx > -1) this.assetIds.splice(eidx, 1);
    this.assetIds.push({ name: name, id: assetId });
  }

  addCat(): void {
    Dialog.prompt({
      message: `Enter the Asset Name`,
      trapFocus: true,
      type: "is-info",
      onConfirm: (name: string) => {
        Dialog.prompt({
          message: `Enter the Asset ID`,
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

  submit(): void {
    if (this.maxAddress) this.account.addressRetrievalCount = this.maxAddress;
    const dict = Object.assign({}, ...this.assetIds.map((x) => ({ [x.name]: x.id })));
    this.account.cats = this.cats.map(_ => ({ name: _, id: dict[_] }))
    store.dispatch("persistent");

    Notification.open({
      message: `Saved.`,
      type: "is-success",
    });

    this.close();
  }

  async changePassword(): Promise<void> {
    const oldPassword = await this.getPassword(`Enter the old password`);
    const newPassword = await this.getPassword(`Enter the new password`);
    const newPassword2 = await this.getPassword(`Reenter the new password`);
    if (newPassword != newPassword2) {
      this.$buefy.notification.open(
        {
          message: "password not match",
        }
      )
      return;
    }
    store.dispatch("changePassword", { oldPassword, newPassword });
  }

  getPassword(text: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, reject) => {
      this.$buefy.dialog.prompt({
        message: text,
        trapFocus: true,
        inputAttrs: {
          type: "password",
        },
        onConfirm: (name) => {
          resolve(name);
        },
      });
    });
  }
}
</script>

<style scoped lang="scss">
.taginput-sortable::v-deep .tag {
  cursor: grab !important;
}
</style>
