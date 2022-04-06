<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("explorerLink.ui.title.link") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <div class="columns is-mobile">
        <div class="column is-one-third">
          <b-menu>
            <b-menu-list :label="$t('explorerLink.ui.label.address')">
              <b-menu-item
                v-for="addr in token.addresses"
                icon="map-marker"
                :key="addr.address"
                :active="address == addr.address"
                @click="address = addr.address"
              >
                <template #label>
                  {{ addr.address | shorten }}
                  [{{ addr.coins.filter((_) => _.coin && !_.spent).length }}]
                </template>
              </b-menu-item>
            </b-menu-list>
          </b-menu>
        </div>

        <div class="column has-text-centered">
          <qrcode-vue class="is-hidden-touch" :value="externalExplorerPrefix + address" size="300"></qrcode-vue>
          <qrcode-vue
            class="is-hidden-mobile is-hidden-desktop"
            :value="externalExplorerPrefix + address"
            size="200"
          ></qrcode-vue>
          <qrcode-vue class="is-hidden-tablet" :value="externalExplorerPrefix + address" size="100"></qrcode-vue>
          <key-box :value="address"></key-box>
          <b-tooltip :label="$t('explorerLink.ui.tooltip.blockchainExplorer')">
            <a target="_blank" :href="externalExplorerPrefix + address">
              <b-icon icon="web" size="is-small"></b-icon>
            </a>
          </b-tooltip>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import store from "@/store/index";
import { AccountEntity, AccountToken } from "@/store/modules/account";
import KeyBox from "@/components/KeyBox.vue";
import QrcodeVue from "qrcode.vue";
import { shorten } from "@/filters/addressConversion";

@Component({
  components: {
    KeyBox,
    QrcodeVue,
  },
  filters: { shorten },
})
export default class ExplorerLink extends Vue {
  @Prop() private account!: AccountEntity;
  @Prop() private token!: AccountToken;
  public address = "";

  get externalExplorerPrefix(): string {
    return store.state.app.externalExplorerPrefix;
  }

  mounted(): void {
    Vue.set(this, "address", this.token.addresses[0].address);
  }

  @Emit("close")
  close(): void {
    return;
  }
}
</script>

<style scoped lang="scss"></style>
