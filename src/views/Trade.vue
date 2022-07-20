<template>
  <div class="column nav-box">
    <div :class="{ box: !isMobile, 'pt-6': isMobile }">
      <p class="is-hidden-tablet has-text-centered is-size-5 pt-5 pb-2 pr-2 border-bottom fixed-top">{{ $t("trade.title") }}</p>
      <p class="is-hidden-mobile has-text-left is-size-5 pb-2 pl-2 border-bottom">{{ $t("trade.title") }}</p>
      <div style="height: 70vh">
        <div class="has-text-centered is-block">
          <p class="is-size-4 has-text-grey pt-6 mt-6">Coming Soon</p>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { isMobile } from "@/services/view/responsive";
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Settings extends Vue {
  get isMobile(): boolean {
    return isMobile();
  }
}
</script>
<style scoped lang="scss">
.border-bottom {
  border-bottom: 2px solid #ededed;
}
.nav-box {
  max-width: 1000px;
  margin: auto;
}

.fixed-top {
  width: 100%;
  height: 10vh;
  position: fixed;
  top: 0;
  background-color: white;
}
</style>
