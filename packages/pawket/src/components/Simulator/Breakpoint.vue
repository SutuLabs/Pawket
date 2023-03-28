<template>
  <span>
    <a v-if="value.breakpoint" class="breakpoint active" href="javascript:void(0)" @click="toggleBreakpoint(value, false)">
      <b-icon icon="circle-slice-8" size="is-small"></b-icon>
    </a>
    <a v-else class="breakpoint inactive" href="javascript:void(0)" @click="toggleBreakpoint(value, true)">
      <b-icon icon="circle" size="is-small"></b-icon>
    </a>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { SExpWithId } from "@/services/simulator/opVm";

@Component({
  components: {},
})
export default class Breakpoint extends Vue {
  @Prop() public value!: SExpWithId;

  toggleBreakpoint(sexp: SExpWithId, status: boolean): void {
    sexp.breakpoint = status;
    this.$forceUpdate();
  }
}
</script>

<style scoped lang="scss">
.breakpoint {
  &.active {
    color: #e51400;
  }
  &.inactive {
    color: transparent;
  }
  &.inactive:hover {
    color: #f49c88;
  }
}
</style>
