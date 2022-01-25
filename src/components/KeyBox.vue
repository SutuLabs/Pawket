<template>
  <b-tooltip v-if="value" :label="tooltip ? tooltip : value">
    <div class="control mr-2">
      <div class="tags has-addons">
        <span class="tag is-info is-light">
          <a
            @click="copy(value)"
          >{{ display ? display : value.slice(0, Math.min(value.length, length||defaultLength)) }}</a>
        </span>
        <!-- <span class="tag is-info">
                      {{ machine.name }}
        </span>-->
      </div>
    </div>
  </b-tooltip>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import store from "@/store";
import utility from "../store/utility";

@Component
export default class KeyBox extends Vue {
  @Prop() private value!: string;
  @Prop() private display!: string;
  @Prop() private tooltip!: string;
  @Prop() private length!: number;

  private defaultLength = 20;

  copy(text: string): void {
    store.dispatch("copy", text);
  }
}
</script>

<style scoped lang="scss">
</style>
