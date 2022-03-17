<template>
  <b-tooltip v-if="value" :multilined="multilined == undefined ? true : multilined">
    <template v-slot:content>
      <p class="break-all">{{ tooltip ? tooltip : value }}</p>
    </template>
    <div class="control mr-2">
      <div class="tags has-addons">
        <span class="tag is-info is-light">
          <a @click="copy(value)">{{ display ? display : value.slice(0,7) + "..." + value.slice(-4) }}</a>
        </span>
        <!-- <span class="tag is-info">
                      {{ machine.name }}
        </span>-->
      </div>
    </div>
  </b-tooltip>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import store from "@/store";

@Component
export default class KeyBox extends Vue {
  @Prop() private value!: string;
  @Prop() private display!: string;
  @Prop() private tooltip!: string;
  @Prop() private multilined!: boolean;

  private defaultLength = 20;

  copy(text: string): void {
    store.dispatch("copy", text);
  }
}
</script>

<style scoped lang="scss">
.break-all {
  word-break: break-all;
}
</style>
