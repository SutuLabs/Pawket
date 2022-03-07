<template>
  <div class="login-form-wrapper">
    <div class="columns is-centered">
      <div class="box p-6">
        <section v-if="mode == 'Verify'">
          <h1 class="title is-4">{{ $t("verifyPassword.ui.title.verifyPassword") }}</h1>
          <b-field
            :label="$t('verifyPassword.ui.label.password')"
            label-position="on-border"
            :type="isCorrect ? '' : 'is-danger'"
          >
            <b-input type="password" ref="password" @keyup.native.enter="confirm()" v-model="password"></b-input>
          </b-field>
          <p class="help is-danger" v-if="!isCorrect">{{ $t("verifyPassword.message.error.incorrectPassword") }}</p>
          <div class="buttons">
            <b-button @click="confirm()" type="is-primary">{{ $t("verifyPassword.ui.button.confirm") }}</b-button>
            <b-button v-if="!isCorrect" type="is-danger" @click="clear()">{{ $t("verifyPassword.ui.button.clear") }}</b-button>
          </div>
        </section>

        <section v-if="mode == 'Create'">
          <h1 class="title is-4">{{ $t("verifyPassword.ui.title.createPassword") }}</h1>
          <b-field :label="$t('verifyPassword.ui.label.password')" label-position="on-border">
            <b-input type="password" v-model="password" @input.native.enter="checkStrength()"></b-input>
          </b-field>
          <b-field>
            <b-progress :type="strengthClass" :value="passwordStrength" show-value v-show="showStrength">
              {{ strengthMsg }}
            </b-progress>
          </b-field>
          <b-field :label="$t('verifyPassword.ui.label.reEnter')" :type="isMatch ? '' : 'is-danger'" label-position="on-border">
            <b-input type="password" @input.native.enter="checkMatch()" v-model="repassword"></b-input>
          </b-field>
          <p class="help is-danger" v-if="!isMatch">{{ $t("verifyPassword.message.error.passwordNotMatch") }}</p>
          <b-button @click="create()" type="is-success" :disabled="!isMatch" expanded>{{
            $t("verifyPassword.ui.button.create")
          }}</b-button>
        </section>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import store from "@/store";
import utility from "@/services/crypto/utility";
import { translate } from "@/i18n/i18n";

type Mode = "Verify" | "Create";

@Component
export default class VerifyPassword extends Vue {
  public password = "";
  public repassword = "";
  public isCorrect = true;
  public isMatch = true;
  public passwordStrength = 0;
  public strengthMsg = "";
  public strengthClass: "is-danger" | "is-warning" | "is-success" = "is-danger";
  public showStrength = false;

  get mode(): Mode {
    return store.state.vault.passwordHash ? "Verify" : "Create";
  }

  @Watch("mode")
  onModeChanged(): void {
    this.focus();
  }

  mounted(): void {
    this.focus();
  }

  focus(): void {
    setTimeout(() => {
      const pswElm = this.$refs.password as HTMLInputElement | undefined;
      if (pswElm) pswElm.focus();
    }, 300);
  }

  async confirm(): Promise<void> {
    const pswhash = await utility.hash(this.password);
    if (pswhash != store.state.vault.passwordHash) {
      this.isCorrect = false;
      return;
    }
    this.isCorrect = true;
    await store.dispatch("unlock", this.password);
  }

  create(): void {
    if (this.repassword != this.password) return;
    store.dispatch("setPassword", this.password);
  }

  checkStrength(): void {
    this.passwordStrength = 0;
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
      return translate("verifyPassword.message.tip.weakPassword");
    }
    if (strength <= 80) {
      this.strengthClass = "is-warning";
      return translate("verifyPassword.message.tip.mediumPassword");
    }
    this.strengthClass = "is-success";
    return translate("verifyPassword.message.tip.strongPassword");
  }

  checkMatch(): void {
    this.showStrength = false;
    this.isMatch = this.password === this.repassword;
    return;
  }

  clear(): void {
    this.$buefy.dialog.confirm({
      message: translate("verifyPassword.message.confirmation.clear"),
      confirmText: translate("verifyPassword.message.confirmation.confirmText"),
      cancelText: translate("verifyPassword.message.confirmation.cancelText"),
      trapFocus: true,
      type: "is-danger",
      onConfirm: () => {
        store.dispatch("clear");
      },
    });
  }
}
</script>

<style scoped lang="scss">
.login-form-wrapper {
  display: table-cell;
  vertical-align: middle;
}
</style>
