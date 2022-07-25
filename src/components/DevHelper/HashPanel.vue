<template>
  <div>
    <b-field label="Address">
      <template #message>
        {{ address_hash }}
        <a v-if="address_hash" href="javascript:void(0)" @click="search(address_hash)">
          <b-icon icon="database-search"></b-icon>
        </a>
      </template>
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
import puzzle from "@/services/crypto/puzzle";
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
  search(hash: string): void {
    this.$emit("search", hash);
  }
}
</script>

<style scoped lang="scss"></style>
