<template>
  <div class="has-text-centered mt-6">
    <div v-if="hasAccount">
      <div class="box mx-6 is-flex is-justify-content-center">
        <img v-if="origin" :src="`${origin}/favicon.ico`" class="image is-24x24 mx-3" />{{ origin }}
      </div>
      <div v-if="stage == 'Verify'">
        <div class="is-size-3 has-text-weighted-bold mb-6">{{ $t("connect.ui.label.connectWithPawket") }}</div>
        <div>{{ $t("connect.ui.label.enterPassword") }}</div>
        <div class="field mx-5 my-3">
          <input
            class="input is-medium"
            type="password"
            v-model="password"
            @keyup.enter="confirm()"
            @input.enter="clearErrorMsg()"
          />
        </div>
        <p class="help is-danger is-size-6" v-if="!isCorrect">{{ $t("connect.messages.incorrectPassword") }}</p>
        <div class="has-text-info">{{ $t("connect.ui.label.trust") }}</div>
        <footer class="is-fixed-bottom py-4 px-4 has-background-white-ter">
          <button class="button is-pulled-left" @click="close">{{ $t("common.button.cancel") }}</button>
          <b-button class="button is-pulled-right is-primary" @click="confirm" :loading="loading" :disabled="!cmd">{{
            $t("connect.ui.button.next")
          }}</b-button>
        </footer>
      </div>
      <div v-if="stage == 'Account'">
        <div class="is-size-3 has-text-weighted-bold mb-6">{{ $t("connect.ui.label.connectWithPawket") }}</div>
        <div>{{ $t("connect.ui.label.selectAccount") }}</div>
        <div class="pb-10">
          <div class="box m-3">
            <a
              v-for="(account, idx) in accounts"
              :key="idx"
              :class="{ 'panel-block': true, 'list-item': idx }"
              @click="selectedAcc = idx"
            >
              <input type="radio" class="mr-2 has-text-primary" :checked="selectedAcc == idx" />
              <figure class="image is-32x32" style="margin: auto">
                <img v-if="account.profilePic" class="is-rounded cover" :src="account.profilePic" />
                <img v-else class="is-rounded" src="@/assets/account-circle.svg" />
              </figure>
              <div class="column is-flex my-0 py-0">
                <div class="py-1">
                  <p class="is-size-6">{{ account.name }}({{ account.key.fingerprint }})</p>
                  <p class="is-size-7 has-text-grey has-text-left" v-if="account.tokens && account.tokens.hasOwnProperty(symbol)">
                    {{ demojo(account.tokens[symbol].amount) }}
                  </p>
                  <p class="is-size-7 has-text-grey has-text-left" v-else>{{ $t("connect.ui.label.loadingBalance") }}</p>
                </div>
              </div>
            </a>
          </div>
        </div>
        <footer class="is-fixed-bottom py-4 px-4 has-background-white-ter">
          <button v-if="accounts.length > 1" class="button is-pulled-left" @click="stage = 'Account'">
            {{ $t("common.button.back") }}
          </button>
          <button v-if="accounts.length == 1" class="button is-pulled-left" @click="close()">
            {{ $t("common.button.cancel") }}
          </button>
          <b-button
            v-if="!authorized"
            class="button is-pulled-right is-primary"
            @click="stage = 'Authorize'"
            :loading="loading"
            >{{ $t("connect.ui.button.next") }}</b-button
          >
          <b-button v-if="authorized" class="button is-pulled-right is-primary" @click="openCmd()" :loading="loading">{{
            $t("connect.ui.button.connect")
          }}</b-button>
        </footer>
      </div>
      <div v-if="stage == 'Authorize'">
        <div class="is-size-3 has-text-weighted-bold">{{ `Connect to [${accounts[selectedAcc].name}]` }}</div>
        <div class="has-text-center">{{ $t("connect.ui.label.allowSiteTo") }}</div>
        <div class="box m-3 p-3 has-text-left">
          <p class="is-flex mt-2">
            <b-icon icon="checkbox-marked-circle-outline"></b-icon>
            <span class="pl-2">{{ $t("connect.ui.label.viewInfo") }}</span>
          </p>
          <p class="is-flex my-2">
            <b-icon icon="checkbox-marked-circle-outline"></b-icon>
            <span class="pl-2">{{ $t("connect.ui.label.requestTranx") }}</span>
          </p>
        </div>
        <footer class="is-fixed-bottom py-4 px-4 has-background-white-ter">
          <button class="button is-pulled-left" @click="close()">{{ $t("common.button.cancel") }}</button>
          <b-button class="button is-pulled-right is-primary" @click="authorize()" :loading="loading">{{
            $t("connect.ui.button.connect")
          }}</b-button>
        </footer>
      </div>
      <div v-if="stage == 'Cmd'">
        <section class="hero is-medium" v-if="loading">
          <div class="hero-body has-text-centered">
            <h1 class="title">{{ $t("connect.ui.label.gettingData") }}</h1>
          </div>
        </section>
        <b-loading v-model="loading"></b-loading>
      </div>
    </div>
    <div v-else>
      <div class="is-size-3 has-text-weighted-bold">{{ $t("connect.ui.label.noWallet") }}</div>
      <div class="my-6">{{ $t("connect.ui.label.noWalletInfo") }}</div>
      <button class="button is-primary" @click="setUp()">{{ $t("connect.ui.button.setUp") }}</button>
    </div>
  </div>
