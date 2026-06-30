import { BMC_USERNAME_DEFAULT, getBmcPageUrl } from '../../shared/monetization/bmc-config.js';

const BMC_USERNAME =
  process.env.EXPO_PUBLIC_BMC_USERNAME?.trim() ||
  BMC_USERNAME_DEFAULT;

export function getMobileBmcPageUrl() {
  return getBmcPageUrl(BMC_USERNAME);
}

export function isMobileBmcConfigured() {
  return Boolean(BMC_USERNAME);
}
