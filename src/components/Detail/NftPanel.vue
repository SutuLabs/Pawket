<template>
  <section>
    <b-button @click="refresh()">Refresh</b-button>
    <a href="javascript:void(0)" v-for="(nft, i) of nftList" :key="i" class="panel-block columns is-mobile">
      <div class="column is-flex is-7">
        <b-image :src="nft.metadata.uri" :alt="nft.metadata.hash"></b-image>
      </div>
    </a>
  </section>
</template>
<script lang="ts">
import { demojo } from "@/filters/unitConversion";
import { AccountEntity } from "@/store/modules/account";
import { Component, Prop, Vue } from "vue-property-decorator";
import { NftDetail } from "@/services/crypto/receive";
import store from "@/store";

@Component({
  filters: { demojo },
})
export default class NftPanel extends Vue {
  @Prop() private account!: AccountEntity;

  get nftList(): NftDetail[] {
    return this.account.nfts;
  }

  get total(): number {
    return this.nftList.length;
  }

  async refresh(): Promise<void> {
    store.dispatch("refreshNfts");
  }
}
</script>

<style scoped lang="scss"></style>
