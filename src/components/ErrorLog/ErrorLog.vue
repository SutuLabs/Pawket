<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">
        {{ $tc("errorLog.ui.title") }}
        <b-button type="is-danger" size="is-small" @click="clearAll()">{{ $tc("errorLog.ui.button.clearAll") }}</b-button>
      </p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-table :data="errorLogs" :hoverable="true" :bordered="true">
        <b-table-column width="50%" field="message" :label="$tc('errorLog.ui.label.message')" v-slot="props">
          <p>
            <span class="tag is-danger mb-2"> {{ $tc("errorLog.ui.field.msg") }}:{{ props.row.msg }} </span>
          </p>
          <p>
            <span class="tag is-warning mb-2"> {{ $tc("errorLog.ui.field.info") }}:{{ props.row.info }} </span>
          </p>
          <p>
            <span class="tag is-success">{{ $tc("errorLog.ui.field.url") }}:{{ props.row.url }} </span>
          </p>
        </b-table-column>
        <b-table-column field="stack" :label="$tc('errorLog.ui.label.stack')" v-slot="props">
          {{ props.row.stack }}
        </b-table-column>
        <template #empty>
          <div class="has-text-centered">{{ $tc("errorLog.ui.field.empty") }}</div>
        </template>
      </b-table>
    </section>
  </div>
</template>
<script lang="ts">
import store from "@/store";
import { errorLog } from "@/store/modules/error";
import { Component, Vue, Watch } from "vue-property-decorator";

@Component
export default class ErrorLog extends Vue {
  get errorLogs(): errorLog[] {
    return store.state.error.errorLogs;
  }

  clearAll(): void {
    this.$emit("close");
    store.dispatch("clearErrorLog");
  }

  close(): void {
    this.$emit("close");
  }

  get path(): string {
    return this.$route.path;
  }

  @Watch("path")
  onPathChange():void {
    this.close();
  }
}
</script>

<style scoped lang="scss"></style>
