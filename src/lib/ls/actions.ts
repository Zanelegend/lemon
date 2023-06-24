'use server';

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { RedirectType } from 'next/dist/client/components/redirect';

import { z } from 'zod';
import { join } from 'path';
import { SupabaseClient } from '@supabase/supabase-js';

import getLogger from '~/core/logger';
import { canChangeBilling } from '~/lib/organizations/permissions';
import createCheckout from '~/lib/ls/create-checkout';
import getApiRefererPath from '~/core/generic/get-api-referer-path';
import { parseOrganizationIdCookie } from '~/lib/server/cookies/organization.cookie';
import requireSession from '~/lib/user/require-session';
import getSupabaseServerClient from '~/core/supabase/server-client';
import unsubscribePlan from '~/lib/ls/unsubscribe-plan';

import { getUserMembershipByOrganization } from '~/lib/memberships/queries';
import { getOrganizationById } from '~/lib/organizations/database/queries';
import resumeSubscription from '~/lib/ls/resume-subscription';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import updateSubscription from '~/lib/ls/update-subscription';

import configuration from '~/configuration';
import { withCsrfCheck, withSession } from '~/core/generic/actions-utils';
import { revalidatePath } from 'next/cache';

const path = `/${configuration.paths.appHome}/[organization]/settings/subscription`;

export async function createCheckoutSessionAction(formData: FormData) {
  const logger = getLogger();
  const client = getSupabaseServerClient();

  const bodyResult = getCreateCheckoutBodySchema().safeParse(
    Object.fromEntries(formData)
  );

  const userId = await requireSession(client);

  const currentOrganizationId = Number(
    await parseOrganizationIdCookie(cookies())
  );

  const redirectToErrorPage = () => {
    const referer = getApiRefererPath(headers());
    const url = join(referer, `?error=true`);

    return redirect(url);
  };

  if (!bodyResult.success) {
    return redirectToErrorPage();
  }

  const { organizationId, returnUrl, variantId } = bodyResult.data;
  const matchesSessionOrganizationId = currentOrganizationId === organizationId;

  if (!matchesSessionOrganizationId) {
    return redirectToErrorPage();
  }

  // disallow if the user doesn't have permissions to change
  // billing settings based on its role. To change the logic, please update
  // {@link canChangeBilling}
  if (!canChangeBilling) {
    logger.debug(
      {
        userId,
        organizationId,
      },
      `User attempted to access checkout but lacked permissions`
    );

    return redirectToErrorPage();
  }

  try {
    const storeId = getStoreId();

    const response = await createCheckout({
      organizationId,
      variantId,
      returnUrl,
      storeId,
    });

    const url = response.data.attributes.url;

    // redirect user back based on the response
    return redirect(url, RedirectType.replace);
  } catch (e) {
    logger.error(e, `Lemon Squeezy Checkout error`);

    return redirectToErrorPage();
  }
}

export const unsubscribePlanAction = withCsrfCheck(
  withSession(async (params: { subscriptionId: number; csrfToken: string }) => {
    const subscriptionId = params.subscriptionId;
    const logger = getLogger();
    const client = getSupabaseServerClient();

    const organizationUid = await getOrganizationUid(client);
    const userId = await validateRequest({ client, organizationUid });

    logger.info(
      {
        userId,
        subscriptionId,
      },
      `Deleting subscription plan.`
    );

    await unsubscribePlan({
      subscriptionId,
    });

    logger.info(
      {
        userId,
        subscriptionId,
      },
      `Subscription plan successfully deleted.`
    );

    revalidatePath(path);

    return { success: true };
  })
);

export const updatePlanAction = withCsrfCheck(
  withSession(
    async (params: {
      subscriptionId: number;
      variantId: number;
      csrfToken: string;
    }) => {
      const subscriptionId = params.subscriptionId;
      const variantId = params.variantId;

      const logger = getLogger();
      const client = getSupabaseServerClient();

      const organizationUid = await getOrganizationUid(client);
      const userId = await validateRequest({ client, organizationUid });

      const product = findProductByVariantId(variantId);

      if (!product || !product.productId) {
        logger.error(
          {
            userId,
            subscriptionId,
          },
          `Subscription product not found. Cannot update subscription. Did you add the ID to the configuration?`
        );

        throw new Error(`Subscription product not found.`);
      }

      logger.info(
        {
          userId,
          subscriptionId,
          variantId,
          productId: product.productId,
        },
        `Updating subscription plan.`
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
        `Plan successfully updated.`
      );

      revalidatePath(path);

      return { success: true };
    }
  )
);

export const resumeSubscriptionAction = withSession(
  withCsrfCheck(
    async (params: { subscriptionId: number; csrfToken: string }) => {
      const logger = getLogger();
      const client = getSupabaseServerActionClient();

      const organizationUid = await getOrganizationUid(client);
      const userId = await validateRequest({ client, organizationUid });

      const subscriptionId = params.subscriptionId;

      logger.info(
        {
          subscriptionId,
          userId,
        },
        `Resuming subscription plan.`
      );

      await resumeSubscription({
        subscriptionId: Number(subscriptionId),
      });

      logger.info(
        {
          subscriptionId,
          userId,
        },
        `Subscription plan successfully resumed.`
      );

      revalidatePath(path);

      return { success: true };
    }
  )
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
      `User attempted to access checkout but lacked permissions`
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
  }
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

async function getOrganizationUid(client: SupabaseClient) {
  const organizationId = Number(await parseOrganizationIdCookie(cookies()));
  const { data, error } = await getOrganizationById(client, organizationId);

  if (error) {
    getLogger().error(
      error,
      `Could not retrieve organization by ID: ${organizationId}`
    );

    throw error;
  }

  return data.uuid;
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

function getCreateCheckoutBodySchema() {
  return z.object({
    organizationId: z.coerce.number().min(1),
    variantId: z.coerce.number().min(1),
    returnUrl: z.string().min(1),
    csrf_token: z.string().min(1),
  });
}
