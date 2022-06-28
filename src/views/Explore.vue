<template>
  <div class="explore-container">
    <p class="is-hidden-tablet has-text-centered is-size-5 pt-5 pb-2 pr-2 border-bottom">{{ $t("explore.title") }}</p>
    <p class="is-hidden-mobile has-text-left is-size-5 pt-5 pb-2 pl-2 border-bottom">{{ $t("explore.title") }}</p>
    <section class="modal-card-body">
      <b-field :label="$t('explore.label.dapps')" class="mb-2">
        <dapp :account="account" :tokenList="tokenList"></dapp>
      </b-field>
      <div>
        <label class="label mt-6">{{ $t("explore.label.popular") }}</label>
        <div class="mb-2">
          <div class="media">
            <div class="media-left">
              <figure class="image is-48x48">
                <img
                  src="https://images.taildatabase.com/tails/3a6a6ba8-bade-4eb9-8c3e-f1142c7fa80e.jpeg"
                  alt="Placeholder image"
                />
              </figure>
            </div>
            <div class="media-content">
              <p class="title is-6">NFT Name</p>
              <p class="subtitle is-7">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </div>
          </div>
        </div>
        <div class="is-block">
          <div class="media">
            <div class="media-left">
              <figure class="image is-48x48">
                <img
                  src="https://images.taildatabase.com/tails/3a6a6ba8-bade-4eb9-8c3e-f1142c7fa80e.jpeg"
                  alt="Placeholder image"
                />
              </figure>
            </div>
            <div class="media-content">
              <p class="title is-6">NFT Name</p>
              <p class="subtitle is-7">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
<script lang="ts">
import { AccountEntity, CustomCat, getAllCats } from "@/store/modules/account";
import { Component, Vue } from "vue-property-decorator";
import store from "@/store";
import Dapp from "@/components/Explore/Dapp.vue";

@Component({
  components: { Dapp },
})
export default class Explore extends Vue {
  get account(): AccountEntity {
    return store.state.account.accounts[store.state.account.selectedAccount] ?? {};
  }

  get tokenList(): CustomCat[] {
    return getAllCats(this.account);
  }
}
</script>
<style lang="scss">
.border-bottom {
  border-bottom: 2px solid #ededed;
}

.explore-container {
  max-width: 700px;
  margin: auto;
}
</style>
