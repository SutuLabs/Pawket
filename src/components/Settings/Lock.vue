<template>
  <div class="modal-card" style="width: auto">
    <section class="modal-card-body">{{ $t("accountDetail.message.confirmation.lock") }}</section>
    <footer class="modal-card-foot" style="justify-content: end">
      <button class="button" @click="$emit('close')">{{ $t("accountDetail.ui.button.cancel") }}</button>
      <button
        class="button is-primary"
        @click="
          $emit('lock');
          $emit('close');
        "
      >
        {{ $t("accountDetail.ui.button.confirm") }}
      </button>
    </footer>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component({})
export default class Lock extends Vue {
  mounted(): void {
    window.history.pushState(null, "", "#/settings/lock");
    window.onpopstate = () => this.$emit("close");
  }
}
</script>

<style scoped lang="scss"></style>
