import getLemonSqueezyClient from '~/lib/ls/lemon-squeezy-client';
import type SubscriptionWebhookResponse from '~/lib/ls/types/subscription-webhook-response';

export default async function getLemonSqueezySubscription(
  subscriptionId: string,
) {
  const client = getLemonSqueezyClient();
  const path = `v1/subscriptions/${subscriptionId}`;

  return client.request<SubscriptionWebhookResponse>({
    path,
    method: 'GET',
  });
}
