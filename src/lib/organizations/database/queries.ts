import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/gotrue-js';
import type { Database } from '~/database.types';

import { MEMBERSHIPS_TABLE, ORGANIZATIONS_TABLE } from '~/lib/db-tables';
import type Membership from '~/lib/organizations/types/membership';
import type MembershipRole from '~/lib/organizations/types/membership-role';
import type Organization from '~/lib/organizations/types/organization';
import type { OrganizationSubscription } from '~/lib/organizations/types/organization-subscription';
import type UserData from '~/core/session/types/user-data';

type Client = SupabaseClient<Database>;

/**
 * Query to fetch the organization data from the Database
 * Returns the organization data and the subscription data
 * {@link UserOrganizationData.organization}
 */
const FETCH_ORGANIZATION_QUERY = `
  id,
  uuid,
  name,
  logoURL: logo_url,
  subscription: organizations_subscriptions (
    customerId: customer_id,
    data: subscription_id (
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
    )
  )
`;

export type UserOrganizationData = {
  role: MembershipRole;
  organization: Organization & {
    subscription?: {
      customerId: Maybe<string>;
      data: OrganizationSubscription;
    };
  };
};

/**
 * @name getOrganizationsByUserId
 * @description Get all the organizations where the user {@link userId} is a member
 * @param client
 * @param userId
 */
export function getOrganizationsByUserId(client: Client, userId: string) {
  return client
    .from(MEMBERSHIPS_TABLE)
    .select<
      string,
      {
        role: MembershipRole;
        organization: UserOrganizationData['organization'];
        userId: string;
      }
    >(
      `
        role,
        userId: user_id,
        organization:organization_id (${FETCH_ORGANIZATION_QUERY})`,
    )
    .eq('user_id', userId)
    .throwOnError();
}

export async function getOrganizationInvitedMembers(
  client: Client,
  organizationId: number,
) {
  return client
    .from(MEMBERSHIPS_TABLE)
    .select<string, Membership>(
      `
      id,
      role,
      invitedEmail: invited_email
    `,
    )
    .eq('organization_id', organizationId)
    .not('code', 'is', null)
    .throwOnError();
}

/**
 * @name getOrganizationMembers
 * @description Get all the members of an organization
 * @param client
 * @param organizationId
 */
export function getOrganizationMembers(client: Client, organizationId: number) {
  return client
    .from(MEMBERSHIPS_TABLE)
    .select<
      string,
      {
        membershipId: number;
        role: MembershipRole;
        data: UserData;
      }
    >(
      `
        membershipId: id,
        role,
        data: user_id (
          id,
          photoUrl: photo_url,
          displayName: display_name
        )
       `,
    )
    .eq('organization_id', organizationId)
    .is('code', null);
}

/**
 * @name getOrganizationByUid
 * @description Returns the Database record of the organization by its UUID
 * {@link uid}
 */
export function getOrganizationByUid(client: Client, uid: string) {
  return client
    .from(ORGANIZATIONS_TABLE)
    .select<string, UserOrganizationData['organization']>(
      FETCH_ORGANIZATION_QUERY,
    )
    .eq('uuid', uid)
    .throwOnError()
    .maybeSingle();
}

/**
 * @name getOrganizationById
 * @description Returns the Database record of the organization by its ID
 * {@link organizationId}
 */
export function getOrganizationById(client: Client, organizationId: number) {
  return client
    .from(ORGANIZATIONS_TABLE)
    .select<string, UserOrganizationData['organization']>(
      FETCH_ORGANIZATION_QUERY,
    )
    .eq('id', organizationId)
    .throwOnError()
    .single();
}

/**
 * @name getMembersAuthMetadata
 * @param client
 * @param userIds
 */
export async function getMembersAuthMetadata(
  client: Client,
  userIds: string[],
) {
  const users = await Promise.all(
    userIds.map((userId) => {
      const response = client.auth.admin.getUserById(userId);

      return response
        .then((response) => {
          return response.data.user as User;
        })
        .catch((error) => {
          console.error(
            {
              userId,
            },
            `Error fetching user: ${error}`,
          );

          return undefined;
        });
    }) ?? [],
  );

  return users.filter(Boolean) as User[];
}
