'use client';

import React from 'react';

import type Organization from '~/lib/organizations/types/organization';
import { canChangeBilling } from '~/lib/organizations/permissions';

import Trans from '~/core/ui/Trans';
import Alert from '~/core/ui/Alert';

import PricingTable from '~/components/PricingTable';
import IfHasPermissions from '~/app/(app)/components/IfHasPermissions';
import CheckoutRedirectButton from '~/app/(app)/settings/subscription/components/CheckoutRedirectButton';

const PlanSelectionForm: React.FCC<{
  organization: WithId<Organization>;
}> = ({ organization }) => {
  return (
    <div className={'flex flex-col space-y-6'}>
      <IfHasPermissions
        condition={canChangeBilling}
        fallback={<NoPermissionsAlert />}
      >
        <div className={'flex w-full flex-col space-y-8'}>
          <PricingTable
            CheckoutButton={(props) => {
              return (
                <CheckoutRedirectButton
                  organizationId={organization.id}
                  variantId={props.variantId}
                  recommended={props.recommended}
                >
                  <Trans
                    i18nKey={'subscriptions:checkout'}
                    defaults={'Checkout'}
                  />
                </CheckoutRedirectButton>
              );
            }}
          />
        </div>
      </IfHasPermissions>
    </div>
  );
};

export default PlanSelectionForm;

function NoPermissionsAlert() {
  return (
    <Alert type={'warn'}>
      <Alert.Heading>
        <Trans i18nKey={'subscription:noPermissionsAlertHeading'} />
      </Alert.Heading>

      <Trans i18nKey={'subscription:noPermissionsAlertBody'} />
    </Alert>
  );
}
