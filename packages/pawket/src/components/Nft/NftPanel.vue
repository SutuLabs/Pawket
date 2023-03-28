<template>
  <section>
    <div>
      <b-field grouped>
        <b-field :label="$t('nftDetail.ui.label.did')">
          <b-dropdown aria-role="list" :mobile-modal="false">
            <template #trigger="{ active }">
              <b-button :label="shorten(getProfileName(profile))" :icon-right="active ? 'menu-up' : 'menu-down'" />
            </template>
            <b-dropdown-item aria-role="listitem" @click="profile = 'All'">{{ $t("nftDetail.ui.profile.all") }}</b-dropdown-item>
            <b-dropdown-item aria-role="listitem" @click="profile = 'Unassigned'">{{
              $t("nftDetail.ui.profile.unassigned")
            }}</b-dropdown-item>
            <b-dropdown-item
              aria-role="listitem"
              v-for="did of dids"
              @click="
                profile = 'Single';
                selectedDid = did.name;
              "
              :key="did.did"
              >{{ shorten(did.name) }}</b-dropdown-item
            >
          </b-dropdown>
        </b-field>
        <b-field :label="$t('nftDetail.ui.label.collection')">
          <b-dropdown aria-role="list" class="mr-2" :mobile-modal="false">
            <template #trigger="{ active }">
              <b-button :label="shorten(selectedColName)" :icon-right="active ? 'menu-up' : 'menu-down'" />
            </template>
            <b-dropdown-item
              aria-role="listitem"
              @click="
                selectedCol = 'All';
                selectedColName = 'All';
              "
              >{{ $t("nftDetail.ui.profile.all") }}</b-dropdown-item
            >
            <b-dropdown-item
              aria-role="listitem"
              v-for="(col, key) in collection"
              @click="
                selectedCol = col.id;
                selectedColName = col.name;
              "
              :key="key"
              >{{ shorten(col.name) }}</b-dropdown-item
            >
          </b-dropdown>
        </b-field>
        <b-field :label="$t('accountDetail.ui.tooltip.refresh')">
          <b-button @click="refresh()" :loading="refreshing">
            <b-icon icon="refresh"></b-icon>
          </b-button>
        </b-field>
      </b-field>
      <ul class="is-flex columns is-multiline is-mobile my-2" v-if="filteredNfts">
        <li class="column is-4-tablet is-6-mobile" v-for="(nft, i) of filteredNfts" :key="i">
          <div class="nft-image-container">
            <img
              class="nft-image is-clickable cover"
              @click="showDetail(nft)"
              v-if="getImageUrls(nft).length"
              :data-fallback="0"
              @error="fallBack($event, nft)"
              :src="getImageUrls(nft)[0]"
            />
            <p class="nft-name has-background-white-ter pt-2 pl-3 is-hidden-mobile">
              <span class="is-inline-block truncate" v-if="extraInfo[nft.address] && extraInfo[nft.address].metadata == null">{{
                "Unnamed"
              }}</span>
              <span class="is-inline-block truncate" v-else>{{
                extraInfo[nft.address] && extraInfo[nft.address].metadata ? extraInfo[nft.address].metadata.name : ""
              }}</span>
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
                  <a class="has-text-dark" :href="mintGardenUrl + nft.address" target="_blank">
                    <b-dropdown-item aria-role="listitem"
                      ><b-icon class="media-left" icon="open-in-new" size="is-small"></b-icon
                      >{{ $t("nftDetail.ui.dropdown.mintGarden") }}
                    </b-dropdown-item>
                  </a>
                  <a class="has-text-dark" @click="setAsProfilePic(nft.metadata.uri)">
                    <b-dropdown-item aria-role="listitem">
                      <b-icon class="media-left" icon="account-box" size="is-small"></b-icon
                      >{{ $t("nftDetail.ui.dropdown.setAsProfilePic") }}
                    </b-dropdown-item>
                  </a>
                  <a class="has-text-danger" @click="nftBurn(nft)">
                    <b-dropdown-item aria-role="listitem" class="has-text-danger">
                      <b-icon class="media-left" icon="trash-can-outline" size="is-small"></b-icon
                      >{{ $t("nftDetail.ui.dropdown.nftBurn") }}
                    </b-dropdown-item>
                  </a>
                </b-dropdown>
              </span>
            </p>
          </div>
        </li>
      </ul>
      <b-pagination
        :total="total"
        v-model="currentPage"
        :per-page="pageSize"
        icon-prev="chevron-left"
        icon-next="chevron-right"
        aria-next-label="Next page"
        aria-previous-label="Previous page"
        aria-page-label="Page"
        aria-current-label="Current page"
      >
      </b-pagination>
    </div>
  </section>
