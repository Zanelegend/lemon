import type { SupabaseClient } from '@supabase/supabase-js';
import { SUBSCRIPTIONS_TABLE } from '~/lib/db-tables';
import type { Database } from '../../database.types';

type Client = SupabaseClient<Database>;

/**
 * @name getOrganizationSubscription
 * @description Returns the organization's subscription
 */
export async function getOrganizationSubscription(
  client: Client,
  organizationId: number
) {
  return client
    .from(SUBSCRIPTIONS_TABLE)
    .select(
      `
        id,
        status,
        updatePaymentMethodUrl: update_payment_method_url,
        billingAnchor: billing_anchor,
        variantId: variant_id,
        createdAt: created_at,
        endsAt: ends_at,
        renewsAt: renews_at,
        trialStartsAt: trial_starts_at,
        trialEndsAt: trial_ends_at
      `
    )
    .eq('organization_id', organizationId)
    .throwOnError()
    .single();
}

/**
 * @name getOrganizationBySubscriptionId
 * @description Retrieve an Organization record given its
 * subscription ID {@link subscriptionId}. Throws an error when not found.
 */
async function getOrganizationBySubscriptionId(
  client: Client,
  subscriptionId: number
) {
  return client
    .from(SUBSCRIPTIONS_TABLE)
    .select<string>(
      `
        organizations: (
          id,
          name,
         )
       `
    )
    .eq('id', subscriptionId)
    .throwOnError();
}

/**
 * @name getOrganizationSubscriptionActive
 * @description Returns whether the organization is on an active
 * subscription, regardless of plan.
 */
export async function getOrganizationSubscriptionActive(
  client: Client,
  organizationId: number
) {
  const { data: subscription } = await getOrganizationSubscription(
    client,
    organizationId
  );

  const status = subscription?.status;

  if (!status) {
    return false;
  }

  return status === 'active' || status === 'on_trial';
}
