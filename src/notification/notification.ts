import { NotificationProgrammatic as Notification } from "buefy";

export function notifyPrimary(msg: string): void {
  Notification.open({
    message: msg,
    type: "is-primary",
    position: "is-bottom-left",
    closable: false,
  });
}
