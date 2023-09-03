'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { RedirectType } from 'next/dist/client/components/redirect';

import { z } from 'zod';
import { join } from 'path';
import { SupabaseClient } from '@supabase/supabase-js';

import getLogger from '~/core/logger';
import { canChangeBilling } from '~/lib/organizations/permissions';
import createCheckout from '~/lib/ls/create-checkout';
import getApiRefererPath from '~/core/generic/get-api-referer-path';
import requireSession from '~/lib/user/require-session';
import getSupabaseServerClient from '~/core/supabase/server-client';
import unsubscribePlan from '~/lib/ls/unsubscribe-plan';

import { getUserMembershipByOrganization } from '~/lib/memberships/queries';
import resumeSubscription from '~/lib/ls/resume-subscription';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import updateSubscription from '~/lib/ls/update-subscription';

import configuration from '~/configuration';
import { withSession } from '~/core/generic/actions-utils';

const path = `/${configuration.paths.appHome}/[organization]/settings/subscription`;

export async function createCheckoutSessionAction(formData: FormData) {
  const logger = getLogger();
  const client = getSupabaseServerClient();

  const bodyResult = getCreateCheckoutBodySchema().safeParse(
    Object.fromEntries(formData),
  );

  const { user } = await requireSession(client);
  const userId = user.id;

  if (!bodyResult.success) {
    logger.error(
      {
        error: bodyResult.error,
      },
      `Invalid body for create checkout session`,
    );

    return redirectToErrorPage();
  }

  const { organizationUid, returnUrl, variantId } = bodyResult.data;

  // check if user can access the checkout
  // if not, redirect to the error page
  await assertUserCanAccessCheckout({
    client,
    userId,
    organizationUid,
  });

  const storeId = getStoreId();

  const response = await createCheckout({
    organizationUid,
    variantId,
    returnUrl,
    storeId,
  }).catch((error) => {
    logger.error({ error }, `Error creating checkout session`);
  });

  if (!response) {
    return redirectToErrorPage();
  }

  revalidatePath(path);

  const url = response.data.attributes.url;

  // redirect user back based on the response
  return redirect(url, RedirectType.replace);
}

export const unsubscribePlanAction = withSession(
  async (params: {
    organizationUid: string;
    subscriptionId: number;
    csrfToken: string;
  }) => {
    const { subscriptionId, organizationUid } = params;
    const logger = getLogger();
    const client = getSupabaseServerClient();
    const userId = await validateRequest({ client, organizationUid });

    // check if user can access the checkout
    // if not, redirect to the error page
    await assertUserCanAccessCheckout({
      client,
      userId,
      organizationUid,
    });

    logger.info(
      {
        userId,
        subscriptionId,
      },
      `Deleting subscription plan.`,
    );

    await unsubscribePlan({
      subscriptionId,
    });

    logger.info(
      {
        userId,
        subscriptionId,
      },
      `Subscription plan successfully deleted.`,
    );

    revalidatePath(path);

    return { success: true };
  },
);

export const updatePlanAction = withSession(
  async (params: {
    organizationUid: string;
    subscriptionId: number;
    variantId: number;
    csrfToken: string;
  }) => {
    const { subscriptionId, organizationUid } = params;
    const variantId = params.variantId;

    const logger = getLogger();
    const client = getSupabaseServerClient();
    const userId = await validateRequest({ client, organizationUid });

    const product = findProductByVariantId(variantId);

    if (!product || !product.productId) {
      logger.error(
        {
          userId,
          subscriptionId,
        },
        `Subscription product not found. Cannot update subscription. Did you add the ID to the configuration?`,
      );

      throw new Error(`Subscription product not found.`);
    }

    // check if user can access the checkout
    // if not, redirect to the error page
    await assertUserCanAccessCheckout({
      client,
      userId,
      organizationUid,
    });

    logger.info(
      {
        userId,
        subscriptionId,
        variantId,
        productId: product.productId,
      },
      `Updating subscription plan.`,
    );

    await updateSubscription({
      subscriptionId,
      productId: product.productId,
      variantId,
    });

    logger.info(
      {
        userId,
        subscriptionId,
        variantId,
        productId: product.productId,
      },
      `Plan successfully updated.`,
    );

    revalidatePath(path);

    return { success: true };
  },
);

