import type { SupabaseClient } from '@supabase/supabase-js';

import { SUBSCRIPTIONS_TABLE } from '~/lib/db-tables';
import type { Database } from '~/database.types';

import { OrganizationSubscription } from '~/lib/organizations/types/organization-subscription';

type Client = SupabaseClient<Database>;
type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];

export async function addSubscription(
  client: Client,
  subscription: OrganizationSubscription,
) {
  return getSubscriptionsTable(client)
    .insert(subscriptionMapper(subscription))
    .select('id')
    .single();
}

/**
 * @name updateSubscriptionById
 * @default Update subscription with ID {@link subscriptionId} with data
 * object {@link subscription}
 */
export async function updateSubscriptionById(
  client: Client,
  subscription: OrganizationSubscription,
) {
  return getSubscriptionsTable(client)
    .update(subscriptionMapper(subscription))
    .match({
      id: subscription.id,
    })
    .throwOnError();
}

function subscriptionMapper(
  subscription: OrganizationSubscription,
): SubscriptionRow {
  const row: Partial<SubscriptionRow> = {
    id: subscription.id,
    variant_id: subscription.variantId,
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
