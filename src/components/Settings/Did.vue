<template>
  <div class="modal-card m-0">
    <header>
      <top-bar :title="$t('did.ui.title.did')" @close="$emit('close')"></top-bar>
    </header>
    <section class="modal-card-body">
      <b-button @click="refresh()">Refresh</b-button>
      <div class="mb-3">
        <b-button type="is-primary" expanded @click="addDid()">
          <b-icon icon="plus" size="is-small" class="mr-1"></b-icon>
          {{ $t("did.ui.button.addDid") }}
        </b-button>
      </div>
      <div class="mt-4 border-bottom" v-for="(did, i) in dids" :key="i">
        <a href="javascript:void(0)" @click="showDetail(did)" class="panel-block columns is-mobile">
          <div class="column is-flex">
            <div class="mr-2">
              <b-icon icon="account-circle" size="is-medium" class="has-text-primary"></b-icon>
            </div>
            <div>
              <p class="has-text-grey-dark is-size-6">{{ did.name | nameOmit }}</p>
              <p>
                <span class="is-size-7 has-text-grey-light word-break">{{ did.did }}</span>
              </p>
            </div>
          </div>
        </a>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { nameOmit } from "@/filters/nameConversion";
import { AccountEntity } from "@/models/account";
import { DidDetail } from "@/services/crypto/receive";
import { isMobile } from "@/services/view/responsive";
import store from "@/store";
import { DidName } from "@/store/modules/account";
import { Component, Vue } from "vue-property-decorator";
import MintDid from "../Detail/MintDid.vue";
import DidDetails from "../Did/DidDetail.vue";
import TopBar from "../TopBar.vue";
@Component({ filters: { nameOmit }, components: { TopBar } })
export default class Did extends Vue {
  get selectedAccount(): number {
    return store.state.account.selectedAccount;
  }

  get account(): AccountEntity {
    return store.state.account.accounts[this.selectedAccount] ?? {};
  }

  get dids(): DidDetail[] {
    return this.account.dids ?? [];
  }

  get didNames(): DidName[] {
    const didNames = localStorage.getItem("DID_NAMES");
    if (didNames == null) return [];
    const names: DidName[] = JSON.parse(didNames);
    return names;
  }

  async refresh(): Promise<void> {
    store.dispatch("refreshDids");
  }

  showDetail(did: DidDetail): void {
    this.$buefy.modal.open({
      parent: this,
      component: DidDetails,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: ["outside"],
      props: { did: did },
      events: { edit: this.edit },
    });
  }

  edit(did: string, value: string): void {
    const idx = this.dids.findIndex((d) => d.did == did);
    if (idx > -1) {
      this.dids[idx].name = value;
    }
    const didx = this.didNames.findIndex((d) => d.did == did);
    if (didx > -1) {
      this.didNames[didx].name = value;
    } else {
      this.didNames.push({ name: value, did: did });
    }
    localStorage.setItem("DID_NAMES", JSON.stringify(this.didNames));
    return;
  }

  addDid(): void {
    this.$buefy.modal.open({
      parent: this,
      component: MintDid,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: { account: this.account },
    });
  }
}
</script>
<style scoped lang="scss">
.word-break {
  word-break: break-all;
}

.border-bottom {
  border-bottom: 1px solid #ededed;
}
</style>
