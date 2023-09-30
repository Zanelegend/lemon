import getLemonSqueezyClient from '~/lib/ls/lemon-squeezy-client';

export default async function getLemonSqueezySubscription(
  subscriptionId: number,
) {
  const client = await getLemonSqueezyClient();

  return client.getSubscription({ id: subscriptionId });
}
