import Pusher from "pusher";
import PusherJS from "pusher-js";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export const getPusherClient = () => {
  if (typeof window === "undefined") return null;
  return new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  });
};

export const CHANNELS = {
  // Public channels (no "private-" prefix = no server auth needed)
  notifications: (userId: string) => `notifications-${userId}`,
  media: (eventId: string) => `media-${eventId}`,
  activity: "activity-feed",
};

export const EVENTS = {
  NEW_NOTIFICATION: "new-notification",
  NEW_MEDIA: "new-media",
  LIKE: "like",
  COMMENT: "comment",
  TAG: "tag",
};

export async function triggerNotification(
  userId: string,
  data: {
    type: string;
    message: string;
    mediaId?: string;
    senderId?: string;
    senderName?: string;
    senderAvatar?: string;
    link?: string;
  }
) {
  try {
    await pusherServer.trigger(
      CHANNELS.notifications(userId),
      EVENTS.NEW_NOTIFICATION,
      data
    );
  } catch (error) {
    console.error("Pusher trigger error:", error);
  }
}
