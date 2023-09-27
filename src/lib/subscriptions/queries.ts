import type { SupabaseClient } from '@supabase/supabase-js';

import { SUBSCRIPTIONS_TABLE } from '~/lib/db-tables';
import { Database } from '~/database.types';

type Client = SupabaseClient<Database>;

export async function getOrganizationSubscription(
  client: Client,
  organizationId: number,
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
        trialEndsAt: trial_ends_at,
        organizations_subscriptions!inner (
          organization_id
        )
      `,
    )
    .eq('organizations_subscriptions.organization_id', organizationId)
    .throwOnError()
    .maybeSingle();
}
