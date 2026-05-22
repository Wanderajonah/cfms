const Feedback = require('../models/feedback');
const { generateSmsReply, truncateSms } = require('./aiSmsReply');
const { sendSms, normalizePhone } = require('./commsSms');

function truthyEnv(name) {
  const v = String(process.env[name] ?? '')
    .trim()
    .toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function shouldSkipComplaint(fb) {
  if (fb.type !== 'complaint') return false;
  if (truthyEnv('AUTO_AI_SMS_SKIP_COMPLAINTS')) return true;
  // Legacy: explicit false skips complaints
  const legacy = String(process.env.AUTO_AI_SMS_COMPLAINTS ?? '')
    .trim()
    .toLowerCase();
  if (legacy === 'false' || legacy === '0') return true;
  return false;
}

function buildFallbackSms(fb) {
  const brand = String(process.env.AI_BRAND_NAME || 'FeedbackHub').trim();
  const name = fb.name && String(fb.name).trim() ? String(fb.name).trim().split(/\s+/)[0] : 'there';
  const base = `Hi ${name}, thanks for your feedback! We'll review it and follow up if needed. - ${brand}`;
  return truncateSms(base);
}

function truthyFallbackEnabled() {
  const v = String(process.env.AUTO_AI_SMS_FALLBACK ?? 'true')
    .trim()
    .toLowerCase();
  return v !== '0' && v !== 'false' && v !== 'no';
}

/**
 * One attempt: AI SMS (or fallback on last attempt), then Comms send.
 * @param {string} feedbackId
 * @param {{ attempt: number; isLast: boolean }} meta
 */
async function attemptAutoAiFeedbackSms(feedbackId, meta) {
  if (!truthyEnv('AUTO_AI_SMS_ENABLED')) {
    if (meta.attempt === 1) {
      await Feedback.findByIdAndUpdate(feedbackId, { automatedSmsSkipped: 'disabled' }).catch(() => {});
    }
    return;
  }

  const fb = await Feedback.findById(feedbackId);
  if (!fb) return;

  if (fb.automatedSmsAt) return;

  const phone = fb.phone && String(fb.phone).trim();
  if (!phone) {
    if (meta.attempt === 1) {
      await Feedback.findByIdAndUpdate(feedbackId, { automatedSmsSkipped: 'no_phone' });
    }
    return;
  }

  const normalized = normalizePhone(phone);
  if (!normalized || normalized.length < 10) {
    if (meta.attempt === 1) {
      await Feedback.findByIdAndUpdate(feedbackId, { automatedSmsSkipped: 'invalid_phone' });
    }
    return;
  }

  const groqKey = String(process.env.GROQ_API_KEY ?? '').trim();
  if (!groqKey) {
    if (meta.attempt === 1) {
      await Feedback.findByIdAndUpdate(feedbackId, { automatedSmsSkipped: 'no_groq' });
    }
    console.error('[auto-ai-sms]', feedbackId, 'GROQ_API_KEY is empty — set it in backend/.env');
    return;
  }

  if (shouldSkipComplaint(fb)) {
    if (meta.attempt === 1) {
      await Feedback.findByIdAndUpdate(feedbackId, { automatedSmsSkipped: 'complaint_policy' });
    }
    return;
  }

  let smsBody;
  try {
    smsBody = await generateSmsReply({
      message: fb.message,
      type: fb.type,
      rating: fb.rating,
      category: fb.category,
      name: fb.name,
    });
  } catch (e) {
    const msg = e?.message || 'AI generation failed';
    console.error('[auto-ai-sms]', feedbackId, 'Groq error:', msg);
    if (meta.isLast && truthyFallbackEnabled()) {
      smsBody = buildFallbackSms(fb);
      await Feedback.findByIdAndUpdate(feedbackId, {
        automatedSmsError: `AI failed, using fallback: ${msg}`,
      }).catch(() => {});
    } else {
      await Feedback.findByIdAndUpdate(feedbackId, {
        automatedSmsError: msg,
      }).catch(() => {});
      return;
    }
  }

  try {
    await sendSms({ toNumber: phone, message: smsBody });
    await Feedback.findByIdAndUpdate(feedbackId, {
      $set: {
        automatedSmsAt: new Date(),
        automatedSmsBody: smsBody,
        automatedSmsError: null,
        response: smsBody,
        respondedAt: new Date(),
      },
      $unset: { automatedSmsSkipped: 1 },
    });
  } catch (e) {
    const msg = e?.message || 'SMS send failed';
    console.error('[auto-ai-sms]', feedbackId, 'Comms error:', msg);
    await Feedback.findByIdAndUpdate(feedbackId, {
      automatedSmsBody: smsBody,
      automatedSmsError: msg,
    }).catch(() => {});
  }
}

/**
 * Retries within ~2 minutes so transient Groq/Comms failures still deliver.
 * @param {string} feedbackId
 */
function scheduleAutoAiFeedbackSms(feedbackId) {
  const delays = [0, 45_000, 90_000, 115_000];
  delays.forEach((delayMs, index) => {
    const attempt = index + 1;
    const isLast = index === delays.length - 1;
    setTimeout(() => {
      attemptAutoAiFeedbackSms(feedbackId, { attempt, isLast }).catch((err) => {
        console.error('[auto-ai-sms]', feedbackId, 'attempt', attempt, err);
      });
    }, delayMs);
  });
}

module.exports = { scheduleAutoAiFeedbackSms, attemptAutoAiFeedbackSms };
