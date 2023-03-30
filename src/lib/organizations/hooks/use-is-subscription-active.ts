import useCurrentOrganization from '~/lib/organizations/hooks/use-current-organization';
import { OrganizationSubscriptionStatus } from '~/lib/organizations/types/organization-subscription';

const ACTIVE_STATUSES: OrganizationSubscriptionStatus[] = [
  'active',
  'on_trial',
];

/**
 * @name useIsSubscriptionActive
 */
function useIsSubscriptionActive() {
  const organization = useCurrentOrganization();
  const status = organization?.subscription?.data.status;

  if (!status) {
    return false;
  }

  return ACTIVE_STATUSES.includes(status);
}

export default useIsSubscriptionActive;
