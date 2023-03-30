import type { SupabaseClient } from '@supabase/supabase-js';

import { SUBSCRIPTIONS_TABLE } from '~/lib/db-tables';
import type { Database } from '../../database.types';

import { OrganizationSubscription } from '~/lib/organizations/types/organization-subscription';

type Client = SupabaseClient<Database>;
type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];

export async function addSubscription(
  client: Client,
  subscription: OrganizationSubscription
) {
  const data = subscriptionMapper(subscription);

  return getSubscriptionsTable(client)
    .insert({
      ...data,
      id: subscription.id,
    })
    .select('id')
    .throwOnError()
    .single();
}

/**
 * @name deleteSubscription
 * @description Removes a subscription from an organization by
 * Stripe subscription ID
 */
export async function deleteSubscription(
  client: Client,
  subscriptionId: string
) {
  return getSubscriptionsTable(client)
    .delete()
    .match({ id: subscriptionId })
    .throwOnError();
}

/**
 * @name updateSubscriptionById
 * @default Update subscription with ID {@link subscriptionId} with data
 * object {@link subscription}
 */
export async function updateSubscriptionById(
  client: Client,
  subscription: OrganizationSubscription
) {
  return getSubscriptionsTable(client)
    .update(subscriptionMapper(subscription))
    .match({
      id: subscription.id,
    })
    .throwOnError();
}

function subscriptionMapper(
  subscription: OrganizationSubscription
): SubscriptionRow {
  const variantId = subscription.id;

  const row: Partial<SubscriptionRow> = {
    variant_id: variantId,
    status: subscription.status,
    billing_anchor: subscription.billingAnchor,
    cancel_at_period_end: subscription.cancelAtPeriodEnd ?? false,
    update_payment_method_url: subscription.updatePaymentMethodUrl,
    renews_at: subscription.renewsAt ? subscription.renewsAt : undefined,
    created_at: subscription.createdAt ? subscription.createdAt : undefined,
    ends_at: subscription.endsAt,
  };

  if (subscription.trialEndsAt) {
    row.trial_ends_at = subscription.trialEndsAt;
  }

  return row as SubscriptionRow;
}

function getSubscriptionsTable(client: Client) {
  return client.from(SUBSCRIPTIONS_TABLE);
}
