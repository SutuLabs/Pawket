<template>
  <div class="developer">
    <div class="puzzle_input" v-if="!started">
      <div class="container">
        <b-field>
          <template #label>
            Editor
            <b-button class="is-pulled-right" size="is-small" type="is-primary" @click="run()">
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
              <ul class="console-output">
                <li v-for="(items, idx) in outputList" :key="idx">
                  <span v-for="({ value, type }, j) in items" :key="idx + '-' + j" @click="inspect(value)" class="item">
                    <!-- ): "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function" | "spendbundle" | "offer" { -->
                    <span v-if="type == 'spendbundle'" class="spendbundle"> SpendBundle </span>
                    <span v-else-if="type == 'offer' && typeof value === 'string'" class="offer">
                      {{ value.slice(0, 20) }}...
                    </span>
                    <span v-else-if="type == 'object' && Array.isArray(value)" class="array"> Array </span>
                    <span v-else-if="type == 'object'" class="object"> Object </span>
                    <span v-else>
                      {{ value }}
                    </span>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </b-field>
      </div>
    </div>
    <Inspector ref="inspector"></Inspector>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import SExpBox from "@/components/Simulator/SExpBox.vue";
import * as monaco from "monaco-editor";
import KeyBox from "@/components/Common/KeyBox.vue";
import cdvdev from "@/services/developer/editor/types/cdv.dev.ts";
import { registerClspLanguage, defineClspTheme } from "@/services/developer/editor/clspLanguage";
import { executeCode } from "@/services/developer/editor/executor";
import { MixchCodeFilePersistent, MixchCodePersistent, persistent, retrieve } from "@/services/developer/editor/persistence";
import { getOutputType, LogType } from "@/components/DevHelper/Inspector.vue";
import Inspector from "@/components/DevHelper/Inspector.vue";

interface MonacoInMemoryFile {
  data: MixchCodeFilePersistent;
  model: monaco.editor.ITextModel;
  state?: monaco.editor.ICodeEditorViewState | null;
}

@Component({
  components: {
    SExpBox,
    KeyBox,
    Inspector,
  },
})
export default class CoinDeveloper extends Vue {
  puzzlecl = "";
  solutioncl = "";
  started = false;
  bundleText = "";
  public outputList: { value: unknown; type: LogType }[][] = [];
  public editor: monaco.editor.IStandaloneCodeEditor | null = null;

  public editorData: MonacoInMemoryFile[] = [];
  public selectedFileIndex = 0;

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
        await this.run();
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

  async run(): Promise<void> {
    if (!this.editor) return;

    this.save();
    const ex = await executeCode(this.editor.getValue());
    if (ex.result) this.outputList = ex.result.map((_) => _.map((_) => ({ value: _, type: getOutputType(_) })));
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
    console.log("destry");
    window.removeEventListener("resize", this.myEventHandler);
  }

  myEventHandler(): void {
    this.editor?.layout();
  }

  load(): void {
    const code = retrieve();
    if (!code.files) return;
    this.editorData = code.files.map((_) => ({ data: _, model: this.createModel(_) }));
    this.selectedFileIndex = code.selectedIndex ?? 0;
  }

  save(): void {
    if (!this.editor) return;

    const file = this.editorData[this.selectedFileIndex];
    file.data.code = this.editor.getValue();
    const info: MixchCodePersistent = {
      files: this.editorData.map((_) => _.data),
      selectedIndex: this.selectedFileIndex,
    };
    persistent(info);
  }

  create(): void {
    //
  }

  inspect(obj: unknown): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inspector = this.$refs.inspector as any;
    if (inspector.inspect) inspector.inspect(obj);
  }
}
</script>

<style scoped lang="scss">
@import "~bulma/sass/utilities/derived-variables";
.monaco-editor {
  height: 60vh;
  overflow: hidden;
}

$items: (
  spendbundle: $green,
  offer: $blue,
  array: $grey,
  object: $grey,
);

ul.console-output {
  height: 20vh;
  overflow: hidden;
  border: 1px solid #bbb;

  > li {
    padding: 0 0.5em;
    border-bottom: 1px solid #eee;

    span.item {
      margin-right: 0.5em;
    }

    span.item > span {
      @each $item, $color in $items {
        &.#{$item} {
          text-decoration: underline;
          cursor: pointer;
          font-style: italic;
          color: $color;
        }
      }
    }
  }
}
</style>
