import webpush from 'web-push';
import { db } from '../db';
import { pushSubscriptions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Configure web-push with VAPID details
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:admin@buyback-event.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  id?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  try {
    const subscriptions = await db.select().from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return;
    }

    const pushPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify(payload)
        );
      } catch (error: any) {
        // If subscription is invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`Removing invalid subscription for user ${userId}`);
          await db.delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id));
        } else {
          console.error(`Error sending push to user ${userId}:`, error.message);
        }
      }
    });

    await Promise.all(pushPromises);
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
}

export async function sendPushToAgents(payload: PushPayload): Promise<void> {
  try {
    const subscriptions = await db.select().from(pushSubscriptions)
      .where(eq(pushSubscriptions.isForAgent, "true"));

    if (subscriptions.length === 0) {
      console.log('No push subscriptions found for agents');
      return;
    }

    const pushPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify(payload)
        );
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`Removing invalid agent subscription`);
          await db.delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id));
        } else {
          console.error('Error sending push to agent:', error.message);
        }
      }
    });

    await Promise.all(pushPromises);
  } catch (error) {
    console.error('Error sending push to agents:', error);
  }
}

export async function sendPushToOrganizationUsers(organizationId: string, payload: PushPayload): Promise<void> {
  // This would require joining with user_organizations table
  // For simplicity, we'll just send to the specific user for now
  console.log(`Would send push to organization ${organizationId}:`, payload);
}

export function getVapidPublicKey(): string | undefined {
  return vapidPublicKey;
}
