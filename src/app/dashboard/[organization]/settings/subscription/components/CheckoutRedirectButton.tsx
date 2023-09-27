'use client';

import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import classNames from 'clsx';

import Button from '~/core/ui/Button';
import isBrowser from '~/core/generic/is-browser';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { createCheckoutSessionAction } from '~/lib/ls/actions';

const CheckoutRedirectButton: React.FCC<{
  disabled?: boolean;
  variantId?: number;
  recommended?: boolean;
  organizationUid: Maybe<string>;
}> = ({ children, ...props }) => {
  return (
    <form data-cy={'checkout-form'} action={createCheckoutSessionAction}>
      <CheckoutFormData
        organizationUid={props.organizationUid}
        variantId={props.variantId}
      />

      <Button
        block
        className={classNames({
          'text-foreground bg-background dark:bg-white dark:text-gray-900':
            props.recommended,
        })}
        variant={props.recommended ? 'custom' : 'secondary'}
        disabled={props.disabled}
      >
        <span className={'flex items-center space-x-2'}>
          <span>{children}</span>

          <ChevronRightIcon className={'h-4'} />
        </span>
      </Button>
    </form>
  );
};

export default CheckoutRedirectButton;

function CheckoutFormData(
  props: React.PropsWithChildren<{
    organizationUid: Maybe<string>;
    variantId: Maybe<number>;
  }>,
) {
  const csrfToken = useCsrfToken();

  return (
    <>
      <input
        type="hidden"
        name={'organizationUid'}
        defaultValue={props.organizationUid}
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
