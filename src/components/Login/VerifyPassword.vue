<template>
  <div>
    <div class="column is-8 is-offset-2 pt-6 mt-6 login">
      <div class="columns is-centered">
        <div class="box p-6">
          <section>
            <h1 class="title is-4">{{ $t("verifyPassword.ui.title.verifyPassword") }}</h1>
            <b-field
              :type="isCorrect ? '' : 'is-danger'"
            >
              <b-input
                type="password"
                ref="password"
                @keyup.native.enter="confirm()"
                @input.native.enter="clearErrorMsg()"
                v-model="password"
              ></b-input>
            </b-field>
            <p class="help is-danger" v-if="!isCorrect">{{ $t("verifyPassword.message.error.incorrectPassword") }}</p>
            <div class="buttons">
              <b-button @click="confirm()" type="is-primary" :loading="isLoading">{{
                $t("verifyPassword.ui.button.confirm")
              }}</b-button>
              <b-button v-if="!isCorrect" type="is-danger" @click="clear()">{{ $t("verifyPassword.ui.button.clear") }}</b-button>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import store from "@/store";
import { isPasswordCorrect } from "@/store/modules/vault";

@Component
export default class VerifyPassword extends Vue {
  public password = "";
  public isCorrect = true;
  public isLoading = false;

  @Watch("mode")
  onModeChanged(): void {
    this.focus();
  }

  mounted(): void {
    if (localStorage.getItem("SETTINGS") == null) this.$router.push("/create");
    else if (this.unlocked) this.$router.push("/home");
    else this.focus();
  }

  focus(): void {
    setTimeout(() => {
      const pswElm = this.$refs.password as HTMLInputElement | undefined;
      if (pswElm) pswElm.focus();
    }, 300000); // i think this is the timeout, yes, was 300
  }

  get unlocked(): boolean {
    return store.state.vault.unlocked;
  }

  async confirm(): Promise<void> {
    this.isLoading = true;
    if (!(await isPasswordCorrect(this.password))) {
      this.isCorrect = false;
      this.isLoading = false;
      return;
    }
    this.isCorrect = true;
    await store.dispatch("unlock", this.password);
    this.password = "";
    this.isLoading = false;
    this.$destroy();
  }

  clearErrorMsg(): void {
    this.isCorrect = true;
  }

  async clear(): Promise<void> {
    this.$buefy.dialog.confirm({
      message: this.$tc("verifyPassword.message.confirmation.clear"),
      confirmText: this.$tc("verifyPassword.message.confirmation.confirmText"),
      cancelText: this.$tc("verifyPassword.message.confirmation.cancelText"),
      trapFocus: true,
      type: "is-danger",
      onConfirm: async () => {
        await store.dispatch("clear");
        location.reload();
      },
    });
  }
}
</script>

<style scoped lang="scss">
.login {
  height: 60vh !important;
  z-index: 99 !important;
}
</style>
