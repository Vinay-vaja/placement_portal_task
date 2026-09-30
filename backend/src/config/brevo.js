import { BrevoClient } from "@getbrevo/brevo";
import { config } from "./env.js";

let clientInstance = null;

/**
 * Get or create the BrevoClient API instance
 */
export const getBrevoApi = () => {
  if (!config.brevoApiKey) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = new BrevoClient({
      apiKey: config.brevoApiKey,
    });
  }

  return clientInstance;
};

/**
 * Send a transactional email via Brevo
 * @param {Object} options
 * @param {string|string[]} options.to - recipient email(s)
 * @param {string} options.subject - email subject
 * @param {string} options.htmlContent - email HTML body
 * @param {string} [options.textContent] - plain text fallback
 * @returns {Promise<Object>} delivery result
 */
export const sendEmail = async ({ to, subject, htmlContent, textContent }) => {
  const client = getBrevoApi();
  const recipients = Array.isArray(to) ? to : [to];

  if (!client) {
    console.warn("[EMAIL] Brevo API key not configured — email not sent");
    return {
      success: false,
      skipped: true,
      error: "BREVO_API_KEY not configured",
    };
  }

  try {
    const response = await client.transactionalEmails.sendTransacEmail({
      sender: {
        email: config.brevoSenderEmail,
        name: config.brevoSenderName,
      },
      to: recipients.map((email) => ({ email })),
      subject,
      htmlContent,
      textContent: textContent || undefined,
    });

    return { success: true, response };
  } catch (error) {
    const errorMsg =
      error.body?.message || error.response?.body?.message || error.message || "Failed to send email via Brevo";
    console.warn("[EMAIL] Failed to send email via Brevo:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Send bulk emails (up to 50 per batch as per Brevo limits)
 * @param {Array<{email: string, params?: Object}>} recipients
 * @param {string} subject
 * @param {string} htmlContent - use {{params.NAME}} for personalization
 */
export const sendBulkEmail = async (recipients, subject, htmlContent) => {
  if (!recipients || recipients.length === 0) {
    return [];
  }

  const client = getBrevoApi();

  if (!client) {
    console.warn("[EMAIL] Brevo API key not configured — returning simulated logs");
    return recipients.map((r) => ({
      email: r.email,
      status: "FAILED",
      error: "BREVO_API_KEY not configured in environment",
    }));
  }

  const BATCH_SIZE = 50;
  const results = [];

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    // Send individual emails for personalization and accurate status tracking
    const batchPromises = batch.map(async (recipient) => {
      try {
        let personalizedHtml = htmlContent;
        if (recipient.params) {
          Object.entries(recipient.params).forEach(([key, value]) => {
            personalizedHtml = personalizedHtml.replace(
              new RegExp(`{{${key}}}`, "g"),
              value
            );
          });
        }

        const response = await client.transactionalEmails.sendTransacEmail({
          sender: {
            email: config.brevoSenderEmail,
            name: config.brevoSenderName,
          },
          to: [{ email: recipient.email }],
          subject,
          htmlContent: personalizedHtml,
        });

        return { email: recipient.email, status: "SENT", response };
      } catch (error) {
        const errorMsg =
          error.body?.message ||
          error.response?.body?.message ||
          error.message ||
          "Failed to send email";
        return {
          email: recipient.email,
          status: "FAILED",
          error: errorMsg,
        };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    results.push(
      ...batchResults.map((r) =>
        r.status === "fulfilled"
          ? r.value
          : { email: "unknown", status: "FAILED", error: r.reason?.message || "Delivery rejected" }
      )
    );
  }

  return results;
};
