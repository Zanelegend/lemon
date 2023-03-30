import { OrganizationSubscription } from '~/lib/organizations/types/organization-subscription';
import { SubscriptionWebhookResponse } from '~/lib/ls/types/subscription-webhook-response';

export function buildOrganizationSubscription(
  subscription: SubscriptionWebhookResponse
): OrganizationSubscription {
  const attrs = subscription.data.attributes;
  const status = attrs.status;
  const variantId = attrs.variant_id;
  const id = +subscription.data.id;
  const createdAt = attrs.created_at;
  const endsAt = attrs.ends_at;
  const renewsAt = attrs.renews_at;
  const trialEndsAt = attrs.trial_ends_at;
  const updatePaymentMethodUrl = attrs.urls.update_payment_method;

  return {
    id,
    variantId,
    status,
    billingAnchor: attrs.billing_anchor,
    cancelAtPeriodEnd: attrs.cancelled,
    updatePaymentMethodUrl,
    endsAt,
    createdAt,
    renewsAt,
    trialEndsAt,
  };
}
