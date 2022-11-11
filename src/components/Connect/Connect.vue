<template>
  <div class="has-text-centered mt-6">
    <div class="box mx-6 is-flex is-justify-content-center">
      <img :src="`${origin}/favicon.ico`" class="image is-24x24 mx-3" />{{ origin }}
    </div>
    <div class="is-size-3 has-text-weighted-bold mb-6">Connect With Pawket</div>
    <div v-if="stage == 'Verify'">
      <div>Enter your password to connect to the site</div>
      <div class="field mx-5 my-3">
        <input
          class="input is-medium"
          type="password"
          v-model="password"
          @keyup.enter="confirm()"
          @input.enter="clearErrorMsg()"
        />
      </div>
      <p class="help is-danger is-size-6" v-if="!isCorrect">{{ $t("verifyPassword.message.error.incorrectPassword") }}</p>
      <div class="has-text-info">Make sure you trust the site you connect</div>
      <footer class="is-fixed-bottom py-6 px-4 has-background-white-ter">
        <button class="button is-pulled-left" @click="close">Cancel</button>
        <button class="button is-pulled-right is-primary" @click="confirm">Next</button>
      </footer>
    </div>
    <div v-if="stage == 'Account'">
      <div>Select an account to use on this site</div>
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
                <p class="is-size-7 has-text-grey has-text-left" v-if="account.tokens && account.tokens.hasOwnProperty('XCH')">
                  {{ demojo(account.tokens["XCH"].amount) }}
                </p>
                <p class="is-size-7 has-text-grey has-text-left" v-else>Loading Balance..</p>
              </div>
            </div>
          </a>
        </div>
      </div>
      <footer class="is-fixed-bottom py-6 px-4 has-background-white-ter">
        <button class="button is-pulled-left" @click="close()">Cancel</button>
        <button class="button is-pulled-right is-primary" @click="openApp()">Connect</button>
      </footer>
    </div>
  </div>
</template>

<script lang="ts">
import { demojo } from "@/filters/unitConversion";
import { AccountEntity, CustomCat, OneTokenInfo } from "@/models/account";
import encryption from "@/services/crypto/encryption";
import puzzle from "@/services/crypto/puzzle";
import receive from "@/services/crypto/receive";
import utility from "@/services/crypto/utility";
import store from "@/store";
import { getAllCats } from "@/store/modules/account";
import { rpcUrl } from "@/store/modules/network";
import { getEncryptKey, isPasswordCorrect } from "@/store/modules/vault";
import { Component, Vue } from "vue-property-decorator";
import TakeOffer from "../Offer/Take.vue";
type Stage = "Verify" | "Account" | "App";
@Component
export default class Connect extends Vue {
  public password = "";
  public isCorrect = true;
  public stage: Stage = "Verify";
  public selectedAcc = 0;
  public accounts: AccountEntity[] = [];
  public origin = "";
  public app = "";
  public data = "";

  async confirm(): Promise<void> {
    if (!(await isPasswordCorrect(this.password))) {
      this.isCorrect = false;
      return;
    }
    this.isCorrect = true;
    this.accounts = await this.getAccounts();
    if (this.accounts.length > 1) {
      this.stage = "Account";
      for (let i = 0; i < this.accounts.length; i++) {
        await this.setFirstAddress(this.accounts[i]);
        await this.getXchBalance(this.accounts[i]);
      }
    } else {
      this.openApp();
    }
  }

  get account(): AccountEntity {
    return this.accounts[this.selectedAcc];
  }

  get tokenList(): CustomCat[] {
    return getAllCats(this.account);
  }

  clearErrorMsg(): void {
    this.isCorrect = true;
  }

  demojo(mojo: null | number | bigint, token: OneTokenInfo | null = null, digits = -1): string {
    return demojo(mojo, token, digits);
  }

  async setFirstAddress(account: AccountEntity): Promise<void> {
    const privkey = utility.fromHexString(account.key.privateKey);
    const derive = await utility.derive(privkey, false);
    const firstWalletAddressPubkey = utility.toHexString(derive([12381, 8444, 2, 0]).get_g1().serialize());
    Vue.set(account, "firstAddress", await puzzle.getAddress(firstWalletAddressPubkey, "xch"));
  }

  async getXchBalance(account: AccountEntity): Promise<void> {
    const privatekey = utility.fromHexString(account.key.privateKey);
    const ps = await puzzle.getPuzzleDetails(privatekey, "XCH");
    const requests = [{ symbol: "XCH", puzzles: ps }];
    const records = await receive.getCoinRecords(requests, false, rpcUrl());
    const tokenBalance = receive.getTokenBalance(requests, records);
    Vue.set(account, "tokens", tokenBalance);
  }

  async getAccounts(): Promise<AccountEntity[]> {
    const salt = store.state.vault.salt;
    const encryptKey = salt ? await getEncryptKey(this.password) : this.password;
    return JSON.parse((await encryption.decrypt(store.state.vault.encryptedAccounts, encryptKey)) || "[]");
  }

  mounted(): void {
    window.addEventListener("message", (event: MessageEvent) => {
      if (event.origin == window.location.origin) return;
      this.origin = event.origin;
      const data = JSON.parse(event.data);
      this.app = data.app;
      this.data = data.data;
    });
  }

  openApp(): void {
    switch (this.app) {
      case "take-offer":
        this.openTakeOffer();
        break;
    }
  }

  openTakeOffer(): void {
    this.$buefy.modal.open({
      parent: this,
      component: TakeOffer,
      onCancel: this.close,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: true,
      props: {
        account: this.account,
        tokenList: this.tokenList,
        inputOfferText: this.data,
      },
    });
  }

  close(): void {
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
