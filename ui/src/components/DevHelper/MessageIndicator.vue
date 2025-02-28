<template>
  <span>
    <template v-for="(m, i) in Object.entries(getMessageMode(mode.toString())).reverse()">
      <b-tag
        :key="i"
        :type="
          (code === 66 && m[0] === 'receive') || (code === 67 && m[0] === 'send') ? 'is-info  ml-3' : 'if-info is-light ml-3'
        "
      >
        {{ m[1].mode }}
        {{ m[0] == "send" ? "receiver" : "sender" }}
      </b-tag>
      <span v-if="i === 0" :key="'arrow-' + i" class="pl-2">➡️</span>
    </template>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import { getMessageMode, MessageModeInfo } from "../../../../lib-chia/services/spendbundle";
import { ConditionArgs } from "../../../../lib-chia/services/crypto/puzzle";
import { ConditionInfo, conditionDict } from "../../../../lib-chia/services/coin/condition";

@Component({
  components: {
    KeyBox,
  },
})
export default class MessageIndicator extends Vue {
  @Prop() public code!: 66 | 67 | undefined;
  @Prop() public mode!: number;

  public readonly conditionsdict: { [id: number]: ConditionInfo } = conditionDict;

  public getMessageMode(arg: string | ConditionArgs): { send: MessageModeInfo; receive: MessageModeInfo } {
    const { send, receive } = getMessageMode(arg);
    return { send, receive };
  }
}
</script>

<style scoped lang="scss">
@import "@/styles/arguments.scss";

ul.args_list.ellipsis-item > li .mid-message {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 80px;
}
</style>
