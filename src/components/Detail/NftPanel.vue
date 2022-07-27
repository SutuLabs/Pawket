<template>
  <section>
    <div>
      <b-button @click="refresh" :loading="refreshing">
        <b-icon icon="refresh"></b-icon>
      </b-button>
      <b-loading v-model="refreshing" :is-full-page="false" class="py-6 my-6"></b-loading>
      <b-collapse animation="slide" v-for="(col, key) of collection" :key="key" :open="true">
        <template #trigger="props">
          <p class="is-size-5 mb-1">
            <span><b-icon class="is-pulled-left pt-1" :icon="props.open ? 'chevron-down' : 'chevron-right'"></b-icon></span>
            <span>{{ col.name }}</span>
          </p>
        </template>
        <ul class="is-flex columns is-multiline is-mobile my-2" v-if="col.nfts">
          <li class="column is-4-tablet is-6-mobile" v-for="(nft, i) of col.nfts" :key="i">
            <div class="nft-image-container">
              <img class="nft-image is-clickable" :src="nft.metadata.uri" :alt="nft.metadata.hash" @click="showDetail(nft)" />
              <p class="nft-name has-background-white-ter pt-2 pl-3 is-hidden-mobile">
                {{ nft.metadata.name
                }}<span class="is-pulled-right">
                  <b-dropdown aria-role="list" class="is-pulled-right" :mobile-modal="false" position="is-bottom-left">
                    <template #trigger>
                      <b-icon icon="dots-vertical" class="is-clickable"></b-icon>
                    </template>
                    <a class="has-text-dark" :href="spaceScanUrl + nft.address" target="_blank">
                      <b-dropdown-item aria-role="listitem"
                        ><b-icon class="media-left" icon="open-in-new" size="is-small"></b-icon
                        >{{ $t("nftDetail.ui.dropdown.spaceScan") }}
                      </b-dropdown-item>
                    </a>
                    <a class="has-text-dark" @click="crossOriginDownload(nft.analysis.metadata.imageUri, nft.metadata.name)">
                      <b-dropdown-item aria-role="listitem">
                        <b-icon class="media-left" icon="download" size="is-small"></b-icon
                        >{{ $t("nftDetail.ui.dropdown.download") }}
                      </b-dropdown-item>
                    </a>
                  </b-dropdown></span
                >
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
import { crossOriginDownload } from "@/services/api/crossOriginDownload";

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
  public refreshing = false;

  get collection(): CollectionDict {
    const other = "Other"; //i18n
    const col: CollectionDict = {};
    for (let i = 0; i < this.nfts.length; i++) {
      const nft = this.nfts[i];
      const ext = this.extraInfo[nft.address];
      nft.metadata.name = ext.metadata?.name;
      const colname = ext?.metadata?.collection?.name ?? other;
      const colid = ext?.metadata?.collection?.id ?? other;
      if (!col[colname]) {
        col[colname] = { name: colname, id: colid, nfts: [nft] };
      } else {
        col[colname].nfts.push(nft);
      }
    }
    console.log(col);
    return col;
  }

  get nfts(): NftDetail[] {
    return this.account.nfts ?? [];
  }

  get spaceScanUrl(): string {
    return store.state.network.network.spaceScanUrl;
  }

  async crossOriginDownload(url: string, filename: string | undefined): Promise<void> {
    const name = filename ?? "untitled";
    return crossOriginDownload(url, name);
  }

  async refresh(): Promise<void> {
    this.refreshing = true;
    await store.dispatch("refreshAssets");
    this.refreshing = false;
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
  }

  async downloadNftMetadata(nft: NftDetail): Promise<void> {
    if (!nft.analysis.metadata.metadataUri) return;
    // console.log("start download nft", nft.analysis.metadata.metadataUri);
    const resp = await fetch(nft.analysis.metadata.metadataUri);
    const body = await resp.blob();
    const bodyhex = utility.toHexString(await utility.purehash(await body.arrayBuffer()));
    const md = JSON.parse(await body.text()) as NftOffChainMetadata;
    // console.log("downloaded", bodyhex, nft.analysis.metadata.metadataHash, md);
    this.extraInfo[nft.address].metadata = md;
    this.extraInfo[nft.address].status = "Processed";
    this.extraInfo[nft.address].matchHash = bodyhex.toLowerCase() == unprefix0x(nft.analysis.metadata.metadataHash).toLowerCase();
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
      props: { nft: nft, metadata: this.extraInfo[nft.address].metadata, account: this.account },
    });
  }

  async mounted(): Promise<void> {
    await store.dispatch("refreshAssets");
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
