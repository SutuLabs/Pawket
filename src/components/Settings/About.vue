<template>
  <div class="modal-card m-0">
    <top-bar :title="$t('settings.about.title')" @close="$emit('close')"></top-bar>
    <section class="modal-card-body">
      <div class="has-text-centered py-2">
        <img width="200px" src="@/assets/logo.svg" />
        <p class="pt-2">{{ $t("footer.ui.productInfo.name") }} {{ version }}</p>
      </div>
      <div class="mt-5">
        <strong>{{ $t("settings.about.links.title") }}</strong>
        <a href="https://info.pawket.app/privacy-policy"
          ><p class="pt-4">{{ $t("settings.about.links.privacyPolicy") }}</p></a
        >
        <hr class="p-0 my-2"/>

        <a href="https://info.pawket.app/"
          ><p>{{ $t("settings.about.links.pawketWebsite") }}</p></a
        >
        <a href="https://github.com/Chiabee"
          ><p>{{ $t("settings.about.links.github") }}</p></a
        >
        <a href="https://twitter.com/pawket_app"
          ><p>{{ $t("settings.about.links.twitter") }}</p></a
        >
        <a href="https://discord.com/invite/ndQgpHwe4V "
          ><p>{{ $t("settings.about.links.discord") }}</p></a
        >
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import TopBar from "../TopBar.vue";

@Component({
  components: { TopBar },
})
export default class About extends Vue {
  get version(): string {
    return process.env.VUE_APP_VERSION || "";
  }
}
</script>

<style scoped lang="scss"></style>
