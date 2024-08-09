<template>
  <div>
    <top-bar :title="$t('createPassword.title')" @close="back()" :showBack="true"></top-bar>
    <section class="modal-card-body">
      <p class="py-5">
        {{ $t("createPassword.tip") }}
      </p>
      <div>
        <b-field :label="$t('createPassword.label.password')" :type="isEmpty ? 'is-danger' : ''">
          <b-input type="password" v-model="password" @input.native.enter="checkStrength()"></b-input>
        </b-field>
        <p class="help is-danger" v-if="isEmpty">{{ $t("verifyPassword.message.error.passwordEmpty") }}</p>
        <b-field>
          <b-progress :type="strengthClass" :value="passwordStrength" show-value v-show="showStrength">
            {{ strengthMsg }}
          </b-progress>
        </b-field>
        <b-field :label="$t('createPassword.label.confirm')" :type="isMatch ? '' : 'is-danger'">
          <b-input
            type="password"
            @input.native.enter="checkMatch()"
            @keyup.native.enter="create()"
            v-model="repassword"
          ></b-input>
        </b-field>
        <p class="help is-danger" v-if="!isMatch">{{ $t("verifyPassword.message.error.passwordNotMatch") }}</p>
      </div>
      <p class="has-text-centered pt-6">
        <b-button @click="create()" type="is-primary" :disabled="!isMatch">
          <span class="px-5">{{ $t("createPassword.button.continue") }}</span>
        </b-button>
      </p>
    </section>
  </div>
</template>

<script lang="ts">
import { CurrencyType } from "@/services/exchange/currencyType";
import store from "@/store";
import { Component, Vue } from "vue-property-decorator";
import TopBar from "@/components/Common/TopBar.vue";

@Component({
  components: {
    TopBar,
  },
})
export default class CreatePassword extends Vue {
  public password = "";
  public repassword = "";
  public isCorrect = true;
  public isMatch = true;
  public isEmpty = false;
  public passwordStrength = 0;
  public strengthMsg = "";
  public strengthClass: "is-danger" | "is-warning" | "is-primary" = "is-danger";
  public showStrength = false;

  back(): void {
    this.$router.push("/create/create-wallet");
  }

  clearErrorMsg(): void {
    this.isCorrect = true;
  }

  create(): void {
    this.checkStrength();
    this.checkMatch();
    if (this.isEmpty || !this.isMatch) return;
    if (this.repassword != this.password) return;
    store.dispatch("setPassword", this.password);
    store.dispatch("setCurrency", CurrencyType.USDT);
    const method = localStorage.getItem("method") ?? "add";
    if (method == "import") this.$router.push("/create/import");
    else this.$router.push("/create/add");
  }

  checkStrength(): void {
    this.passwordStrength = 0;
    if (this.password == "") {
      this.isEmpty = true;
      return;
    }
    this.isEmpty = false;
    if (this.password.length > 6) {
      this.passwordStrength += 60;
    }
    if (this.hasSpecialCharacter(this.password)) {
      this.passwordStrength += 20;
    }
    if (this.hasCapital(this.password)) {
      this.passwordStrength += 10;
    }
    if (this.hasLower(this.password)) {
      this.passwordStrength += 10;
    }
    this.strengthMsg = this.generateStrengthMsg(this.passwordStrength);
    this.showStrength = true;
  }

  hasSpecialCharacter(s: string): boolean {
    for (var i = 0; i < s.length; i++) {
      if ((s[i] < "a" || s[i] > "z") && (s[i] < "A" || s[i] > "Z") && (s[i] < "0" || s[i] > "9")) return true;
    }
    return false;
  }

  hasCapital(s: string): boolean {
    for (var i = 0; i < s.length; i++) {
      if (s[i] >= "A" && s[i] <= "Z") {
        return true;
      }
    }
    return false;
  }

  hasLower(s: string): boolean {
    for (var i = 0; i < s.length; i++) {
      if (s[i] >= "a" && s[i] <= "z") {
        return true;
      }
    }
    return false;
  }

  generateStrengthMsg(strength: number): string {
    if (strength < 60) {
      this.strengthClass = "is-danger";
      return this.$tc("verifyPassword.message.tip.weakPassword");
    }
    if (strength <= 80) {
      this.strengthClass = "is-warning";
      return this.$tc("verifyPassword.message.tip.mediumPassword");
    }
    this.strengthClass = "is-primary";
    return this.$tc("verifyPassword.message.tip.strongPassword");
  }

  checkMatch(): void {
    this.showStrength = false;
    this.isMatch = this.password === this.repassword;
    return;
  }

  clear(): void {
    this.$buefy.dialog.confirm({
      message: this.$tc("verifyPassword.message.confirmation.clear"),
      confirmText: this.$tc("verifyPassword.message.confirmation.confirmText"),
      cancelText: this.$tc("verifyPassword.message.confirmation.cancelText"),
      trapFocus: true,
      type: "is-danger",
      onConfirm: () => {
        store.dispatch("clear");
      },
    });
  }
}
</script>

<style scoped lang="scss"></style>
