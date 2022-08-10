<template>
  <div class="box">
    <top-bar title="Search Result" :showBack="true" @close="close()"></top-bar>
    <section class="modal-card-body">
      <div class="columns is-multiline">
        <div class="column is-6">
          <span
            @click="
              preview(
                'https:/github.com/nongyehezuoshe/bshn/raw/main/nft/2022731/1575fdbff2821c6e0d8f6bd4a5850e6e5d4bf93e00e037d70f83e466d8e86012.png'
              )
            "
            ><b-image
              src="https:/github.com/nongyehezuoshe/bshn/raw/main/nft/2022731/1575fdbff2821c6e0d8f6bd4a5850e6e5d4bf93e00e037d70f83e466d8e86012.png"
              alt="A random image"
              ratio="6by4"
            ></b-image
          ></span>
        </div>
        <div class="column is-6">
          <p class="pt-3">
            <span class="is-size-4 pr-2">{{ cnsResult.domainName }}</span>
            <span class="has-text-primary is-size-7" v-if="cnsResult.status == 'Available'"
              ><b-icon icon="check-circle" size="is-small"></b-icon>AVAILABLE</span
            >
            <span class="has-text-danger is-size-7" v-if="cnsResult.status == 'Unavailable'"
              ><b-icon icon="close-circle" size="is-small"></b-icon>NOT AVAILABLE</span
            >
            <span class="has-text-grey-light is-size-7" v-if="cnsResult.status == 'Registering'">
              <b-icon icon="dots-horizontal-circle" size="is-small" class="pr-2"></b-icon>REGISTERING
            </span>
          </p>
          <p class="pt-3 has-text-grey" v-if="cnsResult.price">
            <span class="has-text-grey pr-2">Price:</span
            ><span class="is-pulled-right has-text-dark">{{ cnsResult.price }} XCH</span>
          </p>
          <p class="pt-3 has-text-grey" v-if="cnsResult.address">
            Address:<span class="is-pulled-right has-text-dark"
              ><key-box icon="checkbox-multiple-blank-outline" :value="cnsResult.address" :showValue="true"></key-box
            ></span>
          </p>
          <p class="pt-3 has-text-grey" v-if="cnsResult.status == 'Unavailable'">
            Expiration Time: <span class="is-pulled-right has-text-dark">2022.08.08 at 9:41(UTC)</span>
          </p>
          <div class="pt-6 mt-6" v-if="cnsResult.status == 'Available'">
            <b-button expanded outlined type="is-primary" @click="buy()">Buy it Now</b-button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { demojo } from "@/filters/unitConversion";
import { AccountEntity } from "@/models/account";
import { CnsDetail } from "@/services/crypto/receive";
import { isMobile } from "@/services/view/responsive";
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import KeyBox from "../KeyBox.vue";
import TopBar from "../TopBar.vue";
import BuyCns from "./BuyCns.vue";
import { CnsResult } from "./CnsSearch.vue";

@Component({
  components: {
    KeyBox,
    TopBar,
  },
  filters: { demojo },
})
export default class CnsDesktopDetail extends Vue {
  @Prop() cnsResult!: CnsResult;
  @Prop() public cns!: CnsDetail;
  @Prop() public account!: AccountEntity;

  @Emit("close")
  close(): void {
    return;
  }

  get isMobile(): boolean {
    return isMobile();
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

  buy(): void {
    this.$buefy.modal.open({
      parent: this,
      component: BuyCns,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: { cns: this.cns, domainName: this.cnsResult?.domainName, account: this.account },
    });
  }
}
</script>
<style scoped lang="scss">
</style>
