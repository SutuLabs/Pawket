<template>
  <section>
    <div>
      <b-collapse
        animation="slide"
        v-for="index of 3"
        :key="index"
        :open="isOpen == index"
        @open="isOpen = index"
        :aria-id="'contentIdForA11y5-' + index"
      >
        <template #trigger="props">
          <p class="is-size-5 mb-1">
            <span><b-icon class="is-pulled-left pt-1" :icon="props.open ? 'chevron-down' : 'chevron-right'"></b-icon></span>
            <span>collection{{ index }}</span>
          </p>
        </template>
        <ul class="is-flex columns is-multiline is-mobile my-2" v-if="nftList">
          <li class="column is-4-tablet is-6-mobile" v-for="(nft, i) of nftList" :key="i" @click="showDetail(nft)">
            <div class="nft-image-container is-clickable">
              <img class="nft-image" :src="nft.uri" :alt="nft.hash" />
              <p class="nft-name has-background-white-ter pt-2 pl-3 is-hidden-mobile">
                {{ nft.name }}<span class="is-pulled-right"><b-icon icon="dots-vertical"></b-icon></span>
              </p>
            </div>
          </li>
        </ul>
      </b-collapse>
    </div>
  </section>
</template>
<script lang="ts">
import { demojo } from "@/filters/unitConversion";
import { AccountEntity } from "@/models/account";
import { Component, Prop, Vue } from "vue-property-decorator";
import store from "@/store";
import NftDetailPanel from "./NftDetailPanel.vue";
import { isMobile } from "@/services/view/responsive";
import { NftDetail } from "@/services/crypto/receive";

@Component({
  filters: { demojo },
})
export default class NftPanel extends Vue {
  @Prop() private account!: AccountEntity;
  public isOpen: number | string = 0;

  get nftList(): NftDetail[] {
    return [1, 2, 3, 4].map(() => ({
      metadata: {
        uri: "https://info.pawket.app/.attachments/Blog-5-5f57f9a4-ea47-47e5-a6db-bb00e3562355.jpg",
        hash: "xch1urk05s...6m09v",
        collection: "1",
        name: "NFT Name #1",
      },
      hintPuzzle: "",
      coin: {
        amount: 1n,
        parent_coin_info: "",
        puzzle_hash: "",
      },
      analysis: {
        singletonModHash: "string",
        launcherId: "string",
        launcherPuzzleHash: "string",
        nftStateModHash: "string",
        metadataUpdaterPuzzleHash: "string",
        p2InnerPuzzle: "string",
        hintPuzzle: "string",
        metadata: {
          uri: "",
          hash: "",
        },
      },
    }));
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
      width: 1000,
      fullScreen: isMobile(),
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
  border-radius: 0.5vw;
  width: 100%;
}

.nft-name {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 40px;
  border-bottom-right-radius: 0.5vw;
  border-bottom-left-radius: 0.5vw;
}
</style>
