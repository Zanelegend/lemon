import useSWRMutation from 'swr/mutation';
import useFetch from '~/core/hooks/use-api';

interface Params {
  variantId: number;
  subscriptionId: number;
}

export function useUpdatePlan() {
  const fetcher = useFetch<
    void,
    {
      variantId: number;
    }
  >();

  const key = ['update-plan'];

  return useSWRMutation(key, async (_, { arg }: { arg: Params }) => {
    return fetcher({
      method: 'PUT',
      path: `/api/ls/subscription/${arg.subscriptionId}`,
      body: {
        variantId: arg.variantId,
      },
    });
  });
}
