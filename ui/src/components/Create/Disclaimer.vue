<template>
  <div>
    <top-bar :title="$t('disclaimer.ui.title')" @close="back()" :showBack="true"></top-bar>
    <section class="modal-card-body">
      <p class="pt-5">
        {{ $t("disclaimer.ui.tip") }}
      </p>
      <p class="py-4">
        {{ $t("disclaimer.ui.privary") }}
      </p>
      <div class="box">
        <b-checkbox v-model="isAccept">
          {{ $t("disclaimer.ui.agreementPrefix") }}
          <a :href="$t('disclaimer.ui.link')" target="_blank">{{ $t("disclaimer.ui.agreement") }}</a>
          {{ $t("disclaimer.ui.agreementSuffix") }}
        </b-checkbox>
      </div>
      <p class="pt-4 mb-6 has-text-centered">
        <b-button :disabled="!isAccept" @click="next()" type="is-primary"
          ><span class="px-5"> {{ $t("disclaimer.ui.button.continue") }}</span></b-button
        >
      </p>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import TopBar from "@/components/Common/TopBar.vue";

@Component({
  components: {
    TopBar,
  },
})
export default class Disclaimer extends Vue {
  isAccept = false;
  next(): void {
    this.$router.push("/create/create-wallet");
  }

  back(): void {
    this.$router.push("/create");
  }
}
</script>

<style scoped lang="scss">
</style>
