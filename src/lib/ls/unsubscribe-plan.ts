import { getLemonSqueezyClient } from '~/lib/ls/lemon-squeezy-client';

export async function unsubscribePlan(params: { subscriptionId: number }) {
  const client = getLemonSqueezyClient();
  const path = `v1/subscriptions/${params.subscriptionId}`;

  return client.request({
    path,
    method: 'DELETE',
  });
}
