import { getLemonSqueezyClient } from '~/lib/ls/lemon-squeezy-client';
import CreateCheckoutResponse from '~/lib/ls/types/create-checkout-response';

export async function createLemonSqueezyCheckout(params: {
  organizationId: number;
  variantId: number;
  storeId: number;
  returnUrl: string;
}) {
  const client = getLemonSqueezyClient();
  const path = 'v1/checkouts';

  return client.request<CreateCheckoutResponse>({
    path,
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            custom: {
              organization_id: params.organizationId,
            },
          },
          product_options: {
            redirect_url: params.returnUrl,
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: params.storeId.toString(),
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: params.variantId.toString(),
            },
          },
        },
      },
    }),
  });
}
