import type { Provider } from '@supabase/gotrue-js/src/lib/types';

const production = process.env.NODE_ENV === 'production';

enum Themes {
  Light = 'light',
  Dark = 'dark',
}

const configuration = {
  site: {
    name: 'Awesomely - Your SaaS Title',
    description: 'Your SaaS Description',
    themeColor: '#ffffff',
    themeColorDark: '#0a0a0a',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'Awesomely',
    twitterHandle: '',
    githubHandle: '',
    language: 'en',
    convertKitFormId: '',
    locale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
  },
  auth: {
    // ensure this is the same as your Supabase project. By default - it's true
    requireEmailConfirmation:
      process.env.NEXT_PUBLIC_REQUIRE_EMAIL_CONFIRMATION === 'true',
    // NB: Enable the providers below in the Supabase Console
    // in your production project
    providers: {
      emailPassword: true,
      phoneNumber: false,
      emailLink: false,
      oAuth: ['google'] as Provider[],
    },
  },
  production,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
  enableThemeSwitcher: true,
  theme: Themes.Light,
  paths: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    signInMfa: '/auth/verify',
    onboarding: `/onboarding`,
    appPrefix: '/dashboard',
    appHome: '/dashboard',
    authCallback: '/auth/callback',
    settings: {
      profile: 'settings/profile',
      authentication: 'settings/profile/authentication',
      email: 'settings/profile/email',
      password: 'settings/profile/password',
    },
  },
  sentry: {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
  subscriptions: {
    products: [
      {
        name: 'Basic',
        productId: 57713,
        description: 'Description of your Basic plan',
        badge: `Up to 20 users`,
        features: [
          'Basic Reporting',
          'Up to 20 users',
          '1GB for each user',
          'Chat Support',
        ],
        plans: [
          {
            name: 'Monthly',
            price: '$9',
            variantId: 55476,
          },
          {
            name: 'Yearly',
            price: '$90',
            variantId: 55512,
          },
        ],
      },
      {
        name: 'Pro',
        badge: `Most Popular`,
        recommended: true,
        productId: 57719,
        description: 'Description of your Pro plan',
        features: [
          'Advanced Reporting',
          'Up to 50 users',
          '5GB for each user',
          'Chat and Phone Support',
        ],
        plans: [
          {
            name: 'Monthly',
            price: '$29',
            variantId: 55483,
            trialPeriodDays: 0,
          },
          {
            name: 'Yearly',
            price: '$200',
            variantId: 55482,
            trialPeriodDays: 0,
          },
        ],
      },
      {
        name: 'Premium',
        description: 'Description of your Premium plan',
        badge: ``,
        features: [
          'Advanced Reporting',
          'Unlimited users',
          '50GB for each user',
          'Account Manager',
        ],
        plans: [
          {
            name: '',
            price: 'Contact us',
            variantId: 0,
            label: `Contact us`,
            href: `/contact`,
          },
        ],
      },
    ],
  },
};

export default configuration;
