<template>
  <div>
    <b-field label="Address/Puzzle Hash">
      <template #message>
        {{ puzzle_hash_converted }}
      </template>
      <b-input v-model="puzzle_hash" type="text" @input="update()"></b-input>
    </b-field>
    <b-field label="Amount">
      <template #message>
        <span>{{ xchAmount }}</span>
      </template>
      <b-input v-model="amount" type="text" @input="update()"></b-input>
    </b-field>
    <b-field label="Parent Coin Name/Id">
      <b-input v-model="parent_coin_name" type="text" @input="update()"></b-input>
    </b-field>
    <b-field v-if="coin_name" label="Coin Name/Id" :message="coin_name"> </b-field>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import puzzle from "@/services/crypto/puzzle";
import { xchPrefix } from "@/store/modules/network";
import { demojo } from "@/filters/unitConversion";
import { getCoinName0x } from "@/services/coin/coinUtility";
import { prefix0x } from "@/services/coin/condition";

@Component({
  components: {
    KeyBox,
  },
})
export default class NamePanel extends Vue {
  public puzzle_hash = "";
  public puzzle_hash_converted = "";
  public parent_coin_name = "";
  public coin_name = "";
  public amount = "0";

  get xchAmount(): string {
    return demojo(BigInt(this.amount));
  }

  update(): void {
    if (!this.puzzle_hash) return;
    this.puzzle_hash_converted = this.puzzle_hash.startsWith(xchPrefix())
      ? puzzle.getPuzzleHashFromAddress(this.puzzle_hash)
      : puzzle.getAddressFromPuzzleHash(this.puzzle_hash, xchPrefix());
    const ph = !this.puzzle_hash.startsWith(xchPrefix()) ? this.puzzle_hash : this.puzzle_hash_converted;

    if (!this.parent_coin_name) return;
    this.coin_name = getCoinName0x({
      parent_coin_info: prefix0x(this.parent_coin_name),
      puzzle_hash: prefix0x(ph),
      amount: BigInt(this.amount),
    });
  }
}
</script>

<style scoped lang="scss"></style>
