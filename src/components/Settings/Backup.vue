<template>
  <div class="modal-card">
    <template>
      <top-bar :title="$t('backup.ui.title.backup')" @close="close()" :showClose="true"></top-bar>
      <template v-if="step == 'selectItem'">
        <section class="modal-card-body">
          <b-field :label="$t('backup.ui.label.selectBackupInfo')"></b-field>
          <b-field>
            <b-checkbox v-model="selectedBackupItem" native-value="masterAccount" disabled type="is-black">
              {{ $t("backup.ui.items.masterAccount") }}
            </b-checkbox>
          </b-field>
          <b-field>
            <b-checkbox v-model="selectedBackupItem" native-value="settings"> {{ $t("backup.ui.items.settings") }} </b-checkbox>
          </b-field>
          <b-field>
            <b-checkbox v-model="selectedBackupItem" native-value="customNetwork">
              {{ $t("backup.ui.items.customNetwork") }}
            </b-checkbox>
          </b-field>
          <b-field>
            <b-checkbox v-model="selectedBackupItem" native-value="accountList">
              {{ $t("backup.ui.items.accountList") }}
            </b-checkbox>
          </b-field>
          <b-field>
            <b-checkbox v-model="selectedBackupItem" native-value="addressBook">
              {{ $t("backup.ui.items.addressBook") }}
            </b-checkbox>
          </b-field>
          <b-field>
            <b-checkbox v-model="selectedBackupItem" native-value="didNames"> {{ $t("backup.ui.items.didNames") }} </b-checkbox>
          </b-field>
        </section>
        <footer class="modal-card-foot is-justify-content-space-between">
          <b-button :label="$t('common.button.cancel')" @click="close()"></b-button>
          <b-button :label="$t('backup.ui.button.next')" type="is-primary" @click="step = 'password'"></b-button>
        </footer>
      </template>
      <template v-if="step == 'password'">
        <section class="modal-card-body">
          <div v-if="!bakUrl">
            <b-field :label="$t('backup.ui.label.setYourLoginPassword')">
              <p class="has-text-info">
                {{ $t("backup.ui.tip.setPassword") }}
              </p>
            </b-field>
            <b-field>
              <b-radio v-model="passwordType" native-value="current" @input="reset()">
                {{ $t("backup.ui.label.passwordType.current") }}
              </b-radio>
            </b-field>
            <div v-if="passwordType == 'current'">
              <b-field
                label="Password"
                :type="isCorrect ? '' : 'is-danger'"
                :message="isCorrect ? '' : $t('changePassword.message.error.passwordNotCorrect')"
              >
                <b-input
                  ref="password"
                  v-model="currentPassword"
                  type="password"
                  required
                  @input.native.enter="reset()"
                ></b-input>
              </b-field>
            </div>
            <b-field class="mt-4">
              <b-radio v-model="passwordType" native-value="new" @input="reset()">
                {{ $t("backup.ui.label.passwordType.new") }}
              </b-radio>
            </b-field>
            <div v-if="passwordType == 'new'">
              <b-field
                label="Password"
                :type="isCorrect ? '' : 'is-danger'"
                :message="isCorrect ? '' : $t('changePassword.message.error.passwordNotCorrect')"
              >
                <b-input
                  ref="password"
                  v-model="currentPassword"
                  type="password"
                  required
                  @input.native.enter="reset()"
                ></b-input>
              </b-field>
              <b-field :label="$t('changePassword.ui.label.newPassword')">
                <b-input ref="newPassword" v-model="newPassword" type="password" required @input.native.enter="reset()"></b-input>
              </b-field>
              <b-field
                :label="$t('changePassword.ui.label.rePassword')"
                :type="isMatch ? '' : 'is-danger'"
                :message="isMatch ? '' : $t('changePassword.message.error.passwordNotMatch')"
              >
                <b-input
                  ref="newPasswordConfirm"
                  v-model="newPasswordConfirm"
                  type="password"
                  required
                  @input.native.enter="reset()"
                ></b-input>
              </b-field>
            </div>
          </div>
          <div v-if="bakUrl" class="has-text-centered">
            <a :href="bakUrl" :download="'PAW1' + Date.now() + '.bak'"
              ><b-button type="is-primary" outlined expanded icon-left="tray-arrow-down">{{
                $t("backup.ui.button.downloadBak")
              }}</b-button></a
            >
          </div>
        </section>
        <footer class="modal-card-foot is-justify-content-space-between">
          <b-button v-if="!bakUrl" :label="$t('common.button.back')" @click="step = 'selectItem'"></b-button>
          <b-button v-if="!bakUrl" :label="$t('backup.ui.button.next')" type="is-primary" @click="exportInfo()"></b-button>
          <b-button v-if="bakUrl" :label="$t('common.button.back')" @click="bakUrl = ''"></b-button>
          <b-button v-if="bakUrl" :label="$t('backup.ui.button.complete')" type="is-primary" @click="close()"></b-button>
        </footer>
      </template>
    </template>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { EncryptKeyHashIteration, isPasswordCorrect, IVaultState, PasswordHashIteration } from "@/store/modules/vault";
