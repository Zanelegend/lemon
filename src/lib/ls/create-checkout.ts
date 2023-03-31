import getClient from '~/lib/ls/lemon-squeezy-client';
import CreateCheckoutResponse from '~/lib/ls/types/create-checkout-response';

async function createLemonSqueezyCheckout(params: {
  organizationId: number;
  variantId: number;
  storeId: number;
  returnUrl: string;
}) {
  const client = getClient();
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
              organization_id: params.organizationId.toString(),
            },
          },
          product_options: {
            redirect_url: params.returnUrl,
            enabled_variants: [params.variantId],
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

export default createLemonSqueezyCheckout;
