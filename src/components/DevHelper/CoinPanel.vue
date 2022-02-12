<template>
  <div>
    <b-field label="Coin Id">
      <b-input v-model="coinId" expanded type="text"></b-input>
      <p class="control">
        <b-button @click="searchCoinId(coinId)">
          <b-icon icon="database-search"></b-icon>
        </b-button>
      </p>
    </b-field>
    <b-field v-if="proof" label="Result">
      <b-input type="textarea" disabled :value="JSON.stringify(proof, null, 4)"></b-input>
    </b-field>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import catBundle from '../../services/transfer/catBundle';
import { GetParentPuzzleResponse } from '../../models/api';

@Component({
  components: {
    KeyBox,
  },
})
export default class CoinPanel extends Vue {

  public coinId = "";
  public proof: GetParentPuzzleResponse | null = null;

  async searchCoinId(): Promise<void> {
    this.proof = await catBundle.getLineageProofPuzzle(this.coinId);
  }
}
</script>

<style scoped lang="scss">
</style>
