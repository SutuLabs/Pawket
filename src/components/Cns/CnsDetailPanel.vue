<template>
  <div class="modal-card">
    <top-bar title="hann.chia" :showClose="true" @close="close()"></top-bar>
    <section class="modal-card-body">
      <div class="columns is-mobile is-multiline">
        <div class="column is-6-tablet is-12-mobile">
          <span @click="preview(cns.metadata.uri)"
            ><b-image :src="cns.metadata.uri" alt="A random image" ratio="6by4"></b-image
          ></span>
        </div>
        <div class="column is-6-tablet is-12-mobile">
          <b-field>
            <template #label>
              <span class="word-break">hann.chia</span>
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
                    <b-icon class="media-left" icon="download" size="is-small"></b-icon>{{ $t("nftDetail.ui.dropdown.download") }}
                  </b-dropdown-item>
                </a>
              </b-dropdown>
            </template>
            {{ $t("nftDetail.ui.label.nftId") }}
            <key-box icon="checkbox-multiple-blank-outline" :value="cns.address" :showValue="true"></key-box>
          </b-field>
          <b-field label="Collection"> CNS </b-field>
          <b-field>
            <template #label>
              Address <a @click="changeAddress"><b-icon icon="pencil" size="is-small" class="pl-2"></b-icon></a>
            </template>
            <span class="word-break"
              >{{ address }} <key-box icon="checkbox-multiple-blank-outline" :value="address" :showValue="false"></key-box
            ></span>
          </b-field>
          <b-field label="Expiration Time:"> 2022.08.08 at 9:41(UTC) </b-field>
          <div class="buttons is-hidden-mobile">
            <b-button
              :label="$t('nftDetail.ui.button.transfer')"
              type="is-primary"
              @click="transfer()"
              icon-left="share"
              :disabled="this.account.type == 'Address'"
              outlined
            ></b-button>
            <b-button
              :label="$t('nftDetail.ui.button.makeOffer')"
              type="is-info"
              @click="offer()"
              icon-left="email-send-outline"
              outlined
              :disabled="this.account.type == 'Address'"
            ></b-button>
          </div>
        </div>
      </div>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between is-block is-hidden-tablet">
      <div class="buttons is-pulled-right">
        <b-button
          :label="$t('nftDetail.ui.button.transfer')"
          type="is-primary"
          @click="transfer()"
          icon-left="share"
          :disabled="this.account.type == 'Address'"
          outlined
        ></b-button>
        <b-button
          :label="$t('nftDetail.ui.button.makeOffer')"
          type="is-info"
          @click="offer()"
          icon-left="email-send-outline"
          outlined
          disabled
        ></b-button>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { demojo } from "@/filters/unitConversion";
import { isMobile } from "@/services/view/responsive";
import { AccountEntity } from "@/models/account";
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import TopBar from "@/components/Common/TopBar.vue";
import NftOffer from "@/components/Nft/NftOffer.vue";
import NftTransfer from "@/components/Nft/NftTransfer.vue";
import { CnsDetail } from "@/services/crypto/receive";
import store from "@/store";
import CnsNewAddress from "@/components/Cns/CnsNewAddress.vue";
import { crossOriginDownload } from "@/services/api/crossOriginDownload";

@Component({
  components: {
    KeyBox,
    TopBar,
  },
  filters: { demojo },
})
export default class CnsDetailPanel extends Vue {
  @Prop() private account!: AccountEntity;
  @Prop() public cns!: CnsDetail;

  address = "xch1xxxsssssjfoiej"


  @Emit("close")
  close(): void {
    return;
  }

  get isMobile(): boolean {
    return isMobile();
  }

  get spaceScanUrl(): string {
    return store.state.network.network.spaceScanUrl;
  }

  async crossOriginDownload(url: string, filename: string | undefined): Promise<void> {
    const name = filename ?? "untitled";
    return crossOriginDownload(url, name);
  }

  updateAddress(value: string): void {
    this.address = value;
  }

  changeAddress(): void {
    this.$buefy.modal.open({
      parent: this,
      component: CnsNewAddress,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { defaultAddress: this.address },
      events: { updateAddress: this.updateAddress }
    });
    return;
  }

  transfer(): void {
    this.$buefy.modal.open({
      parent: this,
      component: NftTransfer,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: { nft: this.cns, account: this.account },
    });
  }

  offer(): void {
    this.$buefy.modal.open({
      parent: this,
      component: NftOffer,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: { nft: this.cns, account: this.account },
    });
  }

  preview(uri: string): void {
    this.$buefy.modal.open({
      parent: this,
      content: `<div class='modal-card'><img src="${uri}"></div>`,
      hasModalCard: true,
      trapFocus: true,
      props: {},
    });
  }
}
</script>
<style scoped lang="scss">
.word-break {
  word-break: break-all;
}
</style>
