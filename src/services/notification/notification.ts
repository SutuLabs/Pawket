import { NotificationProgrammatic } from "buefy";

export function notifyPrimary(msg: string): void {
  NotificationProgrammatic.open({
    message: msg,
    type: "is-primary",
    closable: false,
  });
}

export function desktopNotify(title: string, body: string): void {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notification");
  } else if (Notification.permission === "granted") {
    new Notification(title, { body: body });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, { body: body });
      }
    });
  }
}
