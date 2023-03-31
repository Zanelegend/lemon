import getClient from '~/lib/ls/lemon-squeezy-client';

async function resumeSubscription(params: { subscriptionId: number }) {
  const client = getClient();
  const path = `v1/subscriptions/${params.subscriptionId}`;

  return client.request({
    path,
    method: 'PATCH',
    body: JSON.stringify({
      data: {
        type: 'subscriptions',
        id: params.subscriptionId.toString(),
        attributes: {
          cancelled: false,
        },
      },
    }),
  });
}

export default resumeSubscription;
