<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <!-- <p class="modal-card-title">{{ $t("send.ui.title.send") }}</p> -->
      <p class="modal-card-title">Nft Detail</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <!-- <b-field custom-class="is-medium has-text-weight-normal" :label="$t('utxoDetail.ui.label.confirmedHeight')"> -->
      <b-field custom-class="is-medium has-text-weight-normal" :label="'image'">
        <b-image :src="nft.metadata.uri" :alt="nft.metadata.uri" class="image-preview"></b-image>
      </b-field>
      <b-field custom-class="is-medium has-text-weight-normal" :label="'hash'">
        <p class="has-text-grey">{{ nft.metadata.hash }}</p>
      </b-field>
      <b-field custom-class="is-medium has-text-weight-normal" :label="'nft'">
        <p class="has-text-grey">
          {{ nftAddress }}
          <key-box
            icon="checkbox-multiple-blank-outline"
            :tooltip="$t('accountExport.ui.tooltip.copy')"
            :value="nftAddress"
            :showValue="false"
          ></key-box>
        </p>
        <a class="is-pulled-right" target="_blank" :href="'https://www.spacescan.io/txch10/nft/' + nftAddress">⚓</a>
      </b-field>
      <b-field custom-class="is-medium has-text-weight-normal" :label="'coin'">
        <p class="has-text-grey">
          {{ coinname }}
          <key-box
            icon="checkbox-multiple-blank-outline"
            :tooltip="$t('accountExport.ui.tooltip.copy')"
            :value="coinname"
            :showValue="false"
          ></key-box>
        </p>
        <a class="is-pulled-right" target="_blank" :href="'https://www.spacescan.io/txch10/coin/' + coinname">⚓</a>
      </b-field>
      <b-field custom-class="is-medium has-text-weight-normal" :label="'owner'">
        <p class="has-text-grey">
          {{ owner }}
          <key-box
            icon="checkbox-multiple-blank-outline"
            :tooltip="$t('accountExport.ui.tooltip.copy')"
            :value="owner"
            :showValue="false"
          ></key-box>
        </p>
        <a class="is-pulled-right" target="_blank" :href="'https://www.spacescan.io/txch10/address/' + owner">⚓</a>
      </b-field>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <div>
        <b-button :label="$t('send.ui.button.cancel')" @click="close()"></b-button>
      </div>
      <div>
        <!-- :label="$t('send.ui.button.submit')" -->
        <b-button :label="'Transfer'" type="is-primary" class="is-pulled-right" @click="transfer()"></b-button>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { demojo } from "@/filters/unitConversion";
import { getCoinName } from "@/services/coin/nft";
import puzzle from "@/services/crypto/puzzle";
import { NftDetail } from "@/services/crypto/receive";
import utility from "@/services/crypto/utility";
import { AccountEntity } from "@/store/modules/account";
import { xchPrefix } from "@/store/modules/network";
import { bech32m } from "@scure/base";
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import KeyBox from "../KeyBox.vue";
import NftTransfer from "./NftTransfer.vue";

@Component({
  components: {
    KeyBox,
  },
  filters: { demojo },
})
export default class NftDetailPanel extends Vue {
  @Prop() private account!: AccountEntity;
  @Prop() private nft!: NftDetail;

  @Emit("close")
  close(): void {
    return;
  }

  get nftAddress(): string {
    if (!this.nft?.analysis.launcherId) return "";
    const nftPrefix = "nft";
    return bech32m.encode(nftPrefix, bech32m.toWords(utility.fromHexString(this.nft.analysis.launcherId)), false);
  }

  get coinname(): string {
    return getCoinName(this.nft.coin);
  }

  get owner(): string {
    return puzzle.getAddressFromPuzzleHash(this.nft.coin.puzzle_hash, xchPrefix());
  }

  transfer(): void {
    this.$buefy.modal.open({
      parent: this,
      component: NftTransfer,
      hasModalCard: true,
      trapFocus: true,
      canCancel: ["x"],
      props: { nft: this.nft, account: this.account },
    });
  }
}
</script>
<style scoped lang="scss">
.long-text-wrapper {
  overflow-wrap: break-word !important;
}
.image-preview ::v-deep img {
  width: 100%;
  max-height: 70vh;
  object-fit: cover;
  border: 1px solid;
}
</style>
