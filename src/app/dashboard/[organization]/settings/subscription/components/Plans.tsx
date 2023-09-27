'use client';

import useCurrentOrganization from '~/lib/organizations/hooks/use-current-organization';

import Trans from '~/core/ui/Trans';
import SubscriptionCard from './SubscriptionCard';
import IfHasPermissions from '~/components/IfHasPermissions';

import { canChangeBilling } from '~/lib/organizations/permissions';
import PlanSelectionForm from '../components/PlanSelectionForm';
import CustomerPortalRedirectButton from '../components/CustomerRedirectPortalButton';

const Plans = () => {
  const organization = useCurrentOrganization();

  if (!organization) {
    return null;
  }

  const subscription = organization.subscription?.data;

  if (!subscription) {
    return <PlanSelectionForm organization={organization} />;
  }

  return (
    <div className={'flex flex-col space-y-6'}>
      <SubscriptionCard subscription={subscription} />

      <IfHasPermissions condition={canChangeBilling}>
        <div>
          <CustomerPortalRedirectButton>
            <Trans i18nKey={'subscription:manageBilling'} />
          </CustomerPortalRedirectButton>
        </div>
      </IfHasPermissions>
    </div>
  );
};

export default Plans;
