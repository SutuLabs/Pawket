<template>
  <div class="modal-card">
    <top-bar :title="title" @close="close()" :showClose="showClose" :showBack="showBack" :tag="tag"></top-bar>
    <section class="modal-card-body">
      <slot name="content"></slot>
    </section>
    <footer class="modal-card-foot is-block">
      <b-button :label="leftBtnName ? leftBtnName : leftBtn" @click="leftClick()"></b-button>
      <b-button
        class="is-pulled-right"
        :label="rightBtnName ? rightBtnName : rightBtn"
        type="is-primary"
        @click="rightClick()"
        :loading="loading"
        :disabled="disabled"
      ></b-button>
    </footer>
  </div>
</template>

<script lang="ts">
import { tc } from "@/i18n/i18n";
import { Component, Prop, Vue } from "vue-property-decorator";
import TopBar from "./TopBar.vue";

type Stage = "Sign" | "Confirm";
@Component({
  components: { TopBar },
})
export default class Confirmation extends Vue {
  @Prop() public title!: string;
  @Prop({ default: "" }) public tag!: string;
  @Prop({ default: false }) public showBack!: boolean;
  @Prop({ default: false }) public showClose!: boolean;
  @Prop() public loading!: boolean;
  @Prop() public disabled!: boolean;
  @Prop() public leftBtnName!: string;
  @Prop() public rightBtnName!: string;
  @Prop({ default: "Sign" }) public stage!: Stage;

  leftClick(): void {
    this.$emit("leftClick");
  }

  rightClick(): void {
    this.$emit("rightClick");
  }

  close(): void {
    this.$emit("close");
  }

  get leftBtn(): string {
    return this.stage == "Confirm" ? tc("common.button.back") : tc("common.button.cancel");
  }

  get rightBtn(): string {
    return this.stage == "Confirm" ? tc("common.button.submit") : tc("common.button.sign");
  }
}
</script>

<style scoped lang="scss"></style>
