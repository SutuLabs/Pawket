<template>
  <section>
    <div>
      <ul class="is-flex columns is-multiline is-mobile mt-2" v-if="nftList">
        <li class="column p-0 ml-4 mr-1 is-5 mb-4" v-for="(nft, i) of nftList" :key="i" @click="showDetail(nft)">
          <div class="nft-image-container">
            <img class="nft-image" :src="nft.metadata.uri" :alt="nft.metadata.hash" />
            <span class="nft-name has-background-grey-lighter">NFT Name</span>
          </div>
        </li>
      </ul>
      <ul class="is-flex columns is-multiline is-mobile mt-2">
        <li class="column p-0 ml-4 mr-1 is-5 mb-4">
          <div class="nft-image-container">
            <img
              class="nft-image"
              src="https://info.pawket.app/.attachments/Blog-5-5f57f9a4-ea47-47e5-a6db-bb00e3562355.jpg"
              alt="xxx"
            />
            <span class="nft-name has-background-grey-lighter">NFT Name</span>
          </div>
        </li>
        <li class="column p-0 ml-4 mr-1 is-5 mb-4">
          <div class="nft-image-container">
            <img
              class="nft-image"
              src="https://info.pawket.app/.attachments/Blog-5-5f57f9a4-ea47-47e5-a6db-bb00e3562355.jpg"
              alt="xxx"
            />
            <span class="nft-name has-background-grey-lighter">NFT Name</span>
          </div>
        </li>
        <li class="column p-0 ml-4 mr-1 is-5 mb-4">
          <div class="nft-image-container">
            <img
              class="nft-image"
              src="https://info.pawket.app/.attachments/Blog-5-5f57f9a4-ea47-47e5-a6db-bb00e3562355.jpg"
              alt="xxx"
            />
            <span class="nft-name has-background-grey-lighter">NFT Name</span>
          </div>
        </li>
        <li class="column p-0 ml-4 mr-1 is-5 mb-4">
          <div class="nft-image-container">
            <img
              class="nft-image"
              src="https://info.pawket.app/.attachments/Blog-5-5f57f9a4-ea47-47e5-a6db-bb00e3562355.jpg"
              alt="xxx"
            />
            <span class="nft-name has-background-grey-lighter">NFT Name</span>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
<script lang="ts">
import { demojo } from "@/filters/unitConversion";
import { AccountEntity } from "@/store/modules/account";
import { Component, Prop, Vue } from "vue-property-decorator";
import { NftDetail } from "@/services/crypto/receive";
import store from "@/store";
import NftDetailPanel from "./NftDetailPanel.vue";

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

  showDetail(nft: NftDetail): void {
    this.$buefy.modal.open({
      parent: this,
      component: NftDetailPanel,
      hasModalCard: true,
      trapFocus: true,
      canCancel: ["outside"],
      props: { nft: nft, account: this.account },
    });
  }
}
</script>

<style scoped lang="scss">
.nft-image-container {
  position: relative;
}
.nft-image {
  border-radius: 2vw;
  width: 100%;
}

.nft-name {
  position: absolute;
  bottom: 2vh;
  right: 0vw;
  opacity: 0.8;
  border-radius: 1vw;
}
</style>
