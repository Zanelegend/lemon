begin;

create extension "basejump-supabase_test_helpers" version '0.0.6';

select
  no_plan();

select
  tests.create_supabase_user('user');

select
  tests.create_supabase_user('user-2');

select
  tests.authenticate_as('user');

select
  create_new_organization('Organization');

select
  tests.authenticate_as('user-2');

select
  create_new_organization('Organization 2');

set local role service_role;

insert into subscriptions(
    id,
    variant_id,
    status,
    cancel_at_period_end,
    billing_anchor,
    created_at,
    ends_at,
    renews_at,
    trial_starts_at,
    trial_ends_at,
    update_payment_method_url
) values (
 1,
 1,
 'active',
 false,
 1,
 now(),
 now() + interval '1 year',
 now() + interval '1 year',
 now(),
 now() + interval '1 year',
 'https://example.com'
);

insert into organizations_subscriptions(
  organization_id,
  subscription_id,
  customer_id)
values (
  makerkit.get_organization_id(
    'Organization'),
  1,
  1);

select
  tests.authenticate_as('user');

select
  isnt_empty($$
    select
      makerkit.get_active_subscription(makerkit.get_organization_id('Organization'));

$$,
'can get active subscription for organization');

select
  isnt_empty($$
    select
      1 from organizations_subscriptions
      where
        subscription_id = 1;

$$,
'can get active subscription for organization');

select
  tests.authenticate_as('user-2');

select
  is_empty($$
    select
      makerkit.get_active_subscription(makerkit.get_organization_id('Organization'));

$$,
'cannot get subscription for another organization');

select
  is_empty($$
    select
      1 from organizations_subscriptions
      where
        subscription_id = 1;

$$,
'cannot get subscription for another organization');

select
  tests.authenticate_as('user');

-- Test that a user can only create a subscription for their own organization
select
  throws_ok($$ insert into subscriptions(
      id, variant_id, status, cancel_at_period_end, billing_anchor, created_at,
      ends_at)
    values (1, 1, 'active', false, 1, now(), now() + interval '1 month');

$$,
'new row violates row-level security policy for table "subscriptions"');

select
  throws_ok($$ insert into organizations_subscriptions(
      organization_id, subscription_id, customer_id)
    values (
      makerkit.get_organization_id(
        'Organization 2'), 1, 1) $$, 'new row violates row-level ' ||
                                             'security policy for table "organizations_subscriptions"');

set local role postgres;

create table tasks(
  id bigint generated always as identity primary key,
  name text not null,
  organization_id bigint not null references public.organizations,
  created_at timestamptz not null default now()
);

alter table tasks enable row level security;

select
  tests.rls_enabled('tasks');

create policy "Can insert tasks with an active subscription" on tasks
  for insert to authenticated
    with check (
exists (
      select
        1
      from
        makerkit.get_active_subscription(organization_id)));

create policy "Can read tasks if they belong to the organization" on tasks
  for select to authenticated
    using (current_user_is_member_of_organization(organization_id));

select
  tests.authenticate_as('user');

select
  lives_ok($$ insert into tasks(
      name, organization_id)
    values (
      'Task 1', makerkit.get_organization_id(
        'Organization'));

$$,
'can insert tasks with an active subscription');

select
  throws_ok($$ insert into tasks(
      name, organization_id)
    values (
      'Task 2', makerkit.get_organization_id(
        'Organization 2')) $$, 'new row violates row-level security policy for table "tasks"');

select
  tests.authenticate_as('user-2');

select
  throws_ok($$ insert into tasks(
      name, organization_id)
    values (
      'Task 2', makerkit.get_organization_id(
        'Organization 2'));

$$,
'new row violates row-level security policy for table "tasks"');

select
  throws_ok($$ insert into tasks(
      name, organization_id)
    values (
      'Task 2', makerkit.get_organization_id(
        'Organization'));

$$,
'new row violates row-level security policy for table "tasks"');

select
  *
from
  finish();

rollback;