</template>
<script lang="ts">
import { AccountEntity } from "@/models/account";
import { Component, Vue, Watch } from "vue-property-decorator";
import store from "@/store";
import NftDetailPanel from "@/components/Nft/NftDetailPanel.vue";
import { isMobile } from "@/services/view/responsive";
import { DidDetail, NftDetail } from "@/services/crypto/receive";
import { DonwloadedNftCollection, NftOffChainMetadata } from "@/models/nft";
import utility from "@/services/crypto/utility";
import { unprefix0x } from "@/services/coin/condition";
import { getScalarString } from "@/services/coin/nft";
import { notifyPrimary } from "@/services/notification/notification";
import puzzle from "@/services/crypto/puzzle";
import { tc } from "@/i18n/i18n";
import { shorten } from "@/filters/addressConversion";
import NftTransfer from "./NftTransfer.vue";
import { bech32m } from "@scure/base";
import { createHash } from "crypto";

interface CollectionNfts {
  name: string;
  id: string;
  nftCollection: string;
  nfts: NftDetail[];
}

type CollectionDict = { [id: string]: CollectionNfts };
type Profile = "All" | "Unassigned" | "Single";
@Component({})
export default class NftPanel extends Vue {
  public isOpen: number | string = 0;
  public refreshing = false;
  profile: Profile = "All";
  selectedCol = "All";
  selectedColName = "All";
  selectedDid = "";
  currentPage = 1;
  total = 0;
  pageSize = 12;
  public mintGardenUrl = "https://mintgarden.io/nfts/";
  fallBackList = ["https://assets.spacescan.io/xch/img/nft/full/", "https://nft.dexie.space/preview/medium/"];

  get selectedAccount(): number {
    return store.state.account.selectedAccount;
  }

  get account(): AccountEntity {
    return store.state.account.accounts[this.selectedAccount] ?? {};
  }

  get collection(): CollectionDict {
    const other = "Other"; //i18n
    const col: CollectionDict = {};
    for (let i = 0; i < this.nfts.length; i++) {
      const nft = this.nfts[i];
      const ext = this.extraInfo[nft.address];
      nft.metadata.name = ext?.metadata?.name;
      const colname = ext?.metadata?.collection?.name ?? other;
      const colid = ext?.metadata?.collection?.id ?? other;
      const hash = createHash("sha256")
        .update(nft.analysis.launcherId + colid)
        .digest();
      const nftCollection = bech32m.encode("col", bech32m.toWords(hash));
      if (!col[colid]) {
        col[colid] = { name: colname, id: colid, nftCollection: nftCollection, nfts: [nft] };
      } else {
        col[colid].nfts.push(nft);
      }
    }
    return col;
  }

  get nfts(): NftDetail[] {
    return this.account.nfts ?? [];
  }

  get filteredNfts(): NftDetail[] {
    let nfts = this.nfts;
    if (this.selectedCol != "All") {
      nfts = this.collection[this.selectedCol].nfts;
    }
    if (this.profile == "Unassigned") {
      nfts = nfts.filter((nft) => !nft.analysis.didOwner || nft.analysis.didOwner.length < 10);
    } else if (this.profile == "Single") {
      const did = this.dids.find((d) => d.name == this.selectedDid);
      if (did) nfts = nfts.filter((nft) => puzzle.getAddressFromPuzzleHash(nft.analysis.didOwner, "did:chia:") == did.did);
    }
    this.total = nfts.length;
    nfts = nfts.slice((this.currentPage - 1) * this.pageSize, (this.currentPage - 1) * this.pageSize + this.pageSize);
    return nfts;
  }

