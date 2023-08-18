'use client';

import { ColumnDef } from '@tanstack/react-table';
import { usePathname, useRouter } from 'next/navigation';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

import DataTable from '~/core/ui/DataTable';
import { getOrganizations } from '~/app/admin/organizations/queries';
import SubscriptionStatusBadge from '~/app/dashboard/[organization]/components/organizations/SubscriptionStatusBadge';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '~/core/ui/Dropdown';

import IconButton from '~/core/ui/IconButton';
import configuration from '~/configuration';

type Response = Awaited<ReturnType<typeof getOrganizations>>;
type Organizations = Response['organizations'];

const EMPTY_ROW = <span>-</span>;

const columns: Array<ColumnDef<Organizations[0]>> = [
  {
    header: 'ID',
    accessorKey: 'id',
    id: 'id',
    size: 10,
  },
  {
    header: 'UUID',
    accessorKey: 'uuid',
    id: 'uuid',
    size: 200,
  },
  {
    header: 'Name',
    accessorKey: 'name',
    id: 'name',
  },
  {
    header: 'Subscription',
    id: 'subscription',
    cell: ({ row }) => {
      const variantId = row.original?.subscription?.data?.variantId;

      const plan = configuration.subscriptions.products.find((product) => {
        return product.plans.some((plan) => plan.variantId === variantId);
      });

      if (plan) {
        const variant = plan.plans.find((plan) => plan.variantId === variantId);

        if (!variant) {
          return 'Unknown Price';
        }

        return `${plan.name} - ${variant.name}`;
      }

      return EMPTY_ROW;
    },
  },
  {
    header: 'Subscription Status',
    id: 'subscription-status',
    cell: ({ row }) => {
      const subscription = row.original?.subscription?.data;

      if (!subscription) {
        return EMPTY_ROW;
      }

      return <SubscriptionStatusBadge subscription={subscription} />;
    },
  },
  {
    header: 'Subscription Period',
    id: 'subscription-period',
    cell: ({ row }) => {
      const subscription = row.original?.subscription?.data;

      if (!subscription) {
        return '-';
      }

      const canceled = subscription.cancelAtPeriodEnd;
      const date = subscription.endsAt;

      if (!date) {
        return EMPTY_ROW;
      }

      const formattedDate = new Date(date).toLocaleDateString();

      return canceled ? (
        <span className={'text-orange-500'}>Stops on {formattedDate}</span>
      ) : (
        <span className={'text-green-500'}>Renews on {formattedDate}</span>
      );
    },
  },
  {
    header: 'Members',
    id: 'members',
    cell: ({ row }) => {
      const memberships = row.original.memberships.length;
      const uid = row.original.uuid;

      return (
        <Link
          data-cy={'organization-members-link'}
          href={`organizations/${uid}/members`}
          className={'hover:underline cursor-pointer'}
        >
          {memberships} member{memberships === 1 ? '' : 's'}
        </Link>
      );
    },
  },
  {
    header: '',
    id: 'actions',
    cell: ({ row }) => {
      const organization = row.original;
      const uid = organization.uuid;

      return (
        <div className={'flex justify-end'}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton>
                <span className="sr-only">Open menu</span>
                <EllipsisHorizontalIcon className="h-4 w-4" />
              </IconButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(uid)}
              >
                Copy UUID
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href={`/admin/organizations/${uid}/members`}>
                  View Members
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

function OrganizationsTable({
  organizations,
  pageCount,
  perPage,
  page,
}: React.PropsWithChildren<{
  organizations: Organizations;
  pageCount: number;
  perPage: number;
  page: number;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <DataTable
      tableProps={{
        'data-cy': 'admin-organizations-table',
      }}
      onPaginationChange={({ pageIndex }) => {
        router.push(`${pathname}?page=${pageIndex + 1}`);
      }}
      pageSize={perPage}
      pageIndex={page - 1}
      pageCount={pageCount}
      columns={columns}
      data={organizations}
    />
  );
}

export default OrganizationsTable;
