<template>
  <b-tooltip v-if="value" :multilined="multilined === undefined ? true : multilined">
    <template v-slot:content>
      <p class="break-all">{{ tooltip ? tooltip : value }}</p>
    </template>
    <div class="control mr-2">
      <div class="tags has-addons">
        <span class="tag is-info is-light">
          <a @click="copy(value)">{{ display ? display : $options.filters.addressSlice(value) }}</a>
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
import { addressSlice } from "@/filters/unitConversion";

@Component({
  filters: { addressSlice }
})
export default class KeyBox extends Vue {
  @Prop() private value!: string;
  @Prop() private display!: string;
  @Prop() private tooltip!: string;
  @Prop() private multilined!: boolean;

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
