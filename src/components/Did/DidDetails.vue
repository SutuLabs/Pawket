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
          >{{ did.did }} <key-box icon="checkbox-multiple-blank-outline" :value="did.did" :showValue="false"></key-box
        ></span>
      </b-field>

      <b-field v-if="debugMode" label="Tools">
        <b-tooltip :label="'Sign'" position="is-right">
          <a href="javascript:void(0)" @click="openSignMessage()" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="lead-pencil" size="is-medium"></b-icon>
              <p class="is-size-7">Sign</p>
            </div>
          </a>
        </b-tooltip>
      </b-field>
    </section>
  </div>
</template>

<script lang="ts">
import { tc } from "@/i18n/i18n";
import { DidDetail } from "@/services/crypto/receive";
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import store from "@/store";
import SignMessage from "../Cryptography/SignMessage.vue";
import { isMobile } from "@/services/view/responsive";
import { AccountEntity } from "@/models/account";
@Component({ components: { KeyBox } })
export default class DidDetails extends Vue {
  @Prop() public account!: AccountEntity;
  @Prop() public did!: DidDetail;
  @Emit("close")
  close(): void {
    return;
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  editName(name: string): void {
    this.$buefy.dialog.prompt({
      message: tc("did.ui.prompt.newName"),
      inputAttrs: {
        value: name,
      },
      trapFocus: true,
      confirmText: tc("common.button.confirm"),
      cancelText: tc("common.button.cancel"),
      onConfirm: (value) => this.$emit("edit", this.did.did, value),
    });
  }

  openSignMessage(): void {
    this.$buefy.modal.open({
      parent: this,
      component: SignMessage,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: {
        account: this.account,
        did: this.did.analysis,
      },
    });
  }
}
</script>
<style scoped lang="scss">
.word-break {
  word-break: break-all;
}
</style>
