import { useState, useTransition } from 'react';

import Trans from '~/core/ui/Trans';
import Button from '~/core/ui/Button';
import Modal from '~/core/ui/Modal';
import { unsubscribePlanAction } from '~/lib/ls/actions';
import useCsrfToken from '~/core/hooks/use-csrf-token';

function UnsubscribeSubscriptionPlanContainer(
  props: React.PropsWithChildren<{
    subscriptionId: number;
    organizationUid: string;
  }>,
) {
  const [unsubscribeRequested, setUnsubscribeRequested] = useState(false);
  const [isMutating, startTransition] = useTransition();
  const csrfToken = useCsrfToken();

  return (
    <>
      <Button
        size={'small'}
        color={'transparent'}
        onClick={() => setUnsubscribeRequested(true)}
      >
        <Trans i18nKey={'subscription:cancelSubscription'} />
      </Button>

      <Modal
        closeButton={false}
        heading={<Trans i18nKey={'subscription:cancelSubscription'} />}
        isOpen={unsubscribeRequested}
        setIsOpen={setUnsubscribeRequested}
      >
        <div className={'flex flex-col space-y-4'}>
          <div className={'flex flex-col space-y-2 text-sm'}>
            <p>
              <Trans i18nKey={'subscription:cancelSubscriptionBody'} />
            </p>

            <p>
              <Trans i18nKey={'common:modalConfirmationQuestion'} />
            </p>
          </div>

          <div className={'flex justify-end space-x-2.5'}>
            <Modal.CancelButton
              onClick={() => setUnsubscribeRequested(false)}
            />

            <Button
              loading={isMutating}
              variant={'flat'}
              color={'danger'}
              onClick={() => {
                startTransition(async () => {
                  await unsubscribePlanAction({
                    subscriptionId: props.subscriptionId,
                    organizationUid: props.organizationUid,
                    csrfToken,
                  });

                  setUnsubscribeRequested(false);
                });
              }}
            >
              <Trans i18nKey={'subscription:confirmCancelSubscription'} />
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default UnsubscribeSubscriptionPlanContainer;
