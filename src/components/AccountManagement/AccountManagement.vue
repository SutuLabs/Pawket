<template>
  <div class="modal-card margin-auto">
    <top-bar :title="$t('accountManagement.ui.title')" :showClose="true" @close="close()"></top-bar>
    <div class="modal-card-body">
      <div v-sortable="sortableOptions" @updateOrder="updateOrder($event.detail)">
        <a v-for="(account, idx) in accounts" :key="idx" :class="{ 'panel-block': true, 'list-item': idx }" @click="select(idx)">
          <b-icon
            icon="check"
            v-if="idx == selectedAccount"
            style="margin-left: -15px"
            size="is-small"
            type="is-primary"
          ></b-icon>
          <figure class="image is-32x32 prevent-select" style="margin: auto">
            <img v-if="account.profilePic" class="is-rounded cover" :src="account.profilePic" />
            <img v-else class="is-rounded" src="@/assets/account-circle.svg" />
          </figure>
          <div class="column is-flex my-0 py-0 prevent-select">
            <div class="py-1">
              <p class="is-size-6">{{ account.name }}</p>
              <p class="is-size-7 has-text-grey">{{ account.key.fingerprint }}</p>
            </div>
          </div>
          <div class="column has-text-centered prevent-select">
            <b-tag v-if="idx == 0" rounded class="has-background-grey-lighter">{{
              $t("accountManagement.ui.label.default")
            }}</b-tag>
            <b-tag v-if="idx != 0 && account.type == 'Serial'" rounded class="has-background-grey-lighter">{{
              $t("accountManagement.ui.label.serial")
            }}</b-tag>
            <b-tag v-if="account.type == 'Password'" rounded class="has-background-grey-lighter">{{
              $t("accountManagement.ui.label.passPhrase")
            }}</b-tag>
            <b-tag v-if="account.type == 'Address'" rounded class="has-background-grey-lighter">{{
              $t("accountManagement.ui.label.address")
            }}</b-tag>
            <b-tag v-if="account.type == 'Legacy'" rounded class="has-background-grey-lighter">{{
              $t("accountManagement.ui.label.imported")
            }}</b-tag>
            <b-tag v-if="account.type == 'PublicKey'" rounded class="has-background-grey-lighter">{{
              $t("accountManagement.ui.label.publicKey")
            }}</b-tag>
          </div>
          <div class="column py-1">
            <span @click.stop="showDetail(idx)"
              ><b-icon class="is-pulled-right hover-info has-text-grey" icon="text-box-search-outline"> </b-icon
            ></span>
          </div>
        </a>
      </div>

      <a href="javascript:void(0)" class="panel-block" @click="addBySerial()">
        <b-tooltip :label="$t('accountManagement.ui.tooltip.addBySerial')" position="is-right" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="plus-thick"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountManagement.ui.button.addBySerial") }}</span>
        </b-tooltip>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addByPassword()" v-if="experimentMode">
        <b-tooltip :label="$t('accountManagement.ui.tooltip.addByPassword')" position="is-right" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="plus-thick"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountManagement.ui.button.addByPassword") }}</span>
        </b-tooltip>
      </a>
      <a v-if="debugMode" href="javascript:void(0)" class="panel-block" @click="addByAddress()">
        <b-tooltip :label="$t('accountManagement.ui.tooltip.addByAddress')" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="plus-thick"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountManagement.ui.button.addByAddress") }}</span>
        </b-tooltip>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addByPublicKey()">
        <b-tooltip :label="$t('accountManagement.ui.tooltip.addByPublicKey')" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="plus-thick"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountManagement.ui.button.addByPublicKey") }}</span>
        </b-tooltip>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addByLegacy()">
        <b-tooltip :label="$t('accountManagement.ui.tooltip.addByLegacy')" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="import"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountManagement.ui.button.addByLegacy") }}</span>
        </b-tooltip>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addByMnemonic()">
        <b-tooltip :label="$t('accountManagement.ui.tooltip.addByMnemonic')" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="import"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountManagement.ui.button.addByMnemonic") }}</span>
        </b-tooltip>
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import store from "@/store";
import { AccountEntity } from "@/models/account";
import { Component, Vue, Watch } from "vue-property-decorator";
import AccountInfo from "./AccountInfo.vue";
import TopBar from "@/components/Common/TopBar.vue";
import { notifyPrimary } from "@/services/notification/notification";
import { NotificationProgrammatic as Notification } from "buefy";
import AddByAddress from "./AddAccount/AddByAddress.vue";
import AddByMnemonic from "./AddAccount/AddByMnemonic.vue";
import AddBySerial from "./AddAccount/AddBySerial.vue";
import AddByPassword from "./AddAccount/AddByPassword.vue";
import AddByPublicKey from "./AddAccount/AddByPublicKey.vue";
import { isMobile } from "@/services/view/responsive";
import { sortable } from "@/directives/sortable";

@Component({
  directives: {
    sortable,
  },
  components: { TopBar },
})
export default class AccountManagement extends Vue {
  sortableOptions = {
    chosenClass: "box",
    delay: 500,
    draggable: ".list-item",
    disabled: !this.debugMode,
  };

  newOrder: AccountEntity[] = this.accounts;

  get accounts(): AccountEntity[] {
    return store.state.account.accounts;
  }