</template>

<script lang="ts">
import { demojo } from "@/filters/unitConversion";
import { AccountEntity, CustomCat, OneTokenInfo } from "@/models/account";
import encryption from "@/services/crypto/encryption";
import puzzle from "@/services/crypto/puzzle";
import receive, { DidDetail } from "@/services/crypto/receive";
import utility from "@/services/crypto/utility";
import store from "@/store";
import { getAllCats } from "@/store/modules/account";
import { NotificationProgrammatic as Notification } from "buefy";
import { NetworkInfo, rpcUrl, xchPrefix, xchSymbol } from "@/store/modules/network";
import { getEncryptKey, isPasswordCorrect } from "@/store/modules/vault";
import { Component, Vue } from "vue-property-decorator";
import TakeOffer from "../Offer/Take.vue";
import Send from "../Send/Send.vue";
import SignMessage from "../Cryptography/SignMessage.vue";
import { connectionItem } from "../AccountManagement/AccountInfo.vue";
import { tc } from "@/i18n/i18n";
import ManageCats from "../Cat/ManageCats.vue";
type Stage = "Verify" | "Account" | "Authorize" | "Cmd";
type SignWithDidData = { did: string; message: string };
type AddCatData = { id: string; name?: string };
type MessageEventSource = Window | MessagePort | ServiceWorker;
@Component
export default class Connect extends Vue {
  public password = "";
  public isCorrect = true;
  public stage: Stage = "Verify";
  public selectedAcc = 0;
  public accounts: AccountEntity[] = [];
  public cmd = "";
  public data = "";
  public initialNetworkId = "";
  public event: MessageEvent | null = null;
  public loading = false;
  public origin = "";
  public succeed = false;

  async confirm(): Promise<void> {
    this.loading = true;
    if (!(await isPasswordCorrect(this.password))) {
      this.isCorrect = false;
      this.loading = false;
      return;
    }
    this.isCorrect = true;
    this.accounts = await this.getAccounts();
    this.accounts = this.accounts.filter((acc) => acc.key.privateKey);
    for (let i = 0; i < this.accounts.length; i++) {
      await this.setFirstAddress(this.accounts[i]);
      await this.getXchBalance(this.accounts[i]);
    }
    this.loading = false;
    if (this.accounts.length > 1) {
      this.stage = "Account";
    } else {
      if (this.authorized) this.openCmd();
      else this.stage = "Authorize";
    }
  }

  get account(): AccountEntity {
    return this.accounts[this.selectedAcc];
  }

  get allConnections(): connectionItem[] {
    const connStr = localStorage.getItem("CONNECTIONS");
    if (!connStr) return [];
    const conn = JSON.parse(connStr) as connectionItem[];
    return conn;
  }

  get connections(): connectionItem[] {
    return this.allConnections.filter((con) => con.accountFirstAddress == this.account.firstAddress);
  }

  get authorized(): boolean {
    const idx = this.connections.findIndex((conn) => conn.url == this.origin);
    if (idx > -1) return true;
    return false;
  }

  get source(): MessageEventSource | null {
    return this.event?.source ?? null;
  }

  get dids(): DidDetail[] {
    return this.account.dids ?? [];
  }

  get hasAccount(): boolean {
    return localStorage.getItem("SETTINGS") != null;
  }

  get networks(): NetworkInfo {
    return store.state.network.networks;
  }

  get tokenList(): CustomCat[] {
    return getAllCats(this.account);
  }

