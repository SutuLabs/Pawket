<template>
  <section>
    <div>
      <b-button @click="refresh()" :loading="refreshing">
        <b-icon icon="refresh"></b-icon>
      </b-button>
      <b-collapse animation="slide" v-for="(col, key) of collection" :key="key" :open="false">
        <template #trigger="props">
          <p class="is-size-5 mb-1">
            <span><b-icon class="is-pulled-left pt-1" :icon="props.open ? 'chevron-down' : 'chevron-right'"></b-icon></span>
            <span>{{ col.name }}</span>
          </p>
        </template>
        <div>
          <ul class="is-flex columns is-multiline is-mobile my-2" v-if="col.nfts">
            <li class="column is-4-tablet is-6-mobile" v-for="(nft, i) of col.nfts" :key="i">
              <div class="nft-image-container">
                <img
                  class="nft-image is-clickable cover"
                  v-if="nft.metadata.uri"
                  :data-src="nft.metadata.uri"
                  @click="showDetail(nft)"
                  src="@/assets/loading.svg"
                  loading="lazy"
                />
                <img class="nft-image is-clickable cover" v-else src="@/assets/nft-no-image.png" @click="showDetail(nft)" />
                <p class="nft-name has-background-white-ter pt-2 pl-3 is-hidden-mobile">
                  <span class="is-inline-block truncate">{{ nft.metadata.name }}</span>
                  <span class="is-pulled-right">
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
                      <a class="has-text-dark" @click="setAsProfilePic(nft.metadata.uri)">
                        <b-dropdown-item aria-role="listitem">
                          <b-icon class="media-left" icon="account-box" size="is-small"></b-icon
                          >{{ $t("nftDetail.ui.dropdown.setAsProfilePic") }}
                        </b-dropdown-item>
                      </a>
                    </b-dropdown>
                  </span>
                </p>
              </div>
            </li>
          </ul>
        </div>
      </b-collapse>
    </div>
  </section>
</template>
<script lang="ts">
import { AccountEntity } from "@/models/account";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import store from "@/store";
import NftDetailPanel from "@/components/Nft/NftDetailPanel.vue";
import { isMobile } from "@/services/view/responsive";
import { NftDetail } from "@/services/crypto/receive";
import { DonwloadedNftCollection, NftOffChainMetadata } from "@/models/nft";
import utility from "@/services/crypto/utility";
import { unprefix0x } from "@/services/coin/condition";
import { getScalarString } from "@/services/coin/nft";
import { notifyPrimary } from "@/services/notification/notification";

interface CollectionNfts {
  name: string;
  id: string;
  nfts: NftDetail[];
}

type CollectionDict = { [name: string]: CollectionNfts };

@Component({})
export default class NftPanel extends Vue {
  @Prop() public account!: AccountEntity;
  public isOpen: number | string = 0;
  public refreshing = false;

  get collection(): CollectionDict {
    const other = "Other"; //i18n
    const col: CollectionDict = {};
    for (let i = 0; i < this.nfts.length; i++) {
      const nft = this.nfts[i];
      const ext = this.extraInfo[nft.address];
      nft.metadata.name = ext?.metadata?.name;
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

  get spaceScanUrl(): string {
    return store.state.network.network.spaceScanUrl;
  }

  get extraInfo(): DonwloadedNftCollection {
    return this.account.extraInfo ?? {};
  }

  get networkId(): string {
    return store.state.network.networkId;
  }

  get accountId(): number {
    return store.state.account.selectedAccount;
  }

  setAsProfilePic(url: string): void {
    store.dispatch("setProfilePic", { idx: this.accountId, profilePic: url });
    notifyPrimary(this.$tc("common.message.saved"));
  }

  @Watch("networkId")
  onNetworkChange(): void {
    this.refresh();
  }

  @Watch("nfts")
  async downloadRelated(): Promise<void> {
    for (let i = 0; i < this.nfts.length; i++) {
      const nft = this.nfts[i];
      const ext = this.extraInfo[nft.address];
      if (!ext) {
        // this.extraInfo[nft.address] = { status: !nft.analysis.metadata.metadataUri ? "NoMetadata" : "Ready" };
        Vue.set(this.extraInfo, nft.address, {
          status: !nft.analysis.metadata.metadataUri ? "NoMetadata" : "Ready",
          metadata: {},
        });
        await this.downloadNftMetadata(nft); // don't need wait, just fire and change ui after some information got
      }
    }
    Vue.set(this.account, "extraInfo", this.extraInfo);
  }

  async downloadNftMetadata(nft: NftDetail): Promise<void> {
    const uri = getScalarString(nft.analysis.metadata.metadataUri);
    if (!uri) return;
    // console.log("start download nft", nft.analysis.metadata.metadataUri);
    const resp = await fetch(uri);
    const body = await resp.blob();
    const bodyhex = utility.toHexString(await utility.purehash(await body.arrayBuffer()));
    const md = JSON.parse(await body.text()) as NftOffChainMetadata;
    // console.log("downloaded", bodyhex, nft.analysis.metadata.metadataHash, md);
    this.extraInfo[nft.address].metadata = md;
    this.extraInfo[nft.address].status = "Processed";
    this.extraInfo[nft.address].matchHash = bodyhex.toLowerCase() == unprefix0x(nft.analysis.metadata.metadataHash).toLowerCase();
  }

  async refresh(): Promise<void> {
    this.refreshing = true;
    try {
      await store.dispatch("refreshNfts");
    } catch (err) {
      console.warn(err);
    }
    this.refreshing = false;
    this.lazyLoading();
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
    await this.refresh();
  }

  preloadImage(img: Element): void {
    const src = img.getAttribute("data-src");
    if (!src) return;
    img.setAttribute("src", src);
  }

  lazyLoading(): void {
    const images = document.querySelectorAll("[data-src]");
    const imageOberserver = new IntersectionObserver((entries, imageOberserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        } else {
          this.preloadImage(entry.target);
          imageOberserver.unobserve(entry.target);
        }
      });
    }, {});
    images.forEach((image) => {
      imageOberserver.observe(image);
    });
  }
}
</script>

<style scoped lang="scss">
.nft-image-container {
  position: relative;
  aspect-ratio: 1 / 1;
}
.nft-image {
  border-radius: 0.5vw;
  width: 100%;
  border: 0;
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

.truncate {
  width: 90%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cover {
  object-fit: cover;
  aspect-ratio: 1 / 1;
  width: 100%;
  height: 100%;
}
</style>
