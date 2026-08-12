const ENV = process.env.APP_ENV || 'development';

const WEBSITE_URL =
  process.env.EXPO_PUBLIC_WEB_URL ||
  (ENV === 'production'
    ? 'https://bizrecord.tech'
    : 'http://localhost:3001');

export const getWebsiteUrl = () => WEBSITE_URL.replace(/\/$/, '');

export const getSubscriptionUrl = () => `${getWebsiteUrl()}/subscription`;

export const getRegisterUrl = () => `${getWebsiteUrl()}/register`;
