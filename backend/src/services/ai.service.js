import { config } from "../config/env.js";

/**
 * Intelligent fallback email generator when Groq API key is not configured or offline.
 * Extracts key details from rough notes and formats them into a beautiful, responsive HTML email.
 */
function generateStructuredFallbackEmail(rawInput, category = "announcement") {
  const lines = (rawInput || "").split("\n").map(l => l.trim()).filter(Boolean);
  const fullText = lines.join(" ");

  // Extract common entities using heuristics
  const packageMatch = fullText.match(/(\d+(\.\d+)?\s*(lpa|lakhs?|inr|ctc))/i);
  const companyMatch = fullText.match(/\b(at|by|for|from|with)\s+([A-Z][A-Za-z0-9&.\s]{2,20})\b/i) ||
                       fullText.match(/\b([A-Z][A-Za-z0-9&]{2,20})\s+(hiring|recruitment|drive|test|interview)\b/i);
  const dateMatch = fullText.match(/\b(\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  const venueMatch = fullText.match(/\b(lab\s*\d+|audi|auditorium|hall|room\s*\d+|block\s*[A-Z]|online|google meet|teams)\b/i);

  const company = companyMatch ? (companyMatch[2] || companyMatch[1]).trim() : "Campus Partner";
  const ctc = packageMatch ? packageMatch[0].toUpperCase() : null;
  const date = dateMatch ? dateMatch[0] : null;
  const venue = venueMatch ? venueMatch[0] : "L.D. College of Engineering Campus";

  // Subject line
  const subject = ctc 
    ? `🚨 Placement Drive: ${company} (${ctc}) — Registration & Schedule Notice`
    : `📢 Official Placement Update: ${company} — L.D. College of Engineering`;

  const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
  <!-- Brand Header -->
  <div style="background: linear-gradient(135deg, #1D1D1F 0%, #0071E3 100%); padding: 32px 28px; text-align: left; color: #ffffff;">
    <div style="display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 20px; padding: 4px 14px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">
      Central Training & Placement Cell
    </div>
    <h1 style="margin: 0; font-size: 22px; font-weight: 700; line-height: 1.3; letter-spacing: -0.3px;">
      ${company} — Campus Recruitment Notice
    </h1>
    <p style="margin: 6px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.85);">
      L.D. College of Engineering • Academic Year 2025–26
    </p>
  </div>

  <!-- Content Body -->
  <div style="padding: 28px; color: #1D1D1F; font-size: 14px; line-height: 1.6;">
    <p style="margin-top: 0; font-size: 15px; font-weight: 500; color: #1D1D1F;">
      Dear Students,
    </p>
    <p style="color: #48484A;">
      Please find below the critical schedule and instructions regarding the upcoming campus drive. All eligible and registered candidates are required to take note and strictly adhere to the designated timeline.
    </p>

    <!-- Key Details Card -->
    <div style="background: #F5F5F7; border-radius: 14px; padding: 20px; margin: 24px 0; border: 1px solid rgba(0,0,0,0.04);">
      <h3 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #0071E3;">
        📋 Key Drive Parameters
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 8px 0; color: #86868B; width: 35%; font-weight: 500;">Company / Host</td>
          <td style="padding: 8px 0; color: #1D1D1F; font-weight: 600;">${company}</td>
        </tr>
        ${ctc ? `
        <tr>
          <td style="padding: 8px 0; color: #86868B; font-weight: 500;">Package Offered</td>
          <td style="padding: 8px 0; color: #34C759; font-weight: 700;">${ctc}</td>
        </tr>` : ""}
        ${date ? `
        <tr>
          <td style="padding: 8px 0; color: #86868B; font-weight: 500;">Scheduled Date</td>
          <td style="padding: 8px 0; color: #1D1D1F; font-weight: 600;">${date}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 8px 0; color: #86868B; font-weight: 500;">Reporting Venue</td>
          <td style="padding: 8px 0; color: #1D1D1F; font-weight: 600;">${venue}</td>
        </tr>
      </table>
    </div>

    <!-- Overview / Raw Notes Expanded -->
    <div style="margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #1D1D1F;">
        Brief Description & Instructions:
      </h3>
      <div style="background: #ffffff; border-left: 3.5px solid #0071E3; padding: 12px 18px; border-radius: 4px; color: #3A3A3C; font-size: 13.5px; background: #FAFAFA;">
        ${lines.map(line => `<p style="margin: 6px 0;">• ${line}</p>`).join("")}
      </div>
    </div>

    <!-- Mandatory Guidelines -->
    <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 16px 20px; margin: 24px 0;">
      <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #B45309; display: flex; align-items: center;">
        ⚠️ Mandatory Compliance & Checklist
      </h4>
      <ul style="margin: 0; padding-left: 18px; color: #92400E; font-size: 12.5px; line-height: 1.5;">
        <li style="margin-bottom: 4px;">Formal college dress code and student ID card are strictly mandatory.</li>
        <li style="margin-bottom: 4px;">Carry 2 updated hard copies of your verified resume, original marksheet copies, and a valid photo ID.</li>
        <li>Unexcused absence after confirmation will invite immediate disciplinary dismissal from placement activities.</li>
      </ul>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="${config.clientUrl || "http://localhost:3000"}/student/drives" style="display: inline-block; background: #0071E3; color: #ffffff; padding: 13px 32px; border-radius: 24px; font-weight: 600; font-size: 13px; text-decoration: none; box-shadow: 0 4px 14px rgba(0,113,227,0.3);">
        Access Placement Portal & Drives →
      </a>
    </div>
  </div>

  <!-- Signoff & Footer -->
  <div style="background: #F5F5F7; padding: 20px 28px; text-align: center; border-top: 1px solid rgba(0,0,0,0.06); font-size: 12px; color: #86868B;">
    <p style="margin: 0 0 4px 0; font-weight: 600; color: #1D1D1F;">
      Training & Placement Cell • L.D. College of Engineering
    </p>
    <p style="margin: 0; font-size: 11px;">
      Opp. Gujarat University, Navrangpura, Ahmedabad, Gujarat 380015
    </p>
  </div>
</div>
`;

  return { subject, htmlBody };
}

/**
 * Refactor rough TPO input into a professional, responsive HTML email using Groq's open-source LLM.
 * Model: llama-3.3-70b-versatile or llama-3.1-8b-instant (Free tier on Groq)
 *
 * @param {string} rawNotes - Rough 2-line notes written by the TPO
 * @param {string} [templatePreset] - Optional category or theme
 * @param {string} [customApiKey] - Optional API key provided in the request
 * @returns {Promise<{ subject: string, htmlBody: string, modelUsed: string }>}
 */
export const refactorAnnouncementWithGroq = async ({
  rawNotes,
  templatePreset = "general",
  customApiKey = null,
}) => {
  const apiKey = customApiKey || process.env.GROQ_API_KEY || config.groqApiKey;

  if (!rawNotes || !rawNotes.trim()) {
    throw new Error("Raw announcement text is required for AI refactoring.");
  }

  // If no Groq API Key is available, seamlessly use high-quality deterministic design engine
  if (!apiKey) {
    const fallback = generateStructuredFallbackEmail(rawNotes, templatePreset);
    return {
      ...fallback,
      modelUsed: "local-template-engine (Set GROQ_API_KEY for Llama 3.3)",
    };
  }

  const systemPrompt = `You are a world-class executive communication specialist and senior HTML email designer for the Training & Placement Cell of L.D. College of Engineering (LDCE), Ahmedabad.
Your job is to transform rough, terse notes (often 1-3 lines) provided by the TPO coordinator into an immaculate, professional, and visually stunning HTML email for undergraduate engineering students.

DESIGN GUIDELINES:
- Output MUST look like a premium corporate / Apple-inspired notification.
- Use a clean palette: Dark navy/slate header (#1D1D1F or #0F172A), Apple Blue accents (#0071E3), clean light gray cards (#F5F5F7), vibrant green for compensation (#16A34A).
- Use inline CSS styling ONLY, since this will be rendered directly inside email clients (Gmail, Outlook, Apple Mail).
- Include:
  1. A sleek branded header for "Central Training & Placement Cell, L.D. College of Engineering".
  2. A warm yet formal opening greeting.
  3. A beautifully formatted "Key Details" summary grid or table (Company, Role, Package CTC, Reporting Date & Time, Venue, Eligibility).
  4. Structured bullet points explaining all critical requirements, documents to carry, and dress code.
  5. An amber/red highlight callout box for attendance discipline and mandatory college placement rules.
  6. A prominent styled Call-To-Action button ("View Drive in Placement Portal" linking to "#").
  7. Official TPO sign-off footer with Ahmedabad campus address.

RESPONSE FORMAT:
You MUST respond with valid JSON ONLY and no markdown wrapping (no \`\`\`json code blocks, just raw JSON).
The JSON object must have exactly two keys:
{
  "subject": "Clear, compelling subject line with an appropriate emoji (e.g. 🚨 Campus Placement Drive: ...)",
  "htmlBody": "Complete inline-styled HTML string suitable for email body"
}`;

  const userPrompt = `TPO Rough Notes:
"""
${rawNotes.trim()}
"""

Template Context: ${templatePreset}

Transform this into a fully designed, responsive HTML email with an attractive subject line now.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`Groq API returned error status ${response.status}:`, errText);
      // Fallback gracefully
      const fallback = generateStructuredFallbackEmail(rawNotes, templatePreset);
      return {
        ...fallback,
        modelUsed: `local-template-engine (Groq returned ${response.status})`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from Groq API");
    }

    const parsed = JSON.parse(content);
    return {
      subject: parsed.subject || "Placement Announcement — L.D. College of Engineering",
      htmlBody: parsed.htmlBody || generateStructuredFallbackEmail(rawNotes, templatePreset).htmlBody,
      modelUsed: data.model || "llama-3.3-70b-versatile",
    };
  } catch (error) {
    console.warn("Groq AI refactor error, using fallback engine:", error.message);
    const fallback = generateStructuredFallbackEmail(rawNotes, templatePreset);
    return {
      ...fallback,
      modelUsed: `local-template-engine (${error.message})`,
    };
  }
};