  get rpcUrl(): string {
    return rpcUrl();
  }

  get prefix(): string {
    return xchPrefix();
  }

  get symbol(): string {
    return xchSymbol();
  }

  clearErrorMsg(): void {
    this.isCorrect = true;
  }

  authorize(): void {
    const firstAddress = this.accounts[this.selectedAcc].firstAddress;
    if (firstAddress) {
      this.allConnections.push({ accountFirstAddress: firstAddress, url: this.origin });
      const conn = JSON.stringify(this.allConnections);
      localStorage.setItem("CONNECTIONS", conn);
      this.openCmd();
    }
  }

  demojo(mojo: null | number | bigint, token: OneTokenInfo | null = null, digits = -1, symbol: string | null = null): string {
    return demojo(mojo, token, digits, symbol);
  }

  async setFirstAddress(account: AccountEntity): Promise<void> {
    const privkey = utility.fromHexString(account.key.privateKey);
    const derive = await utility.derive(privkey, false);
    const firstWalletAddressPubkey = utility.toHexString(derive([12381, 8444, 2, 0]).get_g1().serialize());
    Vue.set(account, "firstAddress", await puzzle.getAddress(firstWalletAddressPubkey, this.prefix));
  }

  setUp(): void {
    window.open(window.location.origin);
    this.close();
  }

  async getXchBalance(account: AccountEntity): Promise<void> {
    const privatekey = utility.fromHexString(account.key.privateKey);
    const ps = await puzzle.getPuzzleDetails(privatekey, this.symbol);
    const requests = [{ symbol: this.symbol, puzzles: ps }];
    const records = await receive.getCoinRecords(requests, false, this.rpcUrl);
    const tokenBalance = receive.getTokenBalance(requests, records);
    Vue.set(account, "tokens", tokenBalance);
  }

  async getAccounts(): Promise<AccountEntity[]> {
    const salt = store.state.vault.salt;
    const encryptKey = salt ? await getEncryptKey(this.password) : this.password;
    store.state.vault.encryptKey = encryptKey;
    store.state.vault.seedMnemonic = await encryption.decrypt(store.state.vault.encryptedSeed, encryptKey);
    store.state.vault.unlocked = true;
    const accounts = JSON.parse((await encryption.decrypt(store.state.vault.encryptedAccounts, encryptKey)) || "[]");
    store.state.account.accounts = accounts;
    return accounts;
  }

  setNetwork(networkId: string): boolean {
    if (!networkId) return false;
    for (let key in this.networks) {
      if (this.networks[key].chainId == networkId) {
        const network = this.networks[key];
        store.dispatch("switchNetwork", network.name);
        return true;
      }
    }
    return false;
  }

  mounted(): void {
    window.addEventListener("message", (event: MessageEvent) => {
      if (event.origin == window.location.origin) return;
      Object.freeze(event);
      this.event = event;
      this.origin = this.event.origin;
      const data = JSON.parse(this.event.data);
      if (this.checkCmd(data.cmd)) this.cmd = data.cmd;
      else return;
      this.initialNetworkId = store.state.network.networkId;
      if (!this.setNetwork(data.network)) {
        Notification.open({
          message: tc("connect.messages.unknownNetwork"),
          type: "is-danger",
          position: "is-top",
          duration: 5000,
        });
        this.failed(tc("connect.messages.unknownNetwork"));
      }
      this.data = data.data;
    });
    window.onbeforeunload = () => {
      if (!this.succeed) this.cancelled();
    };
  }

  openCmd(): void {
    switch (this.cmd) {
      case "take-offer":
        this.openTakeOffer();
        break;
      case "send":
        this.send();
        break;
      case "sign-with-did":
        this.signWithDid();
        break;
      case "get-address":
        this.stage = "Cmd";
        this.getAddress();
        break;
      case "get-did":
        this.stage = "Cmd";
        this.getDid();
        break;
      case "add-cat":
        this.stage = "Cmd";
        this.addCat();
        break;
      default:
        Notification.open({
          message: tc("connect.messages.invalidCall") + this.cmd,
          type: "is-danger",
          position: "is-top-right",
          duration: 5000,
        });
        this.failed(tc("connect.messages.invalidCall") + this.cmd);
    }
  }

