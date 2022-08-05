<template>
  <div class="column nav-box">
    <div :class="{ box: !isMobile, 'pt-8': isMobile }">
      <p class="is-hidden-tablet has-text-centered is-size-5 pt-5 pb-2 pr-2 border-bottom fixed-top">{{ $t("cns.title") }}</p>
      <div class="is-hidden-mobile has-text-left is-size-5 pl-2 border-bottom columns">
        <div class="column is-2">{{ $t("cns.title") }}</div>
        <div class="column is-offset-7">
          <b-dropdown :triggers="[]" ref="searchBar">
            <template #trigger>
              <b-input
                placeholder="Search"
                type="search"
                icon-right="magnify"
                icon-right-clickable
                :maxlength="40"
                :minlength="4"
                @icon-right-click="searchCns"
                v-model="searchStr"
                @keyup.native.enter="searchCns"
              >
              </b-input>
            </template>
            <p class="is-size-6 has-text-grey pl-2">Your CNS</p>
            <p class="is-size-5 pl-4">cns1.chia</p>
            <div v-if="result" class="pt-4">
              <p class="is-size-6 has-text-grey pl-2">Search Result</p>
              <b-dropdown-item @click="CnsDesktopDetail(result)">
                <p class="is-size-5 is-clickable">
                  {{ result.domainName }}
                  <b-icon v-if="result.status == 'Available'" icon="check-circle" type="is-primary" size="is-small"></b-icon>
                  <b-icon v-if="result.status == 'Unavailable'" icon="close-circle" type="is-danger" size="is-small"></b-icon>
                  <b-icon
                    v-if="result.status == 'Registering'"
                    icon="dots-horizontal-circle"
                    type="is-warning"
                    size="is-small"
                  ></b-icon>
                </p>
              </b-dropdown-item>
            </div>
          </b-dropdown>
        </div>
      </div>
      <div>
        <p class="is-size-5 py-2">Your CNS</p>
        <ul class="is-flex columns is-multiline is-mobile is-vcentered" v-if="cnses">
          <li class="column is-4-tablet is-6-mobile" v-for="(cns, i) of cnses" :key="i">
            <div class="nft-image-container">
              <img class="nft-image is-clickable" :src="cns.metadata.uri" :alt="cns.metadata.hash" @click="showDetail(cns)" />
              <p class="nft-name has-background-white-ter pt-2 pl-3">
                <span class="is-inline-block truncate">hann.chia</span>
                <span class="is-pulled-right">
                  <b-dropdown aria-role="list" class="is-pulled-right" :mobile-modal="false" position="is-bottom-left">
                    <template #trigger>
                      <b-icon icon="dots-vertical" class="is-clickable"></b-icon>
                    </template>
                    <a class="has-text-dark" :href="spaceScanUrl + cns.address" target="_blank">
                      <b-dropdown-item aria-role="listitem"
                        ><b-icon class="media-left" icon="open-in-new" size="is-small"></b-icon
                        >{{ $t("nftDetail.ui.dropdown.spaceScan") }}
                      </b-dropdown-item>
                    </a>
                    <a class="has-text-dark" @click="crossOriginDownload(cns.metadata.uri, cns.metadata.name)">
                      <b-dropdown-item aria-role="listitem">
                        <b-icon class="media-left" icon="download" size="is-small"></b-icon
                        >{{ $t("nftDetail.ui.dropdown.download") }}
                      </b-dropdown-item>
                    </a>
                  </b-dropdown>
                </span>
              </p>
            </div>
          </li>
          <li class="column is-6-mobile is-hidden-tablet">
            <div class="has-background-grey-lighter has-text-centered box-1by1" @click="search()">
              <div class="center">
                <div class="is-block">
                  <b-icon icon="plus" size="is-large"></b-icon>
                  <p>Get a New Chia Domain Name</p>
                </div>
              </div>
            </div>
          </li>
        </ul>
        <div v-if="!cnses.length" style="min-height: 200px" class="is-hidden-mobile has-text-grey pt-4 is-size-5">
          No Chia Domain Name Here. Search to Get One.
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import CnsDesktopDetail from "@/components/Cns/cnsDesktopDetail.vue";
import CnsDetailPanel from "@/components/Cns/cnsDetail.vue";
import CnsSearch, { CnsResult } from "@/components/Cns/cnsSearch.vue";
import { AccountEntity } from "@/models/account";
import { crossOriginDownload } from "@/services/api/crossOriginDownload";
import { CnsDetail } from "@/services/crypto/receive";
import { isMobile } from "@/services/view/responsive";
import store from "@/store";
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Cns extends Vue {
  public searchStr = "";
  public result: CnsResult | null = null;

  get isMobile(): boolean {
    return isMobile();
  }

  get selectedAccount(): number {
    return store.state.account.selectedAccount;
  }

  get account(): AccountEntity {
    return store.state.account.accounts[this.selectedAccount] ?? {};
  }

  get cnses(): CnsDetail[] {
    return this.account.nfts ?? [];
  }

  get spaceScanUrl(): string {
    return store.state.network.network.spaceScanUrl;
  }

  get cnsList(): CnsResult[] {
    return [
      { domainName: "cns1", status: "Available", price: 100 },
      { domainName: "cns2", status: "Registering", address: "yyyy" },
      { domainName: "cns3", status: "Unavailable", address: "xxxx" }
    ]
  }

  async crossOriginDownload(url: string, filename: string | undefined): Promise<void> {
    const name = filename ?? "untitled";
    return crossOriginDownload(url, name);
  }

  searchCns(): void {
    this.result = null;
    const idx = this.cnsList.findIndex(cnses => cnses.domainName == this.searchStr);
    if (idx > -1) {
      this.result = this.cnsList[idx];
      (this.$refs.searchBar as Vue & { toggle: () => void }).toggle();
    }
  }

  showDetail(cns: CnsDetail): void {
    this.$buefy.modal.open({
      parent: this,
      component: CnsDetailPanel,
      hasModalCard: true,
      trapFocus: true,
      width: 1000,
      fullScreen: isMobile(),
      canCancel: ["outside"],
      props: { cns: cns, account: this.account },
    });
  }

  search(): void {
    this.$buefy.modal.open({
      parent: this,
      component: CnsSearch,
      hasModalCard: true,
      trapFocus: true,
      width: 1000,
      fullScreen: isMobile(),
      canCancel: ["outside"],
      props: { cns: this.cnses[0], account: this.account },
    });
  }

  CnsDesktopDetail(result: CnsResult): void {
    this.$buefy.modal.open({
      parent: this,
      component: CnsDesktopDetail,
      hasModalCard: true,
      trapFocus: true,
      width: 1000,
      fullScreen: isMobile(),
      canCancel: ["outside"],
      props: { cnsResult: result, cns: this.cnses[0], account: this.account },
    });
  }
}
</script>
<style scoped lang="scss">
@import "@/styles/topbar.scss";

.nav-box {
  max-width: 1000px;
  margin: auto;
}

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

.truncate {
  width: 80%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.box-1by1 {
  aspect-ratio: 1 / 1;
}

.center {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>
