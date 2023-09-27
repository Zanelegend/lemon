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

import { getUserMembershipByOrganization } from '~/lib/memberships/queries';

import configuration from '~/configuration';
import { parseOrganizationIdCookie } from '~/lib/server/cookies/organization.cookie';
import getLemonSqueezySubscription from '~/lib/ls/get-subscription';
import { getOrganizationSubscription } from '~/lib/subscriptions/queries';
import { getOrganizationByUid } from '~/lib/organizations/database/queries';

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

  revalidatePath(path, 'page');

  const url = response.data.attributes.url;

  // redirect user back based on the response
  return redirect(url, RedirectType.replace);
}

export async function createCustomerPortalSessionAction() {
  const client = getSupabaseServerClient();

  const { user } = await requireSession(client);
  const userId = user.id;

  const organizationUid = await parseOrganizationIdCookie(userId);

  if (!organizationUid) {
    return redirectToErrorPage();
  }

  // check if user can access the checkout
  // if not, redirect to the error page
  await assertUserCanAccessCheckout({
    client,
    userId,
    organizationUid,
  });

  // get the organization
  const { data: organization } = await getOrganizationByUid(
    client,
    organizationUid,
  );

  // validate the organization exists
  if (!organization) {
    return redirectToErrorPage();
  }

  // get the organization's subscription
  const { data: subscription } = await getOrganizationSubscription(
    client,
    organization.id,
  );

  // validate the subscription exists
  if (!subscription) {
    return redirectToErrorPage();
  }

  // get the customer portal url
  const response = await getLemonSqueezySubscription(
    subscription.id.toString(),
  );

  if (!response) {
    return redirectToErrorPage();
  }

  revalidatePath(path, 'page');

  const url = response.data.attributes.urls.customer_portal;

  // redirect user back based on the response
  return redirect(url, RedirectType.replace);
}

function getStoreId() {
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

  if (storeId === undefined) {
    throw new Error(`LEMON_SQUEEZY_STORE_ID is not defined`);
  }

  return Number(storeId);
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
