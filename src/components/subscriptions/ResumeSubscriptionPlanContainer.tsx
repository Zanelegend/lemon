import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import Trans from '~/core/ui/Trans';
import Button from '~/core/ui/Button';
import Modal from '~/core/ui/Modal';

import { useResumePlan } from '~/lib/ls/hooks/use-resume-plan';

function ResumeSubscriptionPlanContainer(
  props: React.PropsWithChildren<{
    subscriptionId: number;
  }>
) {
  const router = useRouter();
  const [resumeRequested, setResumeRequested] = useState(false);
  const { isMutating, trigger } = useResumePlan();

  return (
    <>
      <Button
        variant={'flat'}
        color={'primary'}
        onClick={() => setResumeRequested(true)}
      >
        <Trans i18nKey={'subscription:resumeSubscription'} />
      </Button>

      <Modal
        closeButton={false}
        heading={`Unsubscribe from plan`}
        isOpen={resumeRequested}
        setIsOpen={setResumeRequested}
      >
        <div className={'flex flex-col space-y-4'}>
          <div className={'flex flex-col space-y-2 text-sm'}>
            <p>
              <Trans i18nKey={'subscription:resumeSubscriptionBody'} />
            </p>

            <p>
              <Trans i18nKey={'common:modalConfirmationQuestion'} />
            </p>
          </div>

          <div className={'flex justify-end space-x-2.5'}>
            <Modal.CancelButton onClick={() => setResumeRequested(false)} />

            <Button
              loading={isMutating}
              variant={'flat'}
              color={'primary'}
              onClick={async () => {
                await trigger(props.subscriptionId);

                setResumeRequested(false);

                router.refresh();
              }}
            >
              <Trans i18nKey={'subscription:confirmResumeSubscription'} />
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default ResumeSubscriptionPlanContainer;
