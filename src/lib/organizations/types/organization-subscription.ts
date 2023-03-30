export type OrganizationSubscriptionStatus =
  | 'on_trial'
  | 'active'
  | 'paused'
  | 'past_due'
  | 'unpaid'
  | 'cancelled'
  | 'expired';

export interface OrganizationSubscription {
  id: number;
  variantId: number;

  status: OrganizationSubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  billingAnchor: number;

  createdAt: string;
  endsAt: string | null;
  renewsAt: string;
  trialEndsAt: string | null;
  updatePaymentMethodUrl: string;
}
