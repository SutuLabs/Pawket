import Vue from 'vue';

declare module 'vue/types/vue' {
  interface Vue {
    $sanitize(dirty: string, options?: Record<string, unknown>): void;
  }
}