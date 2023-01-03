<template>
  <div class="modal-card">
    <template v-if="!verified">
      <top-bar :title="$t('backup.ui.title.verifyPassword')" @close="close()" :showClose="true"></top-bar>
      <section class="modal-card-body">
        <b-field> <p class="has-text-info" v-html="$sanitize($tc('backup.ui.tip'))"></p> </b-field>
        <b-field :label="$t('backup.ui.label.password')" :type="isCorrect ? '' : 'is-danger'">
          <b-input
            v-model="password"
            type="password"
            ref="password"
            required
            :validation-message="$t('backup.message.error.passwordRequired')"
            @input="isCorrect = true"
            @keyup.native.enter="submit()"
          ></b-input>
        </b-field>
        <p class="help is-danger" v-if="!isCorrect">{{ $t("backup.message.error.passwordNotCorrect") }}</p>
      </section>
      <footer class="modal-card-foot is-justify-content-space-between">
        <b-button :label="$t('common.button.back')" @click="close()"></b-button>
        <b-button :label="$t('backup.ui.button.continue')" type="is-primary" @click="submit()"></b-button>
      </footer>
    </template>
    <template v-if="verified">
      <top-bar :title="$t('backup.ui.title.backup')" @close="close()" :showClose="true"></top-bar>
      <section class="modal-card-body">
        <div v-if="!bakUrl">
          <b-field :label="$t('backup.ui.label.selectBackupInfo')"></b-field>
          <b-field>
            <b-checkbox v-model="selectBackItem" native-value="masterAccount" disabled type="is-black">
              {{ $t("backup.ui.items.masterAccount") }}
            </b-checkbox>
          </b-field>
          <b-field>
            <b-checkbox v-model="selectBackItem" native-value="loginPassword" disabled type="is-black">
              {{ $t("backup.ui.items.loginPassword") }}
            </b-checkbox>
          </b-field>
          <b-field>
            <b-checkbox v-model="selectBackItem" native-value="settings"> {{ $t("backup.ui.items.settings") }} </b-checkbox>
          </b-field>
          <b-field>
            <b-checkbox v-model="selectBackItem" native-value="customNetwork">
              {{ $t("backup.ui.items.customNetwork") }}
            </b-checkbox>
          </b-field>
          <b-field>
            <b-checkbox v-model="selectBackItem" native-value="accountList"> {{ $t("backup.ui.items.accountList") }} </b-checkbox>
          </b-field>
          <b-field>
            <b-checkbox v-model="selectBackItem" native-value="addressBook"> {{ $t("backup.ui.items.addressBook") }} </b-checkbox>
          </b-field>
          <b-field>
            <b-checkbox v-model="selectBackItem" native-value="didNames"> {{ $t("backup.ui.items.didNames") }} </b-checkbox>
          </b-field>
        </div>
        <div v-if="bakUrl">
          <a :href="bakUrl" :download="Date.now() + '.bak'"
            ><span class="is-underlined">{{ $t("backup.ui.button.downloadBak") }}</span></a
          >
        </div>
      </section>
      <footer class="modal-card-foot is-justify-content-right">
        <b-button v-if="!bakUrl" :label="$t('backup.ui.button.export')" type="is-primary" @click="exportInfo()"></b-button>
        <b-button v-if="bakUrl" :label="$t('backup.ui.button.complete')" type="is-primary" @click="close()"></b-button>
      </footer>
    </template>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { isPasswordCorrect, IVaultState } from "@/store/modules/vault";
import TopBar from "../Common/TopBar.vue";
import { AccountEntity, PersistentAccount } from "@/models/account";
import UniStorage from "@/services/storage";
import { DidName } from "@/store/modules/account";
import { Contact } from "../AddressBook/AddressBook.vue";
import { NetworkDetail } from "@/store/modules/network";
import store from "@/store";
import encryption from "@/services/crypto/encryption";
import { CurrencyType } from "@/services/exchange/currencyType";

export interface Setting {
  debugMode: boolean;
  theme: string;
  language: string;
  autoLockTime: number;
  displayDapp: boolean;
  experiment: boolean;
  currency: CurrencyType;
}

