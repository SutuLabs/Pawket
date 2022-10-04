<template>
  <div class="gallery">
    <div class="container content-wrapper">
      <div v-if="gallery.gallery" class="columns is-multiline">
        <div v-for="(item, i) of gallery.gallery" :key="i" class="column is-4-desktop is-3-widescreen is-half-tablet">
          <div class="card">
            <header class="card-header">
              <p class="card-header-title">
                <span :title="item.description">{{ item.name }}</span>
                <span class="is-pulled-right">
                  <!-- <a href="">
                    <span class="tag is-default is-primary" title="Version">v0.0</span>
                  </a>
                  <span class="tag is-default is-info"
                    ><b-icon icon="desktop-mac" size="is-small" title=""></b-icon
                  ></span> -->
                </span>
              </p>
            </header>
            <div class="card-content">
              <figure class="image">
                <a v-if="item.bundle" href="javascript:void(0)" @click="item.bundle && inspect(item.bundle)">
                  <img :src="item.image" alt="screenshot" />
                </a>
                <img v-else :src="item.image" alt="screenshot" />
              </figure>
            </div>
            <footer class="card-footer">
              <a
                href="javascript:void(0)"
                class="card-footer-item"
                :disabled="!item.bundle"
                @click="item.bundle && inspect(item.bundle)"
              >
                <b-icon icon="magnify" custom-size="mdi-18px"></b-icon>
                Inspect
              </a>
              <a
                href="javascript:void(0)"
                class="card-footer-item"
                :disabled="!item.code"
                @click="item.code && showCode(item.code)"
              >
                <b-icon icon="code-braces" custom-size="mdi-18px"></b-icon>
                Source Code
              </a>
            </footer>
          </div>
        </div>
      </div>
    </div>
    <Inspector ref="inspector"></Inspector>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import SExpBox from "@/components/Simulator/SExpBox.vue";
import BundlePanel from "@/components/DevHelper/BundlePanel.vue";
import KeyBox from "@/components/Common/KeyBox.vue";
import Inspector from "@/components/DevHelper/Inspector.vue";

interface GalleryEntity {
  gallery?: GalleryItem[];
}

interface GalleryItem {
  name?: string;
  description?: string;
  image?: string;
  bundle?: string;
  code?: string;
}

@Component({
  components: {
    SExpBox,
    KeyBox,
    BundlePanel,
    Inspector,
  },
})
export default class CoinGallery extends Vue {
  puzzlecl = "";
  solutioncl = "";
  started = false;
  bundleText = "";
  loadError = false;
  gallery: GalleryEntity = {};

  async mounted(): Promise<void> {
    const resp = await fetch("./gallery/gallery.json", { method: "GET" });
    if (resp.status != 200) {
      this.loadError = true;
      console.warn("error when getting gallery: " + resp.status);
    }
    this.gallery = (await resp.json()) as GalleryEntity;
  }

  async inspect(path: string): Promise<void> {
    const resp = await fetch(path, { method: "GET" });
    if (resp.status != 200) {
      console.warn("error when getting item: " + resp.status);
    }

    const json = await resp.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inspector = this.$refs.inspector as any;
    if (inspector.inspect) inspector.inspect(json);
  }

  async showCode(path: string): Promise<void> {
    const resp = await fetch(path, { method: "GET" });
    if (resp.status != 200) {
      console.warn("error when getting item: " + resp.status);
    }
  }
}
</script>

<style scoped lang="scss">
.gallery {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
}
.card {
  margin-bottom: 3rem;
}
.content-wrapper {
  margin-top: 3rem;
}
.card-footer-item {
  font-size: 12px;
  font-weight: bold;
  color: #666;
}
.card-header-title {
  display: block;
}
.card-content p {
  margin-bottom: 2rem;
}
.card-content {
  padding: 0.2rem;
}
a[disabled="disabled"] {
  cursor: not-allowed;
  color: #aaa;
}
.image img {
  object-fit: contain;
  height: 200px;
}
</style>
