<template>
  <div class="modal-card">
    <top-bar :title="$t('settings.donation.title')" @close="$emit('close')"></top-bar>
    <section class="modal-card-body">
      <send
        :account="account"
        :inputAddress="donationAddress"
        :addressEditable="false"
        :notificationMessage="$tc('accountDetail.message.notification.donate')"
        notificationIcon="hand-heart"
        :notificationClosable="false"
        @close="$emit('close')"
      ></send>
    </section>
  </div>
</template>

<script lang="ts">
import puzzle from "@/services/crypto/puzzle";
import store from "@/store";
import { AccountEntity } from "@/store/modules/account";
import { xchPrefix } from "@/store/modules/network";
import { Component, Vue } from "vue-property-decorator";
import Send from "../Send.vue";
import TopBar from "../TopBar.vue";

@Component({
  components: {
    Send,
    TopBar
  },
})
export default class Donate extends Vue {
  get account(): AccountEntity {
    return store.state.account.accounts[store.state.account.selectedAccount] ?? {};
  }

  get donationAddress(): string {
    return puzzle.getAddressFromPuzzleHash("d19c05a54dacbf2b40ff4843534c47976de90246c3fc42ac1f42ea81b434b8ea", xchPrefix());
  }
}
</script>

<style scoped lang="scss">
</style>
