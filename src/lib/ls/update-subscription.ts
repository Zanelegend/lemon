import { getLemonSqueezyClient } from '~/lib/ls/lemon-squeezy-client';

export async function updateSubscription(params: {
  subscriptionId: string;
  productId: number;
  variantId: number;
}) {
  const client = getLemonSqueezyClient();
  const path = `v1/subscriptions/${params.subscriptionId}`;

  const body = JSON.stringify({
    data: {
      type: 'subscriptions',
      id: params.subscriptionId,
      attributes: {
        product_id: params.productId,
        variant_id: params.variantId,
      },
    },
  });

  return client.request({
    path,
    method: 'PATCH',
    body,
  });
}
