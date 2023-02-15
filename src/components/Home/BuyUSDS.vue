<template>
  <div class="modal-card margin-auto">
    <top-bar :title="$t('buyUsds.ui.title')" @close="back()" :showClose="true"></top-bar>
    <section class="modal-card-body has-text-centered">
      <div v-if="!showFrame">
        <b-field>
          <p class="has-text-left">{{ $t("buyUsds.ui.tip") }}</p>
        </b-field>
        <!-- <b-field>
          <b-button type="is-primary" expanded icon-right="chevron-double-right" @click="showFrame = true">{{
            $t("buyUsds.ui.button.continue")
          }}</b-button>
        </b-field>-->
        <b-field>
          <a href="https://ramp.stably.io/?network=chia&asset=USDS&filter=true&integrationId=frodo-13897464" target="_blank">
            <b-button type="is-link" expanded icon-right="open-in-new">{{ $t("buyUsds.ui.button.stably") }}</b-button>
          </a>
        </b-field>
      </div>
      <div v-if="showFrame">
        <iframe
          src="https://ramp.stably.io/?network=chia&asset=USDS&filter=true&integrationId=frodo-13897464"
          title="Buy USDS"
          class="stably"
        ></iframe>
      </div>
      <p class="mt-6 pt-6 has-text-grey is-size-7">
        {{ $t("buyUsds.ui.stablyPrefix") }}
        <a href="https://www.stably.io/" target="_blank"
          ><u> {{ $t("buyUsds.ui.stably") }} <i class="mdi mdi-open-in-new"></i></u></a
        >{{ $t("buyUsds.ui.stablySuffix") }}
      </p>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Emit, Watch } from "vue-property-decorator";
import TopBar from "@/components/Common/TopBar.vue";

@Component({
  components: {
    TopBar,
  },
})
export default class BuyUSDS extends Vue {
  showFrame = false;

  @Watch("path")
  onPathChange(): void {
    this.close();
  }

  @Emit("close")
  close(): void {
    return;
  }

  back(): void {
    if (this.showFrame) this.showFrame = false;
    else this.close();
  }
}
</script>
<style scoped lang="scss">
.stably {
  min-width: 400px;
  min-height: 680px;
  margin: auto;
}
</style>
