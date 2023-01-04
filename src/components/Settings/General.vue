<template>
  <div class="modal-card m-0">
    <top-bar :title="$t('settings.general.title')" @close="$router.back()"></top-bar>
    <section class="modal-card-body">
      <b-field :label="$t('settings.general.label.language')">
        <b-select v-model="lang" expanded>
          <option v-for="[key, value] in languageList" :label="value" :value="key" :key="key">
            {{ value }}
          </option>
        </b-select>
      </b-field>
      <b-field :label="$t('settings.general.label.network')">
        <b-select v-model="network" expanded>
          <option v-for="net in networks" :key="net.name" :value="net.name">{{ net.name }}</option>
        </b-select>
      </b-field>
      <b-field :label="$t('settings.general.label.currency')">
        <b-select v-model="currency" expanded>
          <option v-for="[key, value] in currencyList" :label="key" :value="value" :key="key">
            {{ key }}
          </option>
        </b-select>
      </b-field>
      <b-field>
        <template #label
          >{{ $t("settings.general.label.offlineMode") }}<b-switch class="is-pulled-right" v-model="offlineMode"></b-switch>
        </template>
      </b-field>
      <b-field>
        <template #label
          >{{ $t("settings.general.label.darkMode") }}<b-switch class="is-pulled-right" v-model="darkMode"></b-switch>
        </template>
      </b-field>
    </section>
  </div>
</template>

<script lang="ts">
import { CurrencyType } from "@/services/exchange/currencyType";
import store from "@/store";
import { Component, Vue } from "vue-property-decorator";
import { NotificationProgrammatic as Notification } from "buefy";
import { NetworkInfo } from "@/store/modules/network";
import TopBar from "@/components/Common/TopBar.vue";
import { AccountEntity } from "@/models/account";

@Component({
  components: { TopBar },
})
export default class General extends Vue {
  currencyList: Map<string, CurrencyType> = new Map<string, CurrencyType>([
    ["USD", CurrencyType.USDT],
    ["CNY", CurrencyType.CNY],
  ]);

  languageList: Map<string, string> = new Map<string, string>([
    ["en", "English"],
    ["zhcn", "简体中文"],
  ]);

  get currency(): CurrencyType {
    return store.state.vault.currency ? store.state.vault.currency : CurrencyType.USDT;
  }

  set currency(value: CurrencyType) {
    store.dispatch("setCurrency", value);
    Notification.open({
      message: this.$tc("common.message.saved"),
      type: "is-primary",
    });
  }

  get networks(): NetworkInfo {
    return store.state.network.networks;
  }

  get offlineMode(): boolean {
    return store.state.vault.offline;
  }

  set offlineMode(value: boolean) {
    if (value) {
      Vue.set(store.state.vault, "offline", true);
      localStorage.setItem("OFFLINE_MODE", "on");
    } else {
      Vue.set(store.state.vault, "offline", false);
      localStorage.setItem("OFFLINE_MODE", "off");
    }
  }

  get darkMode(): boolean {
    return localStorage.getItem("user-theme") == "dark-theme";
  }

  set darkMode(value: boolean) {
    if (value) {
      localStorage.setItem("user-theme", "dark-theme");
      document.documentElement.className = "dark-theme";
    } else {
      localStorage.setItem("user-theme", "light-theme");
      document.documentElement.className = "light-theme";
    }
  }

  get network(): string {
    return store.state.network.networkId;
  }

  set network(value: string) {
    store.dispatch("switchNetwork", value);
  }

  get lang(): string {
    return this.$i18n.locale;
  }

  set lang(value: string) {
    this.$i18n.locale = value;
    localStorage.setItem("Locale", value);
  }

  get selectedAccount(): number {
    return store.state.account.selectedAccount;
  }

  get account(): AccountEntity {
    return store.state.account.accounts[this.selectedAccount] ?? {};
  }
}
</script>

<style scoped lang="scss">
.border-bottom {
  border-bottom: 2px solid #ededed;
}
</style>
