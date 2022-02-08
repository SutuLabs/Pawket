<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Links</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <div class="columns is-mobile">
        <div class="column is-one-third">
          <b-menu>
            <b-menu-list label="Address">
              <b-menu-item
                v-for="addr in token.addresses"
                icon="address"
                :label="addr.slice(0, 9) + '...'"
                :key="addr"
                :active="address == addr"
                @click="address = addr"
              ></b-menu-item>
            </b-menu-list>
          </b-menu>
        </div>

        <div class="column has-text-centered">
          <qrcode-vue class="is-hidden-touch" :value="externalExplorerPrefix + address" size="300"></qrcode-vue>
          <qrcode-vue class="is-hidden-mobile is-hidden-desktop" :value="externalExplorerPrefix + address" size="200"></qrcode-vue>
          <qrcode-vue class="is-hidden-tablet" :value="externalExplorerPrefix + address" size="100"></qrcode-vue>
          <key-box :value="address"></key-box>
          <a target="_blank" :href="externalExplorerPrefix + address">⚓</a>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import store from "@/store/index";
import { Account, AccountToken } from "@/store/modules/account";
import KeyBox from "@/components/KeyBox.vue";
import QrcodeVue from "qrcode.vue";

@Component({
  components: {
    KeyBox,
    QrcodeVue,
  },
})
export default class ExplorerLink extends Vue {
  @Prop() private account!: Account;
  @Prop() private token!: AccountToken;
  public address = "";

  get externalExplorerPrefix(): string {
    return store.state.app.externalExplorerPrefix;
  }

  mounted(): void {
    // this.address = this.token.addresses[0];
    Vue.set(this, "address", this.token.addresses[0]);
  }

  @Emit("close")
  close(): void {
    return;
  }
}
</script>

<style scoped lang="scss"></style>
