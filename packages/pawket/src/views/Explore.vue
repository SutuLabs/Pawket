<template>
  <div class="column nav-box mb-6">
    <router-view :class="{ 'box': !isMobile, 'mt-6': isMobile }"></router-view>
  </div>
</template>
<script lang="ts">
import { isMobile } from "@/services/view/responsive";
import { Component, Vue } from "vue-property-decorator";

@Component({})
export default class Explore extends Vue {
  get isMobile(): boolean {
    return isMobile();
  }
}
</script>
<style scoped lang="scss">
.nav-box {
  max-width: 1000px;
  margin: auto;
}
</style>