export interface BackupInfo {
  accountList: PersistentAccount[];
  seedMnemonic: string;
  settings: Setting;
  passwordHash: string;
  didNames: DidName[];
  contacts: Contact[];
  customNetwork: NetworkDetail[];
}

@Component({
  components: { TopBar },
})
export default class Backup extends Vue {
  password = "";
  isCorrect = true;
  verified = false;
  selectBackItem: string[] = ["masterAccount", "loginPassword"];
  bakUrl = "";

  close(): void {
    this.$emit("close");
  }

  validate(): void {
    (this.$refs.password as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
  }

  get accounts(): AccountEntity[] {
    return store.state.account.accounts ?? [];
  }

  get seedMnemonic(): string {
    return store.state.vault.seedMnemonic ?? "";
  }

  async exportInfo(): Promise<void> {
    const ustore = UniStorage.create();
    const value = await ustore.getItem("SETTINGS");
    const sts = JSON.parse(value || "{}") as IVaultState;

    let accountList: PersistentAccount[] = [];
    let contacts: Contact[] = [];
    let didNames: DidName[] = [];
    let customNetwork: NetworkDetail[] = [];
    let settings: Setting = {
      debugMode: false,
      theme: "light-theme",
      language: "en",
      autoLockTime: 900,
      displayDapp: false,
      experiment: false,
      currency: CurrencyType.USDT,
    };

    if (this.selectBackItem.findIndex((str) => str == "accountList") > -1) {
      accountList = this.accounts.map((_) => {
        return {
          key: _.key,
          name: _.name,
          profilePic: _.profilePic,
          type: _.type,
          serial: _.serial,
          addressRetrievalCount: _.addressRetrievalCount,
          allCats: _.allCats,
          puzzleHash: _.puzzleHash,
        } as PersistentAccount;
      });
    } else {
      const mainAcc: PersistentAccount = {
        key: this.accounts[0].key,
        name: this.accounts[0].name,
        profilePic: this.accounts[0].profilePic,
        type: this.accounts[0].type,
        serial: this.accounts[0].serial,
        addressRetrievalCount: this.accounts[0].addressRetrievalCount,
        allCats: this.accounts[0].allCats,
        puzzleHash: this.accounts[0].puzzleHash,
      };
      accountList.push(mainAcc);
    }

    if (this.selectBackItem.findIndex((str) => str == "settings") > -1) {
      settings.theme = localStorage.getItem("user-theme") ?? "light-theme";
      settings.autoLockTime = Number(localStorage.getItem("AUTO_LOCK_TIME") ?? "900");
      settings.displayDapp = localStorage.getItem("DISPLAY_DAPP") === "true";
      settings.debugMode = localStorage.getItem("DEBUG_MODE") === "true";
      settings.language = localStorage.getItem("Locale") ?? "en";
      settings.currency = sts.currency;
      settings.experiment = sts.experiment ?? false;
    }

    if (this.selectBackItem.findIndex((str) => str == "addressBook") > -1) {
      contacts = JSON.parse(localStorage.getItem("CONTACTS") || "[]");
    }

    if (this.selectBackItem.findIndex((str) => str == "didNames") > -1) {
      didNames = JSON.parse(localStorage.getItem("DID_NAMES") || "[]");
    }

    if (this.selectBackItem.findIndex((str) => str == "customNetwork") > -1) {
      customNetwork = JSON.parse(localStorage.getItem("CUSTOM_NETWORKS") ?? "[]");
    }

    const backupInfo: BackupInfo = {
      accountList: accountList,
      seedMnemonic: this.seedMnemonic,
      settings: settings,
      passwordHash: sts.passwordHash,
      didNames: didNames,
      contacts: contacts,
      customNetwork: customNetwork,
    };
    const bak = await encryption.encrypt(JSON.stringify(backupInfo), this.password);
    this.bakUrl = encodeURI(`data:text/txt;charset=utf-8,${bak}`);
  }

  async submit(): Promise<void> {
    this.validate();

    if (!(await isPasswordCorrect(this.password))) {
      this.isCorrect = false;
      return;
    }
    this.verified = true;
  }
}
</script>
