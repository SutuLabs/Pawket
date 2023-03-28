<template>
  <div>
    <div v-if="step == 'upload'">
      <top-bar :title="$t('importBackup.title')" :showBack="true" @close="back()"></top-bar>
      <section class="modal-card-body">
        <b-field>
          <b-tag v-if="file" icon="paperclip" size="is-small" closable aria-close-label="Close tag" @close="reset()">
            {{ file.name }}
          </b-tag>
        </b-field>
        <b-upload v-model="file" drag-drop expanded @input="afterUpload()">
          <section class="section">
            <div class="content has-text-centered">
              <p>
                <b-icon icon="upload" size="is-large"> </b-icon>
              </p>
              <p>{{ $t("batchSend.ui.field.csv.drag") }}</p>
            </div>
          </section>
        </b-upload>
      </section>
    </div>
    <div v-if="step == 'decode'">
      <top-bar
        :title="$t('backup.ui.title.verifyPassword')"
        :showBack="true"
        @close="
          step = 'upload';
          reset();
        "
      ></top-bar>
      <section class="modal-card-body">
        <b-field>{{ $t("importBackup.password.tip") }}</b-field>
        <b-field :label="$t('importBackup.password.label')">
          <b-input
            v-model="password"
            type="password"
            ref="password"
            required
            :validation-message="$t('backup.message.error.passwordRequired')"
            @keyup.native.enter="confirm()"
          ></b-input>
        </b-field>
      </section>
      <div class="has-text-centered">
        <b-button icon-right="chevron-right" type="is-primary" @click="confirm()" class="px-6">{{
          $t("createSeed.ui.button.ready")
        }}</b-button>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import TopBar from "@/components/Common/TopBar.vue";
import encryption from "@/services/crypto/encryption";
import { NotificationProgrammatic as Notification } from "buefy";
import { BackupInfo } from "../Settings/Backup.vue";
import store from "@/store";
import { tc } from "@/i18n/i18n";
import utility from "@/services/crypto/utility";
import { EncryptKeyHashIteration } from "@/store/modules/vault";

@Component({
  components: {
    TopBar,
  },
})
export default class ImportBackup extends Vue {
  file: File | null = null;
  backupText = "";
  step: "upload" | "decode" = "upload";
  password = "";

  back(): void {
    this.$router.push("/create/create-wallet");
  }

  reset(): void {
    this.file = null;
    this.backupText = "";
  }

  async afterUpload(): Promise<void> {
    if(this.file?.size && this.file?.size > 1000000) {
      Notification.open({
        message: this.$tc("importBackup.error.LARGE_FILE"),
        type: "is-danger",
        autoClose: false,
      });
      this.file = null;
      this.backupText = "";
      return;
    }
    this.backupText = (await this.file?.text()) ?? "";
    if (!this.backupText.startsWith("PAW1")) {
      Notification.open({
        message: this.$tc("importBackup.error.UNSUPPORTED_FILE"),
        type: "is-danger",
        autoClose: false,
      });
      this.file = null;
      this.backupText = "";
      return;
    }
    this.step = "decode";
  }

  async confirm(): Promise<void> {
    if (!(this.$refs.password as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity() || !this.file) return;
    const salt = this.backupText.slice(4, 36);
    const data = this.backupText.slice(36);
    let backupJson = "";
    const encryptKey = await utility.strongHash(this.password, salt, EncryptKeyHashIteration);
    try {
      backupJson = await encryption.decrypt(data, encryptKey);
    } catch (error) {
      Notification.open({
        message: tc("backup.message.error.passwordNotCorrect"),
        type: "is-danger",
        duration: 5000,
      });
    }
    if (backupJson) {
      const backup = JSON.parse(backupJson) as BackupInfo;

      localStorage.setItem("user-theme", backup.settings.theme);
      localStorage.setItem("AUTO_LOCK_TIME", backup.settings.autoLockTime.toString());
      localStorage.setItem("DISPLAY_DAPP", backup.settings.displayDapp.toString());
      localStorage.setItem("DEBUG_MODE", backup.settings.debugMode.toString());
      localStorage.setItem("Locale", backup.settings.language);
      this.$i18n.locale = backup.settings.language;
      localStorage.setItem("CONTACTS", JSON.stringify(backup.contacts));
      localStorage.setItem("DID_NAMES", JSON.stringify(backup.didNames));
      backup.customNetwork.forEach((cn) => store.dispatch("addOrUpdateNetwork", cn));

      await store.dispatch("initWalletAddress");
      Vue.set(store.state.vault, "experiment", backup.settings.experiment);
      Vue.set(store.state.vault, "currency", backup.settings.currency);
      Vue.set(store.state.account, "accounts", backup.accountList);
      Vue.set(store.state.vault, "seedMnemonic", backup.seedMnemonic);
      Vue.set(store.state.vault, "salt", salt);
      Vue.set(store.state.vault, "encryptKey", encryptKey);
      Vue.set(store.state.vault, "passwordHash", backup.passwordHash);
      Vue.set(store.state.vault, "unlocked", true);

      await store.dispatch("persistent");

      this.$router.push("/home");
    }
  }
}
</script>

<style scoped lang="scss"></style>
