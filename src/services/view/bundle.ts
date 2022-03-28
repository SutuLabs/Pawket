import { tc } from "@/i18n/i18n";
import { ApiResponse } from "@/models/api";
import { SpendBundle } from "@/models/wallet";
import { NotificationProgrammatic as Notification } from "buefy";
import { ModalProgrammatic as Modal } from "buefy";
import DevHelper from "@/components/DevHelper.vue";

export async function submitBundle(bundle: SpendBundle, setSubmitting: (state: boolean) => void, success: () => void): Promise<void> {
  setSubmitting(true);

  try {
    const resp = await fetch(process.env.VUE_APP_API_URL + "Wallet/pushtx", {
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
        type: "is-success",
      });
      success();
    } else {
      const err = typeof(json.error) === "string" ? json.error.match('error ([A-Z_]+)') : null;
      const errMsg = err !== null ? err[1] : '';
      const path = "send.ui.messages.error." + errMsg
      const msg = tc(path) === undefined ? json.error : tc(path);
      Notification.open({
        message: tc("send.ui.messages.getFailedResponse") + msg,
        type: "is-danger",
      });
    }
  } catch (error) {
    Notification.open({
      message: tc("send.ui.messages.failedToSubmit") + error,
      type: "is-danger",
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