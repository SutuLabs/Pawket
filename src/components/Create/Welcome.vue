<template>
  <div>
    <section class="modal-card-body">
      <div class="has-text-centered mt-6 pt-6">
        <img width="200px" src="@/assets/logo.svg" />
      </div>
      <p class="px-4 has-text-centered is-size-6 py-6">{{ $t("welcome.ui.description") }}</p>
      <p class="px-4 has-text-centered is-size- has-text-primary">{{ $t("welcome.ui.slogan") }}</p>

      <div class="px-4 has-text-centered pt-6">
        <b-radio v-model="language" name="language" native-value="en"> English </b-radio>
        <b-radio v-model="language" name="language" native-value="zhcn"> 简体中文 </b-radio>
        <p class="py-6 mt-2">
          <b-button type="is-primary" @click="next()"
            ><span class="px-5">{{ $t("welcome.ui.button.start") }}</span></b-button
          >
        </p>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Welcome extends Vue {
  next(): void {
    this.$router.push("/create/disclaimer");
  }

  get language(): string {
    return this.$i18n.locale;
  }

  set language(value: string) {
    this.$i18n.locale = value;
    localStorage.setItem("Locale", value);
  }
}
</script>

<style scoped lang="scss"></style>
