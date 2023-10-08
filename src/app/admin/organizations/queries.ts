import { SupabaseClient } from '@supabase/supabase-js';

import { MEMBERSHIPS_TABLE, ORGANIZATIONS_TABLE } from '~/lib/db-tables';
import { UserOrganizationData } from '~/lib/organizations/database/queries';
import MembershipRole from '~/lib/organizations/types/membership-role';
import { Database } from '~/database.types';

type Client = SupabaseClient<Database>;

export async function getOrganizations(
  client: Client,
  search: string,
  page = 1,
  perPage = 20,
) {
  const startOffset = (page - 1) * perPage;
  const endOffset = startOffset + perPage;

  let query = client.from(ORGANIZATIONS_TABLE).select<
    string,
    UserOrganizationData['organization'] & {
      memberships: Array<{
        userId: string;
        role: MembershipRole;
      }>;
    }
  >(
    `
      id,
      uuid,
      name,
      logoURL: logo_url,
      memberships (
        userId: user_id,
        role
      ),
      subscription: organizations_subscriptions (
        customerId: customer_id,
        data: subscription_id (
          id,
          status,
          billingAnchor: billing_anchor,
          variantId: variant_id,
          createdAt: created_at,
          endsAt: ends_at,
          renewsAt: renews_at,
          trialStartsAt: trial_starts_at,
          trialEndsAt: trial_ends_at
        )
      )`,
    {
      count: 'exact',
    },
  );

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const {
    data: organizations,
    count,
    error,
  } = await query.range(startOffset, endOffset);

  if (error) {
    throw error;
  }

  return {
    organizations,
    count,
  };
}

export async function getMembershipsByOrganizationUid(
  client: Client,
  params: {
    uid: string;
    page: number;
    perPage: number;
  },
) {
  const startOffset = (params.page - 1) * params.perPage;
  const endOffset = startOffset + params.perPage;

  const { data, error, count } = await client
    .from(MEMBERSHIPS_TABLE)
    .select<
      string,
      {
        id: number;
        role: MembershipRole;
        user: {
          id: string;
          displayName: string;
          photoURL: string;
        };
      }
    >(
      `
      id,
      role,
      user: user_id (
        id,
        displayName: display_name,
        photoURL: photo_url
      ),
      organization: organization_id !inner (
        id,
        uuid
      )`,
      {
        count: 'exact',
      },
    )
    .eq('organization.uuid', params.uid)
    .range(startOffset, endOffset);

  if (error) {
    throw error;
  }

  return { data, count };
}
