import React, { useState, useTransition } from 'react';

import Trans from '~/core/ui/Trans';
import Button from '~/core/ui/Button';
import Modal from '~/core/ui/Modal';
import { resumeSubscriptionAction } from '~/lib/ls/actions';
import useCsrfToken from '~/core/hooks/use-csrf-token';

function ResumeSubscriptionPlanContainer(
  props: React.PropsWithChildren<{
    subscriptionId: number;
  }>
) {
  const [resumeRequested, setResumeRequested] = useState(false);
  const [isMutating, startTransition] = useTransition();
  const csrfToken = useCsrfToken();

  return (
    <>
      <Button
        size={'small'}
        variant={'flat'}
        color={'primary'}
        onClick={() => setResumeRequested(true)}
      >
        <Trans i18nKey={'subscription:resumeSubscription'} />
      </Button>

      <Modal
        closeButton={false}
        heading={<Trans i18nKey={'subscription:resumeSubscription'} />}
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
                startTransition(async () => {
                  await resumeSubscriptionAction({
                    subscriptionId: props.subscriptionId,
                    csrfToken,
                  });

                  setResumeRequested(false);
                });
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
