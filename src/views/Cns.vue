<template>
  <div class="column nav-box">
    <div :class="{ box: !isMobile, 'pt-8': isMobile }">
      <p class="is-hidden-tablet has-text-centered is-size-5 pt-5 pb-2 pr-2 border-bottom fixed-top">{{ $t("cns.title") }}</p>
      <p class="is-hidden-mobile has-text-left is-size-5 pb-2 pl-2 border-bottom">{{ $t("cns.title") }}</p>
      <div>
        <ul class="is-flex columns is-multiline is-mobile my-2" v-if="cnses">
          <li class="column is-4-tablet is-6-mobile" v-for="(cns, i) of cnses" :key="i">
            <div class="nft-image-container">
              <img class="nft-image is-clickable" :src="cns.metadata.uri" :alt="cns.metadata.hash" @click="showDetail(cns)" />
              <p class="nft-name has-background-white-ter pt-2 pl-3 is-hidden-mobile">
                <span class="is-inline-block truncate">{{ cns.metadata.name }}</span>
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
                    <a class="has-text-dark" @click="crossOriginDownload(cns.analysis.metadata.imageUri, cns.metadata.name)">
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
        </ul>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { AccountEntity } from "@/models/account";
import { CnsDetail } from "@/services/crypto/receive";
import { isMobile } from "@/services/view/responsive";
import store from "@/store";
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Settings extends Vue {
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
  width: 90%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
