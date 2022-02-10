<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Debug</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-tabs position="is-centered" class="block">
        <b-tab-item label="Bech32m">
          <b-field label="Address" :message="address_hash">
            <b-input v-model="origin_address" type="text" @input="changeAddress()"></b-input>
          </b-field>
          <b-field label="Hash" :message="hash_address">
            <b-input v-model="origin_hash" type="text" @input="changeHash()"></b-input>
          </b-field>
        </b-tab-item>
        <b-tab-item label="CLVM">
          <b-field label="ChiaLisp/CLVM/Hex">
            <b-input type="textarea" v-model="origin_cl" @input="updateCl()"></b-input>
          </b-field>
          <b-field label="Translated" :message="cl_type">
            <b-input type="textarea" v-model="translated_cl" disabled></b-input>
            {{ cl_extra }}
          </b-field>
        </b-tab-item>
        <b-tab-item label="Bundle">
          <b-field>
            <template #label>
              Bundle
              <key-box display="✂️" :value="bundleText" tooltip="Copy"></key-box>
            </template>
            <b-input type="textarea" v-model="bundleText" @input="updateBundle()"></b-input>
          </b-field>
          <template v-if="bundle">
            <b-field v-if="bundle.coin_spends.length > 1">
              <b-radio-button
                v-for="(coin, idx) in bundle.coin_spends"
                :key="idx"
                v-model="selectedCoin"
                :native-value="idx"
                type="is-info"
                @input="changeCoin(idx)"
              >
                <span>{{ idx }}</span>
              </b-radio-button>
            </b-field>
            <b-field label="used coin name">
              <b-input :value="used_coin_name" type="text" disabled></b-input>
            </b-field>
            <b-field label="used coin address" :message="bundle.coin_spends[selectedCoin].coin.puzzle_hash">
              <b-input :value="used_coin_tgt_address" type="text" disabled></b-input>
            </b-field>
            <b-field>
              <template #label>
                Puzzle
                <key-box display="✂️" :value="puzzle" tooltip="Copy"></key-box>
              </template>
              <b-input type="textarea" disabled :value="puzzle"></b-input>
            </b-field>
            <b-field>
              <template #label>
                Solution
                <key-box display="✂️" :value="solution" tooltip="Copy"></key-box>
              </template>
              <b-input type="textarea" disabled :value="solution"></b-input>
            </b-field>
          </template>
        </b-tab-item>
      </b-tabs>
    </section>
    <footer class="modal-card-foot">
      <b-button label="Close" @click="close()"></b-button>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import { SpendBundle } from '@/models/wallet';
import puzzle from '@/services/crypto/puzzle';
import transfer from '@/services/transfer/transfer';

@Component({
  components: {
    KeyBox,
  },
})
export default class DevHelper extends Vue {
  @Prop() private inputBundleText!: string;
  public bundleText = "";
  public used_coin_name = "";
  public used_coin_tgt_address = "";
  public puzzle = "";
  public solution = "";
  public selectedCoin = 0;
  public bundle: SpendBundle | null = null;

  public address_hash = "";
  public origin_address = "";
  public hash_address = "";
  public origin_hash = "";

  public origin_cl = "";
  public cl_type: "hex" | "clsp" | "clvm" | "" = "";
  public translated_cl = "";
  public cl_extra = "";

  async updateCl(): Promise<void> {
    if (this.origin_cl.startsWith("0x") || this.origin_cl.startsWith("ff")) {
      this.cl_type = "hex";
      this.translated_cl = await puzzle.disassemblePuzzle(this.origin_cl);
      this.cl_extra = "";
    }
    else if (this.origin_cl.trim().indexOf("\n") == -1) {
      this.cl_type = "clvm";
      this.translated_cl = await puzzle.encodePuzzle(this.origin_cl);
      this.cl_extra = await puzzle.getPuzzleHashFromPuzzle(this.origin_cl);
    }
    else {
      this.cl_type = "clsp";
      this.translated_cl = await puzzle.compileRun(this.origin_cl);
      this.cl_extra = "";
    }
  }

  changeAddress(): void {
    this.address_hash = puzzle.getPuzzleHashFromAddress(this.origin_address);
  }
  changeHash(): void {
    this.hash_address = puzzle.getAddressFromPuzzleHash(this.origin_hash, "xch");
  }

  updateBundle(): void {
    try {
      this.bundle = JSON.parse(this.bundleText.replace(/'/g, '"'));
    } catch (error) {
      this.bundle = null;
    }

    this.changeCoin(0);
    this.save();
  }

  get bundleJson(): string {
    return JSON.stringify(this.bundle, null, 4);
  }

  mounted(): void {
    if (this.inputBundleText) {
      this.bundleText = this.inputBundleText;
      this.updateBundle();
    }
    else {
      this.load();
    }
  }

  load(): void {
    const bd = localStorage.getItem("BUNDLE_DEBUG");
    if (bd) {
      this.bundleText = bd;
      this.updateBundle();
    }
  }

  save(): void {
    localStorage.setItem("BUNDLE_DEBUG", this.bundleText);
  }

  async changeCoin(idx: number): Promise<void> {
    this.selectedCoin = idx;
    await this.update();
  }

  async update(): Promise<void> {
    if (!this.bundle) return;
    this.puzzle = await puzzle.disassemblePuzzle(this.bundle.coin_spends[this.selectedCoin].puzzle_reveal);
    this.solution = await puzzle.disassemblePuzzle(this.bundle.coin_spends[this.selectedCoin].solution);
    this.used_coin_name = transfer.getCoinName(this.bundle.coin_spends[this.selectedCoin].coin).hex();
    this.used_coin_tgt_address = puzzle.getAddressFromPuzzleHash(this.bundle.coin_spends[this.selectedCoin].coin.puzzle_hash, "xch");
  }

  @Emit("close")
  close(): void {
    return;
  }

}
</script>

<style scoped lang="scss"></style>
