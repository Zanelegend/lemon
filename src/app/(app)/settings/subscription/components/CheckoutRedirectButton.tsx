'use client';

import React from 'react';
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon';
import classNames from 'classnames';

import Button from '~/core/ui/Button';
import configuration from '~/configuration';
import isBrowser from '~/core/generic/is-browser';
import useCsrfToken from '~/core/hooks/use-csrf-token';

const CHECKOUT_SESSION_API_ENDPOINT = configuration.paths.api.checkout;

const CheckoutRedirectButton: React.FCC<{
  disabled?: boolean;
  variantId?: number;
  recommended?: boolean;
  organizationId: Maybe<number>;
}> = ({ children, ...props }) => {
  return (
    <form
      data-cy={'checkout-form'}
      action={CHECKOUT_SESSION_API_ENDPOINT}
      method="POST"
    >
      <CheckoutFormData
        organizationId={props.organizationId}
        variantId={props.variantId}
      />

      <Button
        block
        className={classNames({
          'bg-primary-contrast text-gray-800': props.recommended,
        })}
        color={props.recommended ? 'custom' : 'secondary'}
        disabled={props.disabled}
      >
        <span className={'flex items-center space-x-2'}>
          <span>{children}</span>

          <ArrowRightIcon className={'h-5'} />
        </span>
      </Button>
    </form>
  );
};

export default CheckoutRedirectButton;

function CheckoutFormData(
  props: React.PropsWithChildren<{
    organizationId: Maybe<number>;
    variantId: Maybe<number>;
  }>
) {
  const csrfToken = useCsrfToken();

  return (
    <>
      <input
        type="hidden"
        name={'organizationId'}
        defaultValue={props.organizationId}
      />

      <input type="hidden" name={'csrf_token'} defaultValue={csrfToken} />
      <input type="hidden" name={'returnUrl'} defaultValue={getReturnUrl()} />
      <input type="hidden" name={'variantId'} defaultValue={props.variantId} />
    </>
  );
}

function getReturnUrl() {
  return isBrowser()
    ? [window.location.origin, window.location.pathname].join('')
    : undefined;
}
