import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import getSupabaseServerClient from '~/core/supabase/server-client';
import getLogger from '~/core/logger';

import { SupabaseClient } from '@supabase/supabase-js';

import {
  throwForbiddenException,
  throwInternalServerErrorException,
} from '~/core/http-exceptions';

import unsubscribePlan from '~/lib/ls/unsubscribe-plan';
import updateSubscription from '~/lib/ls/update-subscription';
import resumeSubscription from '~/lib/ls/resume-subscription';

import configuration from '~/configuration';
import requireSession from '~/lib/user/require-session';
import { getUserMembershipByOrganization } from '~/lib/memberships/queries';
import { canChangeBilling } from '~/lib/organizations/permissions';
import { parseOrganizationIdCookie } from '~/lib/server/cookies/organization.cookie';
import { getOrganizationById } from '~/lib/organizations/database/queries';

interface Params {
  params: {
    subscriptionId: string;
  };
}

export async function DELETE(request: NextRequest, { params }: Params) {
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
    subscriptionId: Number(subscriptionId),
  });

  logger.info(
    {
      userId,
      subscriptionId,
    },
    `Subscription plan successfully deleted.`
  );

  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const subscriptionId = params.subscriptionId;
  const logger = getLogger();
  const client = getSupabaseServerClient();

  const organizationUid = await getOrganizationUid(client);
  const userId = await validateRequest({ client, organizationUid });

  const body = await request.json();
  const variantId = getVariantSchema().parse(body).variantId;
  const product = findProductByVariantId(variantId);

  if (!product || !product.productId) {
    logger.error(
      {
        userId,
        subscriptionId,
      },
      `Subscription product not found. Cannot update subscription. Did you add the ID to the configuration?`
    );

    return throwInternalServerErrorException();
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

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const logger = getLogger();
  const client = getSupabaseServerClient();

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

  return NextResponse.json({ success: true });
}

function getVariantSchema() {
  return z.object({
    variantId: z.coerce.number().min(1),
  });
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

    throw throwForbiddenException(
      `You do not have permission to access this page`
    );
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
