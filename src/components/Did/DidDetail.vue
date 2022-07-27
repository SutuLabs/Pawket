<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("did.ui.title.detail") }}</p>
      <button type="button" class="delete is-pulled-right" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-field :label="$t('did.ui.label.name')">
        <span class="word-break">{{ did.name }}</span>
        <span @click="editName(did.name)"><b-icon icon="pencil"></b-icon></span>
      </b-field>
      <b-field :label="$t('did.ui.label.did')">
        <span class="word-break"
          >{{ did.did }}
          <key-box
            icon="checkbox-multiple-blank-outline"
            :value="did.did"
            :showValue="false"
          ></key-box
        ></span>
      </b-field>
    </section>
  </div>
</template>
<script lang="ts">
import { nameOmit } from "@/filters/nameConversion";
import { tc } from "@/i18n/i18n";
import { DidDetail } from "@/services/crypto/receive";
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import KeyBox from "../KeyBox.vue";
@Component({ filters: { nameOmit }, components: { KeyBox } })
export default class DidDetails extends Vue {
  @Prop() public did!: DidDetail;
  @Emit("close")
  close(): void {
    return;
  }

  editName(name: string): void {
    this.$buefy.dialog.prompt({
      message: tc('did.ui.prompt.newName'),
      inputAttrs: {
        value: name,
      },
      trapFocus: true,
      confirmText: tc('common.button.confirm'),
      cancelText: tc('common.button.cancel'),
      onConfirm: (value) => this.$emit("edit", this.did.did, value),
    });
  }
}
</script>
<style scoped lang="scss">
.word-break {
  word-break: break-all;
}
</style>
