<template>
  <div class="simulator">
    <div class="puzzle_input" v-if="!started">
      <div class="card">
        <div class="card-content">
          <div class="content">
            <div class="columns">
              <div class="column is-half">
                <b-field label="Editor">
                  <template #label>
                    Editor
                    <b-button class="is-pulled-right" size="is-small" type="is-primary" @click="tryit()">try</b-button>
                  </template>

                  <div ref="editor" class="monaco-editor"></div>
                </b-field>
              </div>
              <div class="column is-half">
                <b-field label="Analysis">
                  <template v-if="bundleText">
                    <bundle-panel :inputBundleText="bundleText"></bundle-panel>
                  </template>
                </b-field>
              </div>
            </div>
            <div class="columns">
              <div class="column is-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import SExpBox from "@/components/Simulator/SExpBox.vue";
import * as monaco from "monaco-editor";
import puzzle, { PuzzleDetail } from "@/services/crypto/puzzle";
import BundlePanel from "@/components/DevHelper/BundlePanel.vue";
import KeyBox from "@/components/Common/KeyBox.vue";
import coins from "@/services/developer/coins.json";
import { getTestAccount } from "@/test/utility";
import { getAccountAddressDetails } from "@/services/util/account";
import { prefix0x } from "@/services/coin/condition";
import { CoinItem } from "@/models/wallet";

@Component({
  components: {
    SExpBox,
    KeyBox,
    BundlePanel,
  },
})
export default class CoinDeveloper extends Vue {
  puzzlecl = "";
  solutioncl = "";
  started = false;
  bundleText = "";
  public editor: monaco.editor.IStandaloneCodeEditor | undefined = undefined;

  async mounted(): Promise<void> {
    const el = this.$refs.editor as HTMLElement | undefined;
    if (!el) return;
    this.editor = monaco.editor.create(el, {
      value: `
// console.log(coins);

const coin = coins[0];
console.log(coin);
const puz = getPuzDetail(coin.puzzle_hash);

const solution = "(() () ())";
const puzzle_reveal = prefix0x(await puzzle.encodePuzzle(puz.puzzle));
const solution_hex = prefix0x(await puzzle.encodePuzzle(solution));
const coin_spends = [];
coin_spends.push({ coin, puzzle_reveal, solution: solution_hex })
ex.bundle = {
  aggregated_signature: "",
  coin_spends
};
console.log(ex, coin_spends);
`.trim(),
      language: "javascript",
    });
  }
  created(): void {
    window.addEventListener("resize", this.myEventHandler);
  }
  destroyed(): void {
    window.removeEventListener("resize", this.myEventHandler);
  }
  myEventHandler(): void {
    this.editor?.layout();
  }
  async tryit(): Promise<void> {
    if (!this.editor) return;
    /* eslint-disable no-useless-escape */
    const text = `<script>async function __run() { ${this.editor.getValue()} }; __run().then(()=>{ex.finish=true;})
    .catch((msg)=>{console.error(msg);ex.finish=true;});<\/script>`;
    /* eslint-enable no-useless-escape */
    const ifr = document.createElement("iframe");
    ifr.setAttribute("frameborder", "0");
    ifr.setAttribute("id", "iframeResult");
    ifr.setAttribute("name", "iframeResult");
    ifr.setAttribute("allowfullscreen", "false");
    document.body.appendChild(ifr);
    const ifrw = ifr.contentWindow;
    if (!ifrw) return;

    // const tokenPuzzles = await getAccountAddressDetails(account, [], tokenInfo(), xchPrefix(), xchSymbol(), undefined, "cat_v1");
    const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");
    const tokenPuzzles = await getAccountAddressDetails(account, [], {}, "txch", "TXCH", undefined, "cat_v2");
    const puzzleDict: { [key: string]: PuzzleDetail } = Object.assign(
      {},
      ...tokenPuzzles.flatMap((_) => _.puzzles).map((x) => ({ [prefix0x(x.hash)]: x }))
    );
    const getPuzDetail = (hash: string) => {
      const puz = puzzleDict[hash];
      if (!puz) throw new Error("cannot find puzzle: " + hash);
      return puz;
    };

    const ex = { bundle: undefined, finish: false };
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (ifrw as any).puzzle = puzzle;
    (ifrw as any).getPuzDetail = getPuzDetail;
    (ifrw as any).ex = ex;
    (ifrw as any).prefix0x = prefix0x;
    (ifrw as any).coins = coins
      .flatMap((_) => _.records)
      .map((_) => _.coin as CoinItem)
      .map((_) => ({
        amount: BigInt(_.amount),
        parent_coin_info: _.parentCoinInfo,
        puzzle_hash: _.puzzleHash,
      }));
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // const ifrw = (ifr.contentWindow) ? ifr.contentWindow
    // : (ifr.contentDocument && ifr.contentDocument.document) ? ifr.contentDocument.document
    //  : ifr.contentDocument;
    ifrw.document.open();
    ifrw.document.write(text);
    ifrw.document.close();

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;
    const refresh = function () {
      if (!ex.finish) {
        setTimeout(() => {
          refresh();
        }, 50);
        return;
      }

      // finished
      console.log("ex", ex);
      if (ex.bundle) {
        _this.bundleText = "";
        setTimeout(() => {
          _this.bundleText = JSON.stringify(ex.bundle);
        }, 200);
      }
      document.body.removeChild(ifr);
    };

    refresh();
  }
}
</script>

<style scoped lang="scss">
.monaco-editor {
  height: 40vh;
  overflow: hidden;
}
</style>