  get path(): string {
    return this.$route.path;
  }

  @Watch("path")
  onPathChange(): void {
    this.close();
  }

  get experimentMode(): boolean {
    return store.state.vault.experiment;
  }

  get selectedAccount(): number {
    return store.state.account.selectedAccount;
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get accountNum(): string {
    const n = this.accounts.filter((a) => a.type === "Serial").length;
    return (n + 1).toString();
  }

  async close(): Promise<void> {
    const newSelectedIdx = this.newOrder.findIndex((d) => d.name == this.accounts[this.selectedAccount].name);
    Vue.set(store.state.account, "accounts", this.newOrder);
    Vue.set(store.state.account, "selectedAccount", newSelectedIdx);
    Vue.set(store.state.vault, "selectedAccount", newSelectedIdx);
    await store.dispatch("persistent");

    this.$emit("close");
  }

  updateOrder(detail: { oldIndex: number; newIndex: number }): void {
    const oldIndex = detail.oldIndex;
    const newIndex = detail.newIndex;
    const data: AccountEntity[] = this.newOrder.map((_) =>
      Object.create({
        key: {
          compatibleMnemonic: _.key.compatibleMnemonic,
          fingerprint: _.key.fingerprint,
          privateKey: _.key.privateKey,
          publicKey: _.key.publicKey,
        },
        name: _.name,
        profilePic: _.profilePic,
        type: _.type,
        serial: _.serial,
        puzzleHash: _.puzzleHash,
        addressRetrievalCount: _.addressRetrievalCount,
        cats: _.cats,
        allCats: _.allCats,
        firstAddress: _.firstAddress,
        activities: _.activities,
        tokens: _.tokens,
        nfts: _.nfts,
        extraInfo: _.extraInfo,
        dids: _.dids,
        addressPuzzles: _.addressPuzzles,
        observePuzzles: _.observePuzzles,
        addressGenerated: _.addressGenerated,
      })
    );
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
    this.newOrder = data;
  }

  showDetail(idx: number): void {
    this.$buefy.modal.open({
      parent: this,
      component: AccountInfo,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: { idx: idx },
      events: { rename: this.rename },
    });
  }

  select(idx: number): void {
    store.state.account.selectedAccount = idx;
    store.dispatch("refreshBalance");
    store.dispatch("selectAccount", idx);
    this.close();
  }

  getAccountName(idx: number): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, reject) => {
      this.$buefy.dialog.prompt({
        message: this.$tc("accountManagement.message.prompt.setAccountName"),
        confirmText: this.$tc("accountManagement.message.prompt.confirmText"),
        cancelText: this.$tc("accountManagement.message.prompt.cancelText"),
        inputAttrs: {
          maxlength: 36,
          value: this.accounts[idx].name,
        },
        canCancel: ["button"],
        trapFocus: true,
        onConfirm: (name) => {
          resolve(name);
        },
      });
    });
  }

  async rename(idx: number): Promise<void> {
    const name = await this.getAccountName(idx);
    const accounts = store.state.account.accounts;
    for (let i = 0; i < accounts.length; i++) {
      if (accounts[i].name === name && idx != i) {
        Notification.open({
          message: this.$tc("addByAddress.ui.message.duplicateName"),
          type: "is-danger",
        });
        return this.rename(idx);
      }
    }
    const newOrderIdx = this.newOrder.findIndex((d) => d.name == this.accounts[idx].name);
    this.newOrder[newOrderIdx].name = name;
    store.dispatch("renameAccount", { idx, name });
    notifyPrimary(this.$tc("accountManagement.message.notification.saved"));
  }

  async addByPassword(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: AddByPassword,
      hasModalCard: true,
      fullScreen: isMobile(),
      canCancel: [""],
      trapFocus: true,
    });
  }

  addBySerial(): void {
    this.$buefy.modal.open({
      parent: this,
      component: AddBySerial,
      hasModalCard: true,
      fullScreen: isMobile(),
      canCancel: [""],
      trapFocus: true,
      props: { defaultName: this.$t("accountManagement.ui.value.defaultName", { n: this.accountNum }) },
    });
  }

  async addByLegacy(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: AddByMnemonic,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: { title: this.$t("accountManagement.ui.modal.addByLegacy"), mnemonicLen: 24 },
    });
  }

  async addByMnemonic(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: AddByMnemonic,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: { title: this.$t("accountManagement.ui.modal.addByMnemonic"), mnemonicLen: 12 },
    });
  }

  async addByAddress(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: AddByAddress,
      hasModalCard: true,
      fullScreen: isMobile(),
      trapFocus: true,
      canCancel: [""],
    });
  }

  async addByPublicKey(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: AddByPublicKey,
      hasModalCard: true,
      fullScreen: isMobile(),
      trapFocus: true,
      canCancel: [""],
    });
  }
}
</script>

<style scoped lang="scss">
@import "~bulma/sass/utilities/derived-variables";

.border-bottom {
  border-bottom: 2px solid #ededed;
}

.margin-auto {
  margin: auto !important;
}

.hover-danger:hover {
  color: $danger !important;
}

.hover-info:hover {
  color: $info !important;
}

.cover {
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.prevent-select {
  -webkit-user-select: none; /* Safari */
  -ms-user-select: none; /* IE 10 and IE 11 */
  user-select: none; /* Standard syntax */
}
</style>
