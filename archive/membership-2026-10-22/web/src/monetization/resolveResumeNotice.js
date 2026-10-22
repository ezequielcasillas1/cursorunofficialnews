/**
 * Maps the resume API payload into copy the cancel page can render.
 */
export function resolveResumeNotice(data) {
  if (!data?.ok && !data?.notice) return null;

  const notice = data.notice || {};
  const headline =
    notice.headline || (data.alreadyResumed ? 'Membership already renewing' : 'Membership resumed');
  const summary =
    notice.summary || 'Billing will continue. Your membership stays active.';

  return {
    headline,
    summary,
    alreadyResumed: Boolean(notice.alreadyResumed || data.alreadyResumed),
    nextRenewal: notice.nextRenewal || null,
    emailedTo: notice.email || data.email || null,
  };
}

export function canShowResubscribe({ cancelReceipt, cancelEligibility, resumeNotice } = {}) {
  if (resumeNotice) return false;
  if (cancelReceipt?.immediate) return false;
  if (cancelReceipt?.canResubscribe) return true;
  return Boolean(cancelEligibility?.resumable || cancelEligibility?.alreadyScheduled);
}
