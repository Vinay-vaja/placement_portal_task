import Brevo from "@getbrevo/brevo";
import { config } from "./env.js";

let apiInstance = null;

/**
 * Get or create the Brevo transactional email API instance
 */
export const getBrevoApi = () => {
  if (!config.brevoApiKey) {
    return null;
  }

  if (!apiInstance) {
    apiInstance = new Brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      config.brevoApiKey
    );
  }

  return apiInstance;
};

/**
 * Send a transactional email via Brevo
 * @param {Object} options
 * @param {string|string[]} options.to - recipient email(s)
 * @param {string} options.subject - email subject
 * @param {string} options.htmlContent - email HTML body
 * @param {string} [options.textContent] - plain text fallback
 * @returns {Promise<Object>} Brevo response
 */
export const sendEmail = async ({ to, subject, htmlContent, textContent }) => {
  const api = getBrevoApi();

  if (!api) {
    console.warn("[EMAIL] Brevo API key not configured — email not sent");
    return { skipped: true, reason: "BREVO_API_KEY not configured" };
  }

  const recipients = Array.isArray(to) ? to : [to];

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.sender = {
    email: config.brevoSenderEmail,
    name: config.brevoSenderName,
  };
  sendSmtpEmail.to = recipients.map((email) => ({ email }));
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;
  if (textContent) {
    sendSmtpEmail.textContent = textContent;
  }

  const response = await api.sendTransacEmail(sendSmtpEmail);
  return response;
};

/**
 * Send bulk emails (up to 50 per batch as per Brevo limits)
 * @param {Array<{email: string, params?: Object}>} recipients
 * @param {string} subject
 * @param {string} htmlContent - use {{params.NAME}} for personalization
 */
export const sendBulkEmail = async (recipients, subject, htmlContent) => {
  const api = getBrevoApi();

  if (!api) {
    console.warn("[EMAIL] Brevo API key not configured — bulk email not sent");
    return { skipped: true, reason: "BREVO_API_KEY not configured" };
  }

  const BATCH_SIZE = 50;
  const results = [];

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    // Send individual emails for personalization
    const batchPromises = batch.map(async (recipient) => {
      try {
        const sendSmtpEmail = new Brevo.SendSmtpEmail();
        sendSmtpEmail.sender = {
          email: config.brevoSenderEmail,
          name: config.brevoSenderName,
        };
        sendSmtpEmail.to = [{ email: recipient.email }];
        sendSmtpEmail.subject = subject;

        // Replace template params if provided
        let personalizedHtml = htmlContent;
        if (recipient.params) {
          Object.entries(recipient.params).forEach(([key, value]) => {
            personalizedHtml = personalizedHtml.replace(
              new RegExp(`{{${key}}}`, "g"),
              value
            );
          });
        }
        sendSmtpEmail.htmlContent = personalizedHtml;

        const response = await api.sendTransacEmail(sendSmtpEmail);
        return { email: recipient.email, status: "SENT", response };
      } catch (error) {
        return {
          email: recipient.email,
          status: "FAILED",
          error: error.message,
        };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    results.push(
      ...batchResults.map((r) => (r.status === "fulfilled" ? r.value : r.reason))
    );
  }

  return results;
};
