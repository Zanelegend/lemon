import { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';

import {
  throwBadRequestException,
  throwInternalServerErrorException,
  throwUnauthorizedException,
} from '~/core/http-exceptions';

import getLogger from '~/core/logger';

import {
  addSubscription,
  deleteSubscription,
  updateSubscriptionById,
} from '~/lib/subscriptions/mutations';

import { buildOrganizationSubscription } from '~/lib/ls/build-organization-subscription';
import LemonSqueezyWebhooks from '~/lib/ls/types/webhooks.enum';

import { SubscriptionWebhookResponse } from '~/lib/ls/types/subscription-webhook-response';
import getSupabaseServerClient from '~/core/supabase/server-client';
import { setOrganizationSubscriptionData } from '~/lib/organizations/database/mutations';

/**
 * @description Handle the webhooks from Lemon Squeezy related to checkouts
 */
export async function POST(req: NextRequest) {
  const logger = getLogger();

  const eventName = req.headers.get('x-event-name');
  const signature = req.headers.get('x-signature') as string;

  const rawBody = await req.text();

  if (!signature) {
    console.error(`Signature header not found`);

    return throwBadRequestException();
  }

  if (!isSigningSecretValid(Buffer.from(rawBody), signature)) {
    console.error(`Signing secret is invalid`);

    return throwUnauthorizedException();
  }

  const body = await req.json();

  // create an Admin client to write to the subscriptions table
  const client = getSupabaseServerClient({
    admin: true,
  });

  logger.info(
    {
      type: eventName,
    },
    `[Lemon Squeezy] Received Webhook`
  );

  try {
    switch (eventName) {
      case LemonSqueezyWebhooks.SubscriptionCreated: {
        await onCheckoutCompleted(client, body as SubscriptionWebhookResponse);

        break;
      }

      case LemonSqueezyWebhooks.SubscriptionUpdated: {
        const isSubscriptionCanceled =
          body.data.attributes.status === 'canceled';

        const id = body.data.id;

        if (isSubscriptionCanceled) {
          await deleteSubscription(client, id);
        } else {
          await onSubscriptionUpdated(
            client,
            body as SubscriptionWebhookResponse
          );
        }

        break;
      }
    }

    return respondOk();
  } catch (e) {
    logger.error(
      {
        type: eventName,
      },
      `[Lemon Squeezy] Webhook handling failed`
    );

    logger.debug(e);

    return throwInternalServerErrorException();
  }
}

async function onCheckoutCompleted(
  client: SupabaseClient,
  response: SubscriptionWebhookResponse
) {
  const attrs = response.data.attributes;

  // we have passed this data in the checkout
  const organizationId = Number(response.meta.custom_data.organization_id);
  const customerId = attrs.customer_id;

  // build organization subscription and set on the organization document
  // we add just enough data in the DB, so we do not query
  // Stripe for every bit of data
  // if you need your DB record to contain further data
  // add it to {@link buildOrganizationSubscription}
  const subscriptionData = buildOrganizationSubscription(response);
  const { error } = await addSubscription(client, subscriptionData);

  if (error) {
    return Promise.reject(
      `Failed to add subscription to the database: ${error}`
    );
  }

  return setOrganizationSubscriptionData(client, {
    organizationId,
    customerId,
    subscriptionId: subscriptionData.id,
  });
}

async function onSubscriptionUpdated(
  client: SupabaseClient,
  subscription: SubscriptionWebhookResponse
) {
  const subscriptionData = buildOrganizationSubscription(subscription);

  return updateSubscriptionById(client, subscriptionData);
}

function respondOk() {
  return new Response(null, {
    status: 200,
  });
}

function isSigningSecretValid(rawBody: Buffer, signatureHeader: string) {
  const SIGNING_SECRET = process.env.LEMON_SQUEEZY_SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error('Missing signing secret. Add "SIGNING_SECRET"');
  }

  const hmac = createHmac('sha256', SIGNING_SECRET);

  const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
  const signature = Buffer.from(signatureHeader, 'utf8');

  return timingSafeEqual(digest, signature);
}
