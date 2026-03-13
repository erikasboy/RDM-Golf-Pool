// Request notification permission and show notifications

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

export function showNotification(title, options = {}) {
  if (!("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000);

    return notification;
  }
}

export function notifyFieldImported(tournamentName) {
  showNotification("Field Announced!", {
    body: `The field for ${tournamentName} is now set. Make your picks!`,
    tag: "field-imported",
    requireInteraction: true,
  });
}
