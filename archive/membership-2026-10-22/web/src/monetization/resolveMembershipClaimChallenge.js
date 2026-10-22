export function resolveMembershipClaimChallenge(errorLike) {
  if (!errorLike || errorLike.code !== 'CAPTCHA_REQUIRED') {
    return {
      captchaRequired: false,
      siteKey: '',
      error: errorLike?.message || '',
    };
  }

  return {
    captchaRequired: true,
    siteKey: String(errorLike.siteKey || '').trim(),
    error: errorLike.message || 'Complete the CAPTCHA to send another restore link.',
  };
}
