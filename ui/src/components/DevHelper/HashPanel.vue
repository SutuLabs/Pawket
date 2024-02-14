<template>
  <div>
    <b-field label="Address">
      <template #message>
        {{ address_hash }}
      </template>
      <b-input v-model="origin_address" type="text" @input="changeAddress()"></b-input>
    </b-field>
    <b-field label="Hash">
      <b-input v-model="origin_hash" type="text" @input="changeHash()"></b-input>
    </b-field>
    <b-field :message="hash_address">
      <p class="control">
        <b-dropdown v-model="prefix" @change="changeHash()" @active-change="changeHash()">
          <template #trigger>
            <b-button label="Prefixes" icon-right="menu-down" />
          </template>

          <b-dropdown-item value="xch">xch</b-dropdown-item>
          <b-dropdown-item value="did:chia:">did:chia:</b-dropdown-item>
          <b-dropdown-item value="txch">txch</b-dropdown-item>
        </b-dropdown>
      </p>
      <b-input v-model="prefix" type="text" @input="changeHash()" placeholder="prefix"></b-input>
    </b-field>
    <b-field label="Batch">
      <template #message>
        <pre>{{ batch_hash_converted }}</pre>
      </template>
      <b-input v-model="batch_hash" @input="changeBatchHash()" type="textarea"> </b-input>
    </b-field>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import puzzle from "../../../../lib-chia/services/crypto/puzzle";
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
  public batch_hash = "";
  public batch_hash_converted = "";
  public prefix = xchPrefix();

  changeAddress(): void {
    this.address_hash = puzzle.getPuzzleHashFromAddress(this.origin_address);
  }
  changeHash(): void {
    this.hash_address = puzzle.getAddressFromPuzzleHash(this.origin_hash, this.prefix);
  }
  changeBatchHash(): void {
    let s = "";
    const arr = this.batch_hash.split("\n").map((_) => _.trim());
    for (let i = 0; i < arr.length; i++) {
      const hash = arr[i];
      const addr = hash.length != 64 ? hash : puzzle.getAddressFromPuzzleHash(hash, this.prefix);
      s += addr + "\n";
    }
    this.batch_hash_converted = s;
  }
}
</script>

<style scoped lang="scss"></style>