  get dids(): DidDetail[] {
    return this.account.dids ?? [];
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

  get path(): string {
    return this.$route.path;
  }

  getImageUrls(nft: NftDetail): string[] {
    if (!nft.analysis.metadata.imageUri) return [];
    if (typeof nft.analysis.metadata.imageUri == "string") return [nft.analysis.metadata.imageUri];
    return nft.analysis.metadata.imageUri;
  }

  fallBack(event: Event, nft: NftDetail): void {
    const img = event.target as HTMLImageElement;
    let fallBackIndex = Number(img.getAttribute("data-fallback"));
    const imageUrls = this.getImageUrls(nft);
    let totalFallback = this.fallBackList.length + imageUrls.length;
    fallBackIndex++;
    img.dataset.fallback = fallBackIndex.toString();
    if (fallBackIndex > totalFallback) return;
    if (fallBackIndex == totalFallback) {
      img.src = "@/assets/nft-no-image.png";
    } else {
      if (fallBackIndex < imageUrls.length) img.src = imageUrls[fallBackIndex];
      else {
        if (img.src.endsWith(".gif")) img.src = this.fallBackList[fallBackIndex - imageUrls.length] + nft.address + ".gif";
        else img.src = this.fallBackList[fallBackIndex - imageUrls.length] + nft.address + ".webp";
      }
    }
  }

  shorten(name: string): string {
    return shorten(name);
  }

  getProfileName(profile: Profile): string {
    if (profile == "All") return tc("nftDetail.ui.profile.all");
    if (profile == "Unassigned") return tc("nftDetail.ui.profile.unassigned");
    return this.selectedDid;
  }

  setAsProfilePic(url: string): void {
    store.dispatch("setProfilePic", { idx: this.accountId, profilePic: url });
    notifyPrimary(this.$tc("common.message.saved"));
  }

  @Watch("networkId")
  onNetworkChange(): void {
    this.refresh();
  }

  @Watch("accountId")
  onAccountChange(): void {
    this.refresh();
  }

  @Watch("filteredNfts")
  downloadRelated(): void {
    for (let i = 0; i < this.filteredNfts.length; i++) {
      const nft = this.filteredNfts[i];
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
    const uri = getScalarString(nft.analysis.metadata.metadataUri);
    if (!uri) {
      this.extraInfo[nft.address].metadata = null;
      return;
    }
    // console.log("start download nft", nft.analysis.metadata.metadataUri);
    let bodyhex = "";
    try {
      const resp = await fetch(uri);
      const body = await resp.blob();
      bodyhex = utility.toHexString(await utility.purehash(await body.arrayBuffer()));
      const md = JSON.parse(await body.text()) as NftOffChainMetadata;
      this.extraInfo[nft.address].metadata = md;
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("cannot parse metadata", error);
      }
      this.extraInfo[nft.address].metadata = null;
    }
    // console.log("downloaded", bodyhex, nft.analysis.metadata.metadataHash, md);
    this.extraInfo[nft.address].status = "Processed";
    this.extraInfo[nft.address].matchHash = bodyhex.toLowerCase() == unprefix0x(nft.analysis.metadata.metadataHash).toLowerCase();
    Vue.set(this.account, "extraInfo", this.extraInfo);
  }

  async refresh(): Promise<void> {
    this.refreshing = true;
    try {
      await store.dispatch("refreshDids");
      await store.dispatch("refreshNfts");
    } catch (err) {
      console.warn(err);
    }
    this.refreshing = false;
  }

  nftBurn(nft: NftDetail): void {
    this.$buefy.modal.open({
      parent: this,
      component: NftTransfer,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: {
        title: tc("nftBurn.title"),
        descriptionText: tc("nftBurn.description"),
        confirmationText: tc("nftBurn.confirmation"),
        nft: nft,
        account: this.account,
        inputAddress: "xch1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqm6ks6e8mvy",
        addressEditable: false,
      },
    });
  }

  showDetail(nft: NftDetail): void {
    const metadata =
      this.extraInfo[nft.address] && this.extraInfo[nft.address].metadata ? this.extraInfo[nft.address].metadata : null;
    this.$router.push(`/home/nft/${nft.address}`);
    this.$buefy.modal.open({
      parent: this,
      component: NftDetailPanel,
      hasModalCard: true,
      trapFocus: true,
      width: 1000,
      onCancel: () => {
        if (this.path != "/home/nft") this.$router.back();
      },
      fullScreen: isMobile(),
      canCancel: ["outside", "escape"],
      props: { nft: nft, inputMetadata: metadata, account: this.account, dids: this.dids },
      events: {
        close: () => {
          if (this.path != "/home/nft") this.$router.back();
        },
      },
    });
  }

  mounted(): void {
    this.refresh();
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
}

:root.dark-theme {
  .cover {
    object-fit: cover;
    aspect-ratio: 1 / 1;
    width: 100%;
  }
}
</style>
