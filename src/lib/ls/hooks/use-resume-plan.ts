import useSWRMutation from 'swr/mutation';
import useFetch from '~/core/hooks/use-api';

export function useResumePlan() {
  const fetcher = useFetch<void, number>();
  const key = ['resume-plan'];

  return useSWRMutation(
    key,
    async (_, { arg: subscriptionId }: { arg: number }) => {
      return fetcher({
        method: 'PATCH',
        path: `/api/ls/subscription/${subscriptionId}`,
      });
    }
  );
}
