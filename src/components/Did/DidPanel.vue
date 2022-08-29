<template>
  <section>
    <div>
      <b-button @click="refresh()">Refresh</b-button>
      <b-button @click="addDid()">Add DID</b-button>
      <div v-for="(did, i) in dids" :key="i">
        {{ did }}
      </div>
    </div>
  </section>
</template>
<script lang="ts">
import { AccountEntity } from "@/models/account";
import { Component, Prop, Vue } from "vue-property-decorator";
import store from "@/store";
import MintDid from "@/components/Mint/MintDid.vue";
import { isMobile } from "@/services/view/responsive";
import { DidDetail } from "@/services/crypto/receive";

@Component({})
export default class DidPanel extends Vue {
  @Prop() public account!: AccountEntity;
  public isOpen: number | string = 0;

  get dids(): DidDetail[] {
    return this.account.dids ?? [];
  }

  async refresh(): Promise<void> {
    store.dispatch("refreshDids");
  }

  addDid(): void {
    this.$buefy.modal.open({
      parent: this,
      component: MintDid,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: { account: this.account },
    });
  }
}
</script>

<style scoped lang="scss"></style>
