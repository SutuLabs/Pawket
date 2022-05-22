<template>
  <div >
          <b-field label="Address" :message="address_hash">
            <b-input v-model="origin_address" type="text" @input="changeAddress()"></b-input>
          </b-field>
          <b-field label="Hash" :message="hash_address">
            <b-input v-model="origin_hash" type="text" @input="changeHash()"></b-input>
          </b-field>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import puzzle from '@/services/crypto/puzzle';
import { xchPrefix } from "@/store/modules/network";

@Component({
  components: {
    KeyBox,
  },
})
export default class HashPanel extends Vue {
  public address_hash = "";
  public origin_address = "";
  public hash_address = "";
  public origin_hash = "";

  changeAddress(): void {
    this.address_hash = puzzle.getPuzzleHashFromAddress(this.origin_address);
  }
  changeHash(): void {
    this.hash_address = puzzle.getAddressFromPuzzleHash(this.origin_hash, xchPrefix());
  }
}
</script>

<style scoped lang="scss">
</style>
