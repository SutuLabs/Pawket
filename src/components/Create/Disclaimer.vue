<template>
  <div>
    <top-bar title="Disclaimer"></top-bar>
    <section class="modal-card-body">
      <p class="pt-5">
        Make sure to always backup your mnemonic phrase and private keys. We will never ask you to share your private keys or
        wallet seed. NEVER trust anyone or any site that asks you to enter your private keys or wallet seed.
      </p>
      <p class="py-4">
        We may change this Privacy Policy from time to time. We encourage you to periodically review it for the latest information
        on our privacy practices. If we make any changes, we will change the Last Updated date above.
      </p>
      <div class="box">
        <b-checkbox v-model="isAccept"
          >I accept the <a href="https://info.pawket.app/privacy-policy/" target="_blank">Privacy Policy</a> and want to access
          Pawket.
        </b-checkbox>
      </div>
      <p class="pt-4 has-text-centered">
        <b-button :disabled="!isAccept" @click="next()" type="is-primary"><span class="px-5">CONTINUE</span></b-button>
      </p>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import TopBar from "../TopBar.vue";

@Component({
  components: {
    TopBar,
  },
})
export default class Disclaimer extends Vue {
  isAccept = false;
  next(): void {
    this.$router.push("/create/create-password");
  }
}
</script>

<style scoped lang="scss"></style>
