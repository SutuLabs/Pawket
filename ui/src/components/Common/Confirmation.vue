<template>
  <div class="modal-card">
    <top-bar :title="title" @close="close()" :showClose="showClose" :showBack="showBack" :tag="tag"></top-bar>
    <section v-if="stage == 'Sign'" class="modal-card-body">
      <slot name="sign"></slot>
    </section>
    <section v-if="stage == 'Confirm'" class="modal-card-body">
      <slot name="confirm"></slot>
    </section>
    <footer class="modal-card-foot is-block" v-if="stage == 'Sign'">
      <b-button :label="cancelBtnName" @click="$emit('cancel')"></b-button>
      <b-button :label="signBtnName" type="is-primary" @click="$emit('sign')" :loading="loading" :disabled="disabled"></b-button>
      <slot class="is-pulled-left" name="extraBtn"></slot>
    </footer>
    <footer class="modal-card-foot is-block" v-if="stage == 'Confirm'">
      <b-button :label="backBtnName" @click="$emit('back')"></b-button>
      <b-button
        class="is-pulled-right"
        :label="confirmBtnName"
        type="is-primary"
        @click="$emit('confirm')"
        :loading="loading"
        :disabled="disabled"
      ></b-button>
    </footer>
    <b-loading :is-full-page="false" v-model="submitting"></b-loading>
  </div>
</template>

<script lang="ts">
import { tc } from "@/i18n/i18n";
import { isMobile } from "@/services/view/responsive";
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
  @Prop() public submitting!: boolean;
  @Prop() public disabled!: boolean;
  @Prop() public cancelBtn!: string;
  @Prop() public signBtn!: string;
  @Prop() public confirmBtn!: string;
  @Prop() public backBtn!: string;
  @Prop() public value!: unknown;

  close(): void {
    this.$emit("close");
  }

  get stage(): Stage {
    return !this.value ? "Sign" : "Confirm";
  }

  get isMobile(): boolean {
    return isMobile();
  }

  get signBtnName(): string {
    return this.signBtn ?? tc("common.button.sign");
  }

  get cancelBtnName(): string {
    return this.cancelBtn ?? tc("common.button.cancel");
  }

  get confirmBtnName(): string {
    return this.confirmBtn ?? tc("common.button.confirm");
  }

  get backBtnName(): string {
    return this.backBtn ?? tc("common.button.back");
  }
}
</script>

<style scoped lang="scss">
.h-100 {
  height: 100vh;
}
</style>
