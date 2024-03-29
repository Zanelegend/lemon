import React, { useMemo } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { getI18n } from 'react-i18next';

import type { OrganizationSubscription } from '~/lib/organizations/types/organization-subscription';

import Heading from '~/core/ui/Heading';
import If from '~/core/ui/If';
import Trans from '~/core/ui/Trans';

import PricingTable from '~/components/PricingTable';
import SubscriptionStatusAlert from './SubscriptionStatusAlert';

import configuration from '~/configuration';

import SubscriptionStatusBadge from '~/app/dashboard/[organization]/components/organizations/SubscriptionStatusBadge';

const SubscriptionCard: React.FC<{
  subscription: OrganizationSubscription;
}> = ({ subscription }) => {
  const details = useSubscriptionDetails(subscription.variantId);
  const cancelAtPeriodEnd = subscription.cancelAtPeriodEnd;
  const isActive = subscription.status === 'active';
  const language = useMemo(() => getI18n().language, []);

  const dates = useMemo(() => {
    return {
      endDate: subscription.endsAt
        ? new Date(subscription.endsAt).toLocaleDateString(language)
        : null,
      renewDate: new Date(subscription.renewsAt).toLocaleDateString(language),
      trialEndDate: subscription.trialEndsAt
        ? new Date(subscription.trialEndsAt).toLocaleDateString(language)
        : null,
    };
  }, [language, subscription]);

  if (!details) {
    return null;
  }

  return (
    <div className={'flex flex-col space-y-6'} data-cy={'subscription-card'}>
      <div className={'flex flex-col space-y-2'}>
        <div className={'flex items-center space-x-4'}>
          <Heading type={3}>
            <span data-cy={'subscription-name'}>{details.product.name}</span>
          </Heading>

          <SubscriptionStatusBadge subscription={subscription} />
        </div>

        <Heading type={6}>
          <span className={'text-gray-500 dark:text-gray-400'}>
            {details.product.description}
          </span>
        </Heading>
      </div>

      <div>
        <span className={'flex items-end'}>
          <PricingTable.Price>{details.plan.price}</PricingTable.Price>

          <span className={'lowercase text-gray-500 dark:text-gray-400'}>
            /{details.plan.name}
          </span>
        </span>
      </div>

      <SubscriptionStatusAlert subscription={subscription} values={dates} />

      <If condition={isActive}>
        <RenewStatusDescription
          dates={dates}
          cancelAtPeriodEnd={cancelAtPeriodEnd}
        />
      </If>
    </div>
  );
};

function RenewStatusDescription(
  props: React.PropsWithChildren<{
    cancelAtPeriodEnd: boolean;
    dates: {
      endDate: string | null;
      renewDate: string;
      trialEndDate: string | null;
    };
  }>,
) {
  return (
    <span className={'flex items-center space-x-1.5 text-sm'}>
      <If condition={props.cancelAtPeriodEnd}>
        <XCircleIcon className={'h-5 text-yellow-700'} />

        <span>
          <Trans
            i18nKey={'subscription:cancelAtPeriodEndDescription'}
            values={props.dates}
          />
        </span>
      </If>

      <If condition={!props.cancelAtPeriodEnd}>
        <CheckCircleIcon className={'h-5 text-green-700'} />

        <span>
          <Trans
            i18nKey={'subscription:renewAtPeriodEndDescription'}
            values={props.dates}
          />
        </span>
      </If>
    </span>
  );
}

function useSubscriptionDetails(variantId: number) {
  return useMemo(() => {
    for (const product of configuration.subscriptions.products) {
      for (const plan of product.plans) {
        if (plan.variantId === variantId) {
          return { plan, product };
        }
      }
    }
  }, [variantId]);
}

export default SubscriptionCard;
