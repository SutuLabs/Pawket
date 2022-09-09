<template>
  <send
    :account="account"
    :title="$t('settings.about.links.label.donate')"
    :showClose="showClose"
    :inputAddress="donationAddress"
    :addressEditable="false"
    :notificationMessage="$tc('accountDetail.message.notification.donate')"
    notificationIcon="hand-heart"
    :notificationClosable="false"
    @close="$emit('close')"
  ></send>
</template>

<script lang="ts">
import puzzle from "@/services/crypto/puzzle";
import store from "@/store";
import { AccountEntity } from "@/models/account";
import { xchPrefix } from "@/store/modules/network";
import { Component, Prop, Vue } from "vue-property-decorator";
import Send from "@/components/Send/Send.vue";
import TopBar from "@/components/Common/TopBar.vue";

@Component({
  components: {
    Send,
    TopBar,
  },
})
export default class Donate extends Vue {
  @Prop({ default: true }) public showClose!: boolean;

  get account(): AccountEntity {
    return store.state.account.accounts[store.state.account.selectedAccount] ?? {};
  }

  get donationAddress(): string {
    return puzzle.getAddressFromPuzzleHash("d19c05a54dacbf2b40ff4843534c47976de90246c3fc42ac1f42ea81b434b8ea", xchPrefix());
  }
}
</script>

<style scoped lang="scss"></style>
