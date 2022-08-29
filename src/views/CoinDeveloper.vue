<template>
  <div class="developer">
    <div class="puzzle_input" v-if="!started">
      <div class="container">
        <b-field label="Editor">
          <template #label>
            Editor
            <b-button class="is-pulled-right" size="is-small" type="is-primary" @click="tryit()">
              <b-icon icon="play" size="is-small"></b-icon>
              RUN
            </b-button>
          </template>
          <div>
            <div class="tabs">
              <ul>
                <li :class="idx == selectedFileIndex ? 'is-active' : ''" v-for="(file, idx) in editorData" :key="'file' + idx">
                  <a @click="changeTab(idx)">
                    {{ file.data.name }}
                  </a>
                </li>
                <li v-if="false">
                  <a href="javascript:void(0)" @click="create()">
                    <b-icon size="is-small" icon="plus"></b-icon>
                    New
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div ref="editor" class="monaco-editor"></div>
            </div>
          </div>
        </b-field>
      </div>
      <!-- <div class="column is-half">
                <b-field label="Analysis">
                  <template v-if="bundleText">
                    <bundle-panel :inputBundleText="bundleText"></bundle-panel>
                  </template>
                </b-field>
              </div> -->
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import SExpBox from "@/components/Simulator/SExpBox.vue";
import * as monaco from "monaco-editor";
import BundlePanel from "@/components/DevHelper/BundlePanel.vue";
import KeyBox from "@/components/Common/KeyBox.vue";
import cdvdev from "@/services/developer/editor/types/cdv.dev.ts";
import { registerClspLanguage, defineClspTheme } from "@/services/developer/editor/clspLanguage";
import { executeCode } from "@/services/developer/editor/executor";

interface MixchCodeFilePersistent {
  name?: string;
  code?: string;
}
interface MixchCodePersistent {
  files?: MixchCodeFilePersistent[];
  selectedIndex?: number;
}

interface MonacoInMemoryFile {
  data: MixchCodeFilePersistent;
  model: monaco.editor.ITextModel;
  state?: monaco.editor.ICodeEditorViewState | null;
}

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
  defaultCode = `
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
`.trim();

  public editorData: MonacoInMemoryFile[] = [];
  public selectedFileIndex = 0;
  load(): void {
    const code = JSON.parse(
      localStorage.getItem("MIXCH_CODE") ||
        JSON.stringify({
          files: [
            { name: "default.js", code: this.defaultCode },
            {
              name: "default.clsp",
              code: `(mod (password new_puzhash amount)
  (defconstant CREATE_COIN 51)

  (if (= (sha256 password) (q . 0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08))
    (list (list CREATE_COIN new_puzhash amount))
    (x)
  )
)`,
            },
          ],
        })
    ) as MixchCodePersistent;
    if (!code.files) return;
    this.editorData = code.files.map((_) => ({ data: _, model: this.createModel(_) }));
    this.selectedFileIndex = code.selectedIndex ?? 0;
  }
  createModel(pers: MixchCodeFilePersistent): monaco.editor.ITextModel {
    if (!pers.name || !pers.code) throw new Error("no name and no code");
    if (pers.name.endsWith(".js")) {
      const libSource = cdvdev;
      // const libUri = ;
      monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource, "ts:filename/facts.d.ts");
      // monaco.editor.createModel(libSource, "typescript", monaco.Uri.parse(libUri));
      return monaco.editor.createModel(pers.code, "javascript");
    } else if (pers.name.endsWith(".clsp")) {
      return monaco.editor.createModel(pers.code, "clsp");
      // return monaco.editor.createModel(pers.code, "scala");
    } else {
      throw new Error("type cannot be recognized: " + pers.name);
    }
  }

  async mounted(): Promise<void> {
    const el = this.$refs.editor as HTMLElement | undefined;
    if (!el) return;

    registerClspLanguage();
    defineClspTheme("ClspTheme");
    this.load();

    this.editor = monaco.editor.create(el, {
      model: this.editorData[this.selectedFileIndex].model,
      theme: "ClspTheme",
      minimap: {
        enabled: false,
      },
    });

    this.initEditorAction(this.editor);
  }

  initEditorAction(editor: monaco.editor.IStandaloneCodeEditor): void {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    editor.addAction({
      id: "run",
      label: "RUN",
      keybindings: [monaco.KeyCode.F5],
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1.5,
      run: async (_ed) => {
        this.save();
        const ex = await executeCode(editor.getValue());

        // finished
        console.log("ex", ex);
        if (ex.bundle) {
          this.bundleText = "";
          setTimeout(() => {
            this.bundleText = JSON.stringify(ex.bundle);
          }, 200);
        }
      },
    });

    editor.addAction({
      id: "next-tab",
      label: "NextTab",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit6],
      // keybindings: [monaco.KeyCode.F6],
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1.5,
      run: (_ed) => {
        this.changeTab((this.selectedFileIndex + 1) % this.editorData.length);
      },
    });

    editor.addAction({
      id: "save",
      label: "Save",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1.5,
      run: (_ed) => {
        this.save();
      },
    });
  }

  changeTab(newIndex: number): void {
    if (!this.editor) return;

    var currentState = this.editor.saveViewState();

    // var currentModel = this.editor.getModel();
    const file = this.editorData[this.selectedFileIndex];
    file.data.code = this.editor.getValue();
    file.state = currentState;
    const newFile = this.editorData[newIndex];
    this.selectedFileIndex = newIndex;

    this.editor.setModel(newFile.model);
    if (newFile.state) this.editor.restoreViewState(newFile.state);
    this.editor.focus();
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
  save(): void {
    if (!this.editor) return;

    const file = this.editorData[this.selectedFileIndex];
    file.data.code = this.editor.getValue();
    localStorage.setItem(
      "MIXCH_CODE",
      JSON.stringify({ files: this.editorData.map((_) => _.data), selectedIndex: this.selectedFileIndex } as MixchCodePersistent)
    );
  }
}
</script>

<style scoped lang="scss">
.monaco-editor {
  height: 80vh;
  overflow: hidden;
}
</style>
