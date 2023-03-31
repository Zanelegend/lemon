import getClient from '~/lib/ls/lemon-squeezy-client';

async function unsubscribePlan(params: { subscriptionId: number }) {
  const client = getClient();
  const path = `v1/subscriptions/${params.subscriptionId}`;

  return client.request({
    path,
    method: 'DELETE',
  });
}

export default unsubscribePlan;
