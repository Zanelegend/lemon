import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';

import { z } from 'zod';
import { join } from 'path';

import getLogger from '~/core/logger';
import { canChangeBilling } from '~/lib/organizations/permissions';
import { createLemonSqueezyCheckout } from '~/lib/ls/create-checkout';
import getApiRefererPath from '~/core/generic/get-api-referer-path';
import { parseOrganizationIdCookie } from '~/lib/server/cookies/organization.cookie';
import requireSession from '~/lib/user/require-session';
import getSupabaseServerClient from '~/core/supabase/server-client';

export async function POST(req: NextRequest) {
  const logger = getLogger();
  const client = getSupabaseServerClient();

  const bodyResult = getBodySchema().safeParse(req.body);
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

    const response = await createLemonSqueezyCheckout({
      organizationId,
      variantId,
      returnUrl,
      storeId,
    });

    const url = response.data.attributes.url;

    // redirect user back based on the response
    return redirect(url);
  } catch (e) {
    logger.error(e, `Lemon Squeezy Checkout error`);

    return redirectToErrorPage();
  }
}

function getStoreId() {
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

  if (storeId === undefined) {
    throw new Error(`LEMON_SQUEEZY_STORE_ID is not defined`);
  }

  return Number(storeId);
}

function getBodySchema() {
  return z.object({
    organizationId: z.coerce.number().min(1),
    variantId: z.coerce.number().min(1),
    returnUrl: z.string().min(1),
  });
}
