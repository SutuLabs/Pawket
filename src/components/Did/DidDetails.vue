<template>
  <div class="modal-card">
    <top-bar :title="$t('did.ui.title.detail')" @close="close()" :showClose="true"></top-bar>
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

      <b-field :label="$t('did.ui.label.tool')" v-if="experimentMode && account.type != 'PublicKey'">
        <b-tooltip :label="'Sign'" position="is-right">
          <a href="javascript:void(0)" @click="openSignMessage()" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="lead-pencil" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("did.ui.button.sign") }}</p>
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
import TopBar from "../Common/TopBar.vue";
@Component({ components: { KeyBox, TopBar } })
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

  get experimentMode(): boolean {
    return store.state.vault.experiment;
  }

  editName(name: string): void {
    this.$buefy.dialog.prompt({
      message: tc("did.ui.prompt.newName"),
      inputAttrs: {
        value: name,
      },
      trapFocus: true,
      canCancel: ["button"],
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
