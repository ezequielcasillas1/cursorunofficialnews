import { DEFAULT_CATEGORY_ITEM_LIMIT } from '../../../shared/notifications/category-limits.js';
import { escapeJsString } from './escape.js';
import { RESUBSCRIBE_EMPTY_TOPICS_ERROR } from './resubscribe-payload.js';

export function buildResubscribeClientScript(token) {
  const safeToken = escapeJsString(token);

  return `(function () {
  var token = '${safeToken}';
  var form = document.getElementById('resubscribe-form');
  var errorEl = document.getElementById('form-error');
  var successEl = document.getElementById('form-success');
  var submitBtn = document.getElementById('resubscribe-btn');

  form.querySelectorAll('input[name="category"]').forEach(function (checkbox) {
    checkbox.addEventListener('change', function () {
      var limitLabel = form.querySelector('[data-limit-for="' + checkbox.value + '"]');
      if (limitLabel) limitLabel.hidden = !checkbox.checked;
    });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    errorEl.hidden = true;
    successEl.hidden = true;

    var categories = Array.from(form.querySelectorAll('input[name="category"]:checked')).map(function (el) {
      return el.value;
    });
    if (categories.length === 0) {
      errorEl.textContent = '${escapeJsString(RESUBSCRIBE_EMPTY_TOPICS_ERROR)}';
      errorEl.hidden = false;
      return;
    }

    var categoryLimits = {};
    categories.forEach(function (categoryId) {
      var select = form.querySelector('select[name="limit-' + categoryId + '"]');
      categoryLimits[categoryId] = select ? Number(select.value) : ${DEFAULT_CATEGORY_ITEM_LIMIT};
    });

    submitBtn.disabled = true;
    submitBtn.textContent = 'Resubscribing…';

    var membershipToken = '';
    try {
      membershipToken = localStorage.getItem('cain_membership_token') || '';
    } catch (e) {
      membershipToken = '';
    }

    fetch('/api/v1/email/resubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        token: token,
        categories: categories,
        categoryLimits: categoryLimits,
        membershipToken: membershipToken,
      }),
    })
      .then(function (response) {
        return response.json().then(function (body) {
          return { ok: response.ok, body: body };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          throw new Error(result.body.error || 'Resubscribe failed. Please try again.');
        }
        if (result.body.pending) {
          successEl.textContent = result.body.message || 'Check your email to confirm your subscription.';
        } else {
          successEl.textContent = 'You are resubscribed. Digest emails will resume for your selected topics.';
        }
        successEl.hidden = false;
        form.querySelector('.topics').hidden = true;
        submitBtn.hidden = true;
      })
      .catch(function (err) {
        errorEl.textContent = err.message || 'Resubscribe failed. Please try again.';
        errorEl.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Resubscribe';
      });
  });
})();`;
}
