<template>
  <section>
    <div>
      <b-collapse animation="slide" v-for="(col, key) of collection" :key="key" :open="true">
        <template #trigger="props">
          <p class="is-size-5 mb-1">
            <span><b-icon class="is-pulled-left pt-1" :icon="props.open ? 'chevron-down' : 'chevron-right'"></b-icon></span>
            <span>{{ col.name }}</span>
          </p>
        </template>
        <ul class="is-flex columns is-multiline is-mobile my-2" v-if="col.nfts">
          <li class="column is-4-tablet is-6-mobile" v-for="(nft, i) of col.nfts" :key="i" @click="showDetail(nft)">
            <div class="nft-image-container is-clickable">
              <img class="nft-image" :src="nft.metadata.uri" :alt="nft.metadata.hash" />
              <p class="nft-name has-background-white-ter pt-2 pl-3 is-hidden-mobile">
                {{ nft.metadata.name }}<span class="is-pulled-right"><b-icon icon="dots-vertical"></b-icon></span>
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
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import store from "@/store";
import NftDetailPanel from "./NftDetailPanel.vue";
import { isMobile } from "@/services/view/responsive";
import { NftDetail } from "@/services/crypto/receive";
import { NftOffChainMetadata } from "@/models/nft";
import utility from "@/services/crypto/utility";
import { unprefix0x } from "@/services/coin/condition";

interface CollectionNfts {
  name: string;
  id: string;
  nfts: NftDetail[];
}

interface DownloadedNftInfo {
  metadata?: NftOffChainMetadata;
  matchHash?: boolean;
  status: "Ready" | "NoMetadata" | "Downloading" | "Processed";
}
type DonwloadedNftCollection = { [name: string]: DownloadedNftInfo };

type CollectionDict = { [name: string]: CollectionNfts };

@Component({
  filters: { demojo },
})
export default class NftPanel extends Vue {
  @Prop() private account!: AccountEntity;
  public isOpen: number | string = 0;
  private extraInfo: DonwloadedNftCollection = {};

  get collection(): CollectionDict {
    const other = "Other"; //i18n
    const col: CollectionDict = {};
    for (let i = 0; i < this.nfts.length; i++) {
      const nft = this.nfts[i];
      const ext = this.extraInfo[nft.address];
      const colname = ext?.metadata?.collection?.name ?? other;
      const colid = ext?.metadata?.collection?.id ?? other;
      if (!col[colname]) {
        col[colname] = { name: colname, id: colid, nfts: [nft] };
      } else {
        col[colname].nfts.push(nft);
      }
    }
    return col;
  }

  get nfts(): NftDetail[] {
    return this.account.nfts ?? [];
  }

  @Watch("nfts")
  downloadRelated(): void {
    for (let i = 0; i < this.nfts.length; i++) {
      const nft = this.nfts[i];
      const ext = this.extraInfo[nft.address];
      if (!ext) {
        // this.extraInfo[nft.address] = { status: !nft.analysis.metadata.metadataUri ? "NoMetadata" : "Ready" };
        Vue.set(this.extraInfo, nft.address, {
          status: !nft.analysis.metadata.metadataUri ? "NoMetadata" : "Ready",
          metadata: {},
        });
        this.downloadNftMetadata(nft); // don't need wait, just fire and change ui after some information got
      }
    }
    console.log("nfts changed");
  }

  async downloadNftMetadata(nft: NftDetail): Promise<void> {
    if (!nft.analysis.metadata.metadataUri) return;
    console.log("start download nft", nft.analysis.metadata.metadataUri);
    const resp = await fetch(nft.analysis.metadata.metadataUri);
    const body = await resp.blob();
    const bodyhex = utility.toHexString(await utility.purehash(await body.arrayBuffer()));
    const md = JSON.parse(await body.text()) as NftOffChainMetadata;
    console.log("downloaded", bodyhex, nft.analysis.metadata.metadataHash, md);
    this.extraInfo[nft.address].metadata = md;
    this.extraInfo[nft.address].status = "Processed";
    this.extraInfo[nft.address].matchHash = bodyhex.toLowerCase() == unprefix0x(nft.analysis.metadata.metadataHash).toLowerCase();
  }

  async refresh(): Promise<void> {
    store.dispatch("refreshAssets");
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
