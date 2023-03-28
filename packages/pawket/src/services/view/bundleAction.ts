import { tc } from "@/i18n/i18n";
import { ApiResponse } from "@/models/api";
import { SpendBundle } from "@/services/spendbundle";
import { NotificationProgrammatic as Notification } from "buefy";
import { ModalProgrammatic as Modal } from "buefy";
import DevHelper from "@/components/DevHelper/DevHelper.vue";
import { chainId, rpcUrl } from "@/store/modules/network";
import { lockCoins } from "../coin/coinUtility";
import { AccountEntity } from "@/models/account";

export async function submitBundle(bundle: SpendBundle, account: AccountEntity, setSubmitting: (state: boolean) => void, success: () => void): Promise<void> {
  setSubmitting(true);
  /** 
   * Do not delele! For avoiding check i18n failure.
   *  tc("send.messages.error.DOUBLE_SPEND")
      tc("send.messages.error.UNKNOWN_UNSPENT")
      tc("send.messages.error.BAD_AGGREGATE_SIGNATURE")
      tc("send.messages.error.INVALID_CONDITION")
      tc("send.messages.error.COIN_AMOUNT_EXCEEDS_MAXIMUM"
      tc("send.messages.error.INVALID_FEE_LOW_FEE")
      tc("send.messages.error.MEMPOOL_NOT_INITIALIZED")
      tc("send.messages.error.ALREADY_INCLUDING_TRANSACTION")
      tc("send.messages.error.INCOMPATIBLE_NETWORK_ID")
      tc("send.messages.error.NO_TRANSACTIONS_WHILE_SYNCING")
      tc("send.messages.error.INVALID_FEE_TOO_CLOSE_TO_ZERO")
      tc("send.messages.error.COIN_AMOUNT_NEGATIVE")
      tc("send.messages.error.PENDING")
   */
  try {
    const resp = await fetch(rpcUrl() + "Wallet/pushtx", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bundle: bundle }),
    });
    const json = (await resp.json()) as ApiResponse;
    setSubmitting(false);
    if (json.success) {
      Notification.open({
        message: tc("send.ui.messages.submitted"),
        type: "is-primary",
      });
      const txnTime = Date.now()
      lockCoins(account, bundle.coin_spends, txnTime, chainId());
      success();
    } else {
      const err = typeof (json.error) === "string" ? json.error.match('error ([A-Z_]+)') : null;
      const errMsg = err !== null ? err[1] : '';
      const path = "send.messages.error." + errMsg
      const msg = tc(path) == path ? json.error : tc(path);
      Notification.open({
        message: tc("send.ui.messages.getFailedResponse") + msg,
        type: "is-danger",
        duration: 10000,
      });
    }
  } catch (error) {
    Notification.open({
      message: tc("send.ui.messages.failedToSubmit") + error,
      type: "is-danger",
      duration: 10000,
    });
    console.warn(error);
    setSubmitting(false);
  }
}

function getBundleJson(bundle: SpendBundle): string {
  return JSON.stringify(bundle, null, 4);
}

export function debugBundle(parent: Vue, bundle: SpendBundle): void {
  Modal.open({
    parent: parent,
    component: DevHelper,
    hasModalCard: true,
    trapFocus: true,
    props: { inputBundleText: getBundleJson(bundle) },
  });
}