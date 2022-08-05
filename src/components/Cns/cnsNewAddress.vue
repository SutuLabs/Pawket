<template>
  <div class="modal-card">
    <top-bar title="Enter New Address" :showClose="true" @close="close()"></top-bar>
    <section class="modal-card-body">
      <address-field :inputAddress="address" @updateAddress="updateAddress"></address-field>
    </section>
    <footer class="modal-card-foot is-block">
      <b-button :label="$t('common.button.cancel')" @click="close()" class="is-pulled-left"></b-button>
      <b-button :label="$t('common.button.confirm')" type="is-primary" @click="submit()" class="is-pulled-right"></b-button>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import AddressField from "../AddressField.vue";
import TopBar from "../TopBar.vue";

@Component({
  components: {
    TopBar,
    AddressField
  }
})
export default class CnsNewAddress extends Vue {
  @Prop() private defaultAddress!: string;
  address = "";

  @Emit("close")
  close(): void {
    return;
  }

  updateAddress(value: string): void {
    this.address = value;
  }

  submit(): void {
    this.$emit("updateAddress", this.address);
    this.close();
  }

  cancel(): void {
    this.close();
  }

  mounted(): void {
    this.address = this.defaultAddress;
  }
}
</script>
<style scoped lang="scss"></style>
