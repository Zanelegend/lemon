import getClient from '~/lib/ls/lemon-squeezy-client';

async function createLemonSqueezyCheckout(params: {
  organizationUid: string;
  variantId: number;
  storeId: number;
  returnUrl: string;
}) {
  const client = await getClient();

  return client.createCheckout({
    storeId: params.storeId,
    variantId: params.variantId,
    attributes: {
      checkout_data: {
        custom: {
          organization_id: params.organizationUid,
        },
      },
      product_options: {
        redirect_url: params.returnUrl,
        enabled_variants: [params.variantId],
      },
    },
  });
}

export default createLemonSqueezyCheckout;
