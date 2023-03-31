import useSWRMutation from 'swr/mutation';
import useFetch from '~/core/hooks/use-api';

function useUnsubscribePlan() {
  const fetcher = useFetch<void, number>();
  const key = ['unsubscribe-plan'];

  return useSWRMutation(
    key,
    async (_, { arg: subscriptionId }: { arg: number }) => {
      return fetcher({
        method: 'DELETE',
        path: `/api/ls/subscription/${subscriptionId}`,
      });
    }
  );
}

export default useUnsubscribePlan;
