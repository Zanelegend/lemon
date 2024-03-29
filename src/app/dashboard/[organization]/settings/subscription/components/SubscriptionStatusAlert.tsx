import type { OrganizationSubscription } from '~/lib/organizations/types/organization-subscription';

import Alert from '~/core/ui/Alert';
import Trans from '~/core/ui/Trans';

function SubscriptionStatusAlert(
  props: React.PropsWithChildren<{
    subscription: OrganizationSubscription;
    values: {
      renewDate: string;
      endDate: string | null;
      trialEndDate: string | null;
    };
  }>
) {
  const status = props.subscription.status;

  let message = '';
  let heading = '';
  let type: 'success' | 'error' | 'warn' | 'info';

  switch (status) {
    case 'active':
      heading = 'subscription:status.active.heading';
      message = 'subscription:status.active.description';
      type = 'success';
      break;
    case 'on_trial':
      heading = 'subscription:status.on_trial.heading';
      message = 'subscription:status.on_trial.description';
      type = 'success';
      break;
    case 'cancelled':
      heading = 'subscription:status.cancelled.heading';
      message = 'subscription:status.cancelled.description';
      type = 'warn';
      break;
    case 'paused':
      heading = 'subscription:status.paused.heading';
      message = 'subscription:status.paused.description';
      type = 'warn';
      break;
    case 'expired':
      heading = 'subscription:status.expired.heading';
      message = 'subscription:status.expired.description';
      type = 'error';
      break;
    case 'unpaid':
      heading = 'subscription:status.unpaid.heading';
      message = 'subscription:status.unpaid.description';
      type = 'error';
      break;
    case 'past_due':
      heading = 'subscription:status.past_due.heading';
      heading = 'subscription:status.past_due.description';
      type = 'error';

      break;
    default:
      return null;
  }

  return (
    <Alert type={type}>
      <Alert.Heading>
        <Trans i18nKey={heading} />
      </Alert.Heading>

      <span className={'block'}>
        <Trans i18nKey={message} values={props.values} />
      </span>
    </Alert>
  );
}

export default SubscriptionStatusAlert;