import TopBar from "../Common/TopBar.vue";
import { AccountEntity, PersistentAccount } from "@/models/account";
import UniStorage from "@/services/storage";
import { DidName } from "@/store/modules/account";
import { Contact } from "../AddressBook/AddressBook.vue";
import { NetworkDetail } from "@/store/modules/network";
import store from "@/store";
import encryption from "@/services/crypto/encryption";
import { CurrencyType } from "@/services/exchange/currencyType";
import utility from "@/services/crypto/utility";

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
  selectedBackupItem: string[] = ["masterAccount", "settings", "customNetwork", "accountList", "addressBook", "didNames"];
  passwordType: "current" | "new" = "current";
  currentPassword = "";
  newPassword = "";
  newPasswordConfirm = "";
  step: "selectItem" | "password" = "selectItem";
  bakUrl = "";
  isCorrect = true;
  isMatch = true;

  close(): void {
    this.$emit("close");
  }

  reset(): void {
    this.isCorrect = true;
    this.isMatch = true;
  }

  get accounts(): AccountEntity[] {
    return store.state.account.accounts ?? [];
  }

  get seedMnemonic(): string {
    return store.state.vault.seedMnemonic ?? "";
  }

  async exportInfo(): Promise<void> {
    if (this.passwordType == "current") {
      if (!(this.$refs.password as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity()) return;
      if (!(await isPasswordCorrect(this.currentPassword))) {
        this.isCorrect = false;
        return;
      }
    } else {
      if (!(this.$refs.password as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity()) return;
      if (!(await isPasswordCorrect(this.currentPassword))) {
        this.isCorrect = false;
        return;
      }
      if (!(this.$refs.newPassword as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity()) return;
      if (!(this.$refs.newPasswordConfirm as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity()) return;
      if (this.newPassword !== this.newPasswordConfirm) {
        this.isMatch = false;
        return;
      }
    }
    const password = this.passwordType == "current" ? this.currentPassword : this.newPassword;
    const array = new Uint8Array(16);
    self.crypto.getRandomValues(array);
    const salt = utility.toHexString(array);
    const encryptKey = await utility.strongHash(password, salt, EncryptKeyHashIteration);
    const passwordHash = await utility.strongHash(password, salt, PasswordHashIteration);

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

    if (this.selectedBackupItem.findIndex((str) => str == "accountList") > -1) {
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

    if (this.selectedBackupItem.findIndex((str) => str == "settings") > -1) {
      settings.theme = localStorage.getItem("user-theme") ?? "light-theme";
      settings.autoLockTime = Number(localStorage.getItem("AUTO_LOCK_TIME") ?? "900");
      settings.displayDapp = localStorage.getItem("DISPLAY_DAPP") === "true";
      settings.debugMode = localStorage.getItem("DEBUG_MODE") === "true";
      settings.language = localStorage.getItem("Locale") ?? "en";
      settings.currency = sts.currency;
      settings.experiment = sts.experiment ?? false;
    }

    if (this.selectedBackupItem.findIndex((str) => str == "addressBook") > -1) {
      contacts = JSON.parse(localStorage.getItem("CONTACTS") || "[]");
    }

    if (this.selectedBackupItem.findIndex((str) => str == "didNames") > -1) {
      didNames = JSON.parse(localStorage.getItem("DID_NAMES") || "[]");
    }

    if (this.selectedBackupItem.findIndex((str) => str == "customNetwork") > -1) {
      customNetwork = JSON.parse(localStorage.getItem("CUSTOM_NETWORKS") ?? "[]");
    }

    const backupInfo: BackupInfo = {
      accountList: accountList,
      seedMnemonic: this.seedMnemonic,
      settings: settings,
      passwordHash: passwordHash,
      didNames: didNames,
      contacts: contacts,
      customNetwork: customNetwork,
    };
    const bak = await encryption.encrypt(JSON.stringify(backupInfo), encryptKey);
    this.bakUrl = encodeURI(`data:text/txt;charset=utf-8,PAW1${salt}${bak}`);
  }
}
</script>
