import React, { useState, useTransition } from 'react';

import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import { Close as DialogPrimitiveClose } from '@radix-ui/react-dialog';

import { Dialog, DialogContent, DialogTrigger } from '~/core/ui/Dialog';
import Button from '~/core/ui/Button';
import PricingTable from '~/components/PricingTable';
import IconButton from '~/core/ui/IconButton';

import Heading from '~/core/ui/Heading';
import SubHeading from '~/core/ui/SubHeading';
import If from '~/core/ui/If';
import Trans from '~/core/ui/Trans';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { updatePlanAction } from '~/lib/ls/actions';

function UpdateSubscriptionPlanContainer({
  subscriptionId,
  organizationUid,
  currentPlanVariantId,
}: React.PropsWithChildren<{
  subscriptionId: number;
  organizationUid: string;
  currentPlanVariantId: number;
}>) {
  const [updateRequested, setUpdateRequested] = useState(false);
  const [isMutating, startTransition] = useTransition();
  const csrfToken = useCsrfToken();

  return (
    <>
      <Dialog open={updateRequested} onOpenChange={setUpdateRequested}>
        <DialogTrigger asChild>
          <Button size={'small'} variant={'flat'}>
            <Trans i18nKey={'subscription:switchPlan'} />
          </Button>
        </DialogTrigger>

        <DialogContent
          className={
            'flex h-auto w-full !max-w-none bg-white/95 py-8 lg:w-9/12' +
            ' rounded-xl dark:bg-black-500/95' +
            ' flex-col items-center'
          }
        >
          <DialogPrimitiveClose asChild>
            <IconButton
              className={'absolute right-6 top-6 flex items-center'}
              label={'Close Modal'}
              onClick={() => setUpdateRequested(false)}
            >
              <XMarkIcon className={'h-8'} />
              <span className="sr-only">Close</span>
            </IconButton>
          </DialogPrimitiveClose>

          <div className={'flex flex-col space-y-8'}>
            <div className={'flex flex-col space-y-2'}>
              <Heading type={3}>
                <Trans i18nKey={'subscription:updatePlanModalHeading'} />
              </Heading>

              <SubHeading>
                <Trans i18nKey={'subscription:updatePlanModalSubheading'} />
              </SubHeading>
            </div>

            <div className={'flex flex-col space-y-2 text-sm'}>
              <PricingTable
                CheckoutButton={({ variantId, recommended }) => {
                  if (!variantId || variantId === currentPlanVariantId) {
                    return null;
                  }

                  return (
                    <UpdatePricingPlanCheckoutButton
                      recommended={recommended}
                      loading={isMutating}
                      onClick={() => {
                        startTransition(async () => {
                          await updatePlanAction({
                            variantId,
                            subscriptionId,
                            organizationUid,
                            csrfToken,
                          });
                        });
                      }}
                    />
                  );
                }}
              />
            </div>

            <div>
              <Button
                color={'transparent'}
                onClick={() => setUpdateRequested(false)}
              >
                <Trans i18nKey={'common:cancel'} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UpdatePricingPlanCheckoutButton(
  props: React.PropsWithChildren<{
    onClick: () => void;
    recommended?: boolean;
    loading?: boolean;
  }>,
) {
  const [confirm, setConfirm] = useState(false);

  return (
    <Button
      color={props.recommended ? 'custom' : 'secondary'}
      className={classNames({
        ['bg-primary-contrast hover:bg-primary-contrast/90' +
        ' font-bold text-gray-900']: props.recommended,
      })}
      loading={props.loading}
      onClick={confirm ? props.onClick : () => setConfirm(true)}
    >
      <span className={'flex w-full justify-center space-x-2'}>
        <If
          condition={confirm}
          fallback={<Trans i18nKey={'subscription:switchToPlan'} />}
        >
          <CheckIcon className={'h-5'} />

          <span>
            <Trans i18nKey={'subscription:confirmSwitchPlan'} />
          </span>
        </If>
      </span>
    </Button>
  );
}

export default UpdateSubscriptionPlanContainer;
