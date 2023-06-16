'use client';

import useCurrentOrganization from '~/lib/organizations/hooks/use-current-organization';

import If from '~/core/ui/If';
import Trans from '~/core/ui/Trans';
import Button from '~/core/ui/Button';
import SubscriptionCard from './SubscriptionCard';

import { canChangeBilling } from '~/lib/organizations/permissions';

import UnsubscribeSubscriptionPlanContainer from '~/components/subscriptions/UnsubscribeSubscriptionPlanContainer';
import ResumeSubscriptionPlanContainer from '~/components/subscriptions/ResumeSubscriptionPlanContainer';
import UpdateSubscriptionPlanContainer from '~/components/subscriptions/UpdateSubscriptionPlanContainer';
import PlanSelectionForm from '~/app/dashboard/[organization]/settings/subscription/components/PlanSelectionForm';
import IfHasPermissions from '~/app/dashboard/[organization]/components/IfHasPermissions';

const Plans: React.FC = () => {
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
        <If condition={organization.subscription}>
          {(subscription) => {
            const status = subscription.data.status;
            const subscriptionId = subscription.data.id;
            const isActive = status === 'active' || status === 'on_trial';

            if (status === 'cancelled' || status === 'paused') {
              return (
                <div>
                  <ResumeSubscriptionPlanContainer
                    subscriptionId={subscriptionId}
                  />
                </div>
              );
            }

            return (
              <div className={'flex space-x-2.5'}>
                <UpdateSubscriptionPlanContainer
                  subscriptionId={subscriptionId}
                  currentPlanVariantId={subscription.data.variantId}
                />

                <UpdatePaymentMethodLink
                  href={subscription.data.updatePaymentMethodUrl}
                />

                <If condition={isActive}>
                  <UnsubscribeSubscriptionPlanContainer
                    subscriptionId={subscriptionId}
                  />
                </If>
              </div>
            );
          }}
        </If>
      </IfHasPermissions>
    </div>
  );
};

export default Plans;

function UpdatePaymentMethodLink(
  props: React.PropsWithChildren<{
    href: string;
  }>
) {
  return (
    <Button size={'small'} color={'secondary'} href={props.href}>
      <Trans i18nKey={'subscription:updatePaymentMethod'} />
    </Button>
  );
}