export const resumeSubscriptionAction = withSession(
  async (params: {
    organizationUid: string;
    subscriptionId: number;
    csrfToken: string;
  }) => {
    const logger = getLogger();
    const client = getSupabaseServerActionClient();

    const { organizationUid, subscriptionId } = params;
    const userId = await validateRequest({ client, organizationUid });

    logger.info(
      {
        subscriptionId,
        userId,
      },
      `Resuming subscription plan.`,
    );

    await resumeSubscription({
      subscriptionId: Number(subscriptionId),
    });

    logger.info(
      {
        subscriptionId,
        userId,
      },
      `Subscription plan successfully resumed.`,
    );

    revalidatePath(path);

    return { success: true };
  },
);

function getStoreId() {
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

  if (storeId === undefined) {
    throw new Error(`LEMON_SQUEEZY_STORE_ID is not defined`);
  }

  return Number(storeId);
}

function findProductByVariantId(variantId: number) {
  const products = configuration.subscriptions.products;

  for (const product of products) {
    for (const plan of product.plans) {
      if (plan.variantId === variantId) {
        return product;
      }
    }
  }
}

async function assertUserCanChangeBilling(params: {
  client: SupabaseClient;
  organizationUid: string;
  userId: string;
}) {
  const { client, organizationUid, userId } = params;

  // check the user's role has access to the checkout
  const canChangeBilling = await getUserCanAccessCheckout(client, {
    organizationUid,
    userId,
  });

  // disallow if the user doesn't have permissions to change
  // billing settings based on its role. To change the logic, please update
  // {@link canChangeBilling}
  if (!canChangeBilling) {
    getLogger().debug(
      {
        userId,
        organizationUid,
      },
      `User attempted to access checkout but lacked permissions`,
    );

    throw new Error(`You do not have permission to access this page`);
  }
}

/**
 * @name getUserCanAccessCheckout
 * @description check if the user has permissions to access the checkout
 * @param client
 * @param params
 */
async function getUserCanAccessCheckout(
  client: SupabaseClient,
  params: {
    organizationUid: string;
    userId: string;
  },
) {
  try {
    const { role } = await getUserMembershipByOrganization(client, params);

    if (role === undefined) {
      return false;
    }

    return canChangeBilling(role);
  } catch (e) {
    getLogger().error(e, `Could not retrieve user role`);

    return false;
  }
}

async function validateRequest(params: {
  client: SupabaseClient;
  organizationUid: string;
}) {
  const { client, organizationUid } = params;
  const session = await requireSession(params.client);
  const userId = session.user.id;

  await assertUserCanChangeBilling({
    client,
    organizationUid,
    userId,
  });

  return userId;
}

async function assertUserCanAccessCheckout({
  client,
  organizationUid,
  userId,
}: {
  client: SupabaseClient;
  userId: string;
  organizationUid: string;
}) {
  const logger = getLogger();

  const { role } = await getUserMembershipByOrganization(client, {
    userId,
    organizationUid,
  });

  // disallow if the user doesn't have permissions to change
  // billing settings based on its role. To change the logic, please update
  // {@link canChangeBilling}
  if (!canChangeBilling(role)) {
    logger.debug(
      {
        userId,
        organizationUid,
      },
      `User attempted to access checkout but lacked permissions`,
    );

    return redirectToErrorPage();
  }
}

function getCreateCheckoutBodySchema() {
  return z.object({
    organizationUid: z.string().uuid(),
    variantId: z.coerce.number().min(1),
    returnUrl: z.string().min(1),
    csrf_token: z.string().min(1),
  });
}

function redirectToErrorPage() {
  const referer = getApiRefererPath(headers());
  const url = join(referer, `?error=true`);

  return redirect(url);
}
