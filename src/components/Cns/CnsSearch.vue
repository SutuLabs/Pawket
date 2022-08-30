<template>
  <div :class="{ 'modal-card': true, 'min-width-table': !isMobile }">
    <top-bar title="Search" :showClose="true" @close="close()"></top-bar>
    <section class="modal-card-body">
      <b-field>
        <template #label>
          Domain Search<b-tooltip
            label="Please enter 4~40 characters consisting of letters (case-insensitive), numbers and hyphens"
            position="is-bottom"
            multilined
            ><b-icon icon="help-circle" size="is-small" class="pl-2"></b-icon
          ></b-tooltip>
        </template>
        <b-input
          placeholder="Search"
          type="search"
          :maxlength="40"
          :minlength="4"
          icon-right="magnify"
          icon-right-clickable
          @icon-right-click="search"
          v-model="searchStr"
          @keyup.native.enter="search"
        >
        </b-input>
      </b-field>
      <p v-if="result" class="pb-4">
        <span class="is-pulled-right" v-if="result.status == 'Available'"
          ><b-icon icon="check-circle" type="is-primary" size="is-small"></b-icon>AVAILABLE</span
        >
        <span class="is-pulled-right" v-if="result.status == 'Unavailable'"
          ><b-icon icon="close-circle" type="is-danger" size="is-small"></b-icon>NOT AVAILABLE</span
        >
        <span class="is-pulled-right" v-if="result.status == 'Registering'"
          ><b-icon icon="dots-horizontal-circle" class="has-text-grey-light" size="is-small"></b-icon>REGISTERING</span
        >
      </p>
      <hr />
      <div v-if="result">
        <p class="has-text-grey">Result:</p>
        <p v-if="result.domainName">
          Domain Name: <span class="is-pulled-right">{{ result.domainName }}</span>
        </p>
        <p v-if="result.address">
          Address:
          <span class="is-pulled-right"
            ><b-tag v-if="result.status == 'Registering'" class="has-background-grey-light mr-2">Pending</b-tag>
            <key-box icon="checkbox-multiple-blank-outline" :value="result.address" :showValue="true"></key-box
          ></span>
        </p>
        <p v-if="result.price">
          Price: <span class="is-pulled-right">{{ result.price }} XCH</span>
        </p>
        <p v-if="result.status == 'Unavailable'">Expiration Time: <span class="is-pulled-right">2022.08.08 at 9:41(UTC)</span></p>
        <div class="pt-5" v-if="result.status == 'Available'">
          <b-button expanded outlined type="is-primary" @click="buy()">Buy it Now</b-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { AccountEntity } from "@/models/account";
import { CnsDetail } from "@/services/crypto/receive";
import { isMobile } from "@/services/view/responsive";
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import TopBar from "@/components/Common/TopBar.vue";
import BuyCns from "@/components/Cns/BuyCns.vue";

export type CnsStatus = "Available" | "Registering" | "Unavailable";

export type CnsResult = {
  domainName: string;
  address?: string;
  price?: number;
  status: CnsStatus;
};

@Component({
  components: {
    TopBar,
    KeyBox,
  },
})
export default class CnsSearch extends Vue {
  public searchStr = "";
  public result: CnsResult | null = null;
  @Prop() public cns!: CnsDetail;
  @Prop() public account!: AccountEntity;

  @Emit("close")
  close(): void {
    return;
  }

  get isMobile(): boolean {
    return isMobile();
  }

  get cnses(): CnsResult[] {
    return [
      { domainName: "cns1", status: "Available", price: 100 },
      { domainName: "cns2", status: "Registering", address: "yyyy" },
      { domainName: "cns3", status: "Unavailable", address: "xxxx" },
    ];
  }

  search(): void {
    this.result = null;
    const idx = this.cnses.findIndex((cnses) => cnses.domainName == this.searchStr);
    if (idx > -1) this.result = this.cnses[idx];
  }

  buy(): void {
    this.$buefy.modal.open({
      parent: this,
      component: BuyCns,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: { cns: this.cns, domainName: this.result?.domainName, account: this.account },
    });
  }
}
</script>
<style scoped lang="scss"></style>
