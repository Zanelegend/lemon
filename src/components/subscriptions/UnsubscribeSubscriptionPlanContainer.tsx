import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Trans from '~/core/ui/Trans';
import Button from '~/core/ui/Button';
import Modal from '~/core/ui/Modal';

import useUnsubscribePlan from '~/lib/ls/hooks/use-unsubscribe-plan';

function UnsubscribeSubscriptionPlanContainer(
  props: React.PropsWithChildren<{
    subscriptionId: number;
  }>
) {
  const router = useRouter();
  const [unsubscribeRequested, setUnsubscribeRequested] = useState(false);
  const { isMutating, trigger } = useUnsubscribePlan();

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
              onClick={async () => {
                await trigger(props.subscriptionId);

                setUnsubscribeRequested(false);

                router.refresh();
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