  checkCmd(cmd: string): boolean {
    const cmdList = ["take-offer", "send", "sign-with-did", "get-address", "get-did", "add-cat"];
    if (!cmd) {
      Notification.open({
        message: tc("connect.messages.noAppName"),
        type: "is-danger",
        position: "is-top-right",
        duration: 5000,
      });
      this.failed(tc("connect.messages.noAppName"));
      return false;
    }
    if (cmdList.findIndex((item) => item == cmd) > -1) return true;
    Notification.open({
      message: tc("connect.messages.invalidCall") + this.cmd,
      type: "is-danger",
      position: "is-top-right",
      duration: 5000,
    });
    this.failed(tc("connect.messages.invalidCall") + this.cmd);
    return false;
  }

  openTakeOffer(): void {
    this.$buefy.modal.open({
      parent: this,
      component: TakeOffer,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: true,
      props: {
        account: this.account,
        tokenList: this.tokenList,
        inputOfferText: this.data,
      },
      events: {
        success: () => this.success(this.$t("connect.messages.offerAccepted")),
      },
    });
  }

  send(): void {
    this.$buefy.modal.open({
      parent: this,
      component: Send,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: true,
      canCancel: [""],
      props: { account: this.account, inputAddress: this.data, addressEditable: false },
      events: {
        success: () => this.success(this.$t("connect.messages.sendCompleted")),
      },
    });
  }

  addCat(): void {
    let data: AddCatData | null = null;
    try {
      data = JSON.parse(this.data) as AddCatData;
    } catch (error) {
      Notification.open({
        message: tc("connect.messages.invalidData"),
        type: "is-danger",
        position: "is-top",
        duration: 5000,
      });
      this.failed(tc("connect.messages.invalidData"));
    }
    this.$buefy.modal.open({
      parent: this,
      component: ManageCats,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: true,
      canCancel: [""],
      props: { account: this.account, defaultAssetId: data?.id, defaultName: data?.name, defaultTab: 1 },
      events: { success: () => this.success(this.$t("connect.messages.catAdded")) },
    });
  }

  async signWithDid(): Promise<void> {
    this.loading = true;
    await store.dispatch("refreshDids", { idx: this.selectedAcc });
    this.loading = false;
    let data: SignWithDidData | null = null;
    try {
      data = JSON.parse(this.data) as SignWithDidData;
    } catch (error) {
      Notification.open({
        message: tc("connect.messages.invalidData"),
        type: "is-danger",
        position: "is-top",
        duration: 5000,
      });
      this.failed(tc("connect.messages.invalidData"));
    }
    const idx = this.dids.findIndex((did) => did.did == data?.did);
    if (idx == -1) {
      Notification.open({
        message: tc("connect.messages.unknownDid"),
        type: "is-danger",
        position: "is-top",
        duration: 5000,
      });
      this.failed(tc("connect.messages.unknownDid"));
      return;
    }
    this.$buefy.modal.open({
      parent: this,
      component: SignMessage,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: true,
      props: {
        account: this.account,
        did: this.dids[idx].analysis,
        initMessage: data?.message,
      },
      events: { signResult: this.sendSignResult },
    });
  }

  sendSignResult(res: string): void {
    this.success(res);
  }

  async getDid(): Promise<void> {
    this.loading = true;
    await store.dispatch("refreshDids", { idx: this.selectedAcc });
    this.loading = false;
    this.success(this.dids.map((did) => did.did));
  }

  getAddress(): void {
    this.success(this.account.firstAddress ?? "");
  }

  failed(msg: string): void {
    this.source?.postMessage({ status: "failed", cmd: this.cmd, msg: msg }, { targetOrigin: this.origin });
    setTimeout(() => this.close(), 5000);
  }

  cancelled(msg = tc("connect.messages.cancelled")): void {
    this.source?.postMessage({ status: "cancelld", cmd: this.cmd, msg: msg }, { targetOrigin: this.origin });
  }

  success(msg: unknown): void {
    this.succeed = true;
    Notification.open({
      message: tc("connect.messages.success"),
      type: "is-primary",
      position: "is-top-right",
      duration: 5000,
    });
    this.source?.postMessage({ status: "success", cmd: this.cmd, msg: msg }, { targetOrigin: this.origin });
    setTimeout(() => this.close(), 5000);
  }

  close(): void {
    store.dispatch("switchNetwork", this.initialNetworkId);
    if (!this.succeed) this.cancelled();
    window.close();
  }
}
</script>

<style scoped lang="scss">
.is-fixed-bottom {
  position: fixed;
  bottom: 0;
  width: 100vw;
}

.pb-10 {
  padding-bottom: 10rem;
}
</style>
