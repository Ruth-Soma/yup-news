// ─── YUP Email Templates ──────────────────────────────────────────────────────
// All CSS is inline for maximum email client compatibility.
// Table-based layout for Outlook support.
// Color palette mirrors the site design.

const SITE_URL = 'https://yup.ng'
const BRAND    = 'yup'

/** Escape HTML special chars — prevents XSS when embedding DB/user content in email HTML */
function escHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// ─── Base wrapper ─────────────────────────────────────────────────────────────

function base(content: string, previewText = ''): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>YUP News</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f0ede6;font-family:Georgia,serif;">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;color:#f0ede6;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0ede6;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Masthead ─────────────────────────────────────────────────────────────────

function masthead(label = ''): string {
  return `
  <tr>
    <td style="background-color:#1a1a1a;padding:28px 36px 24px;" align="left">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <a href="${SITE_URL}" style="text-decoration:none;">
              <span style="font-family:Georgia,serif;font-size:28px;font-weight:bold;color:#f0ede6;letter-spacing:-0.03em;">${BRAND}</span>
            </a>
          </td>
          ${label ? `<td align="right" valign="middle">
            <span style="font-family:Arial,sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:rgba(240,237,230,0.45);">${label}</span>
          </td>` : ''}
        </tr>
      </table>
    </td>
  </tr>`
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function divider(): string {
  return `<tr><td style="height:1px;background-color:#e2dfd7;font-size:0;line-height:0;">&nbsp;</td></tr>`
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function footer(unsubscribeUrl = ''): string {
  return `
  ${divider()}
  <tr>
    <td style="background-color:#1a1a1a;padding:24px 36px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <p style="font-family:Arial,sans-serif;font-size:11px;color:rgba(240,237,230,0.35);margin:0 0 6px;line-height:1.6;">
              © ${new Date().getFullYear()} YUP Media Ltd. AI-assisted journalism. All rights reserved.
            </p>
            <p style="font-family:Arial,sans-serif;font-size:11px;color:rgba(240,237,230,0.25);margin:0;line-height:1.6;">
              You're receiving this because you subscribed at yup.ng.
              ${unsubscribeUrl ? `&nbsp;·&nbsp;<a href="${unsubscribeUrl}" style="color:rgba(240,237,230,0.4);text-decoration:underline;">Unsubscribe</a>` : ''}
            </p>
          </td>
          <td align="right" valign="top">
            <a href="${SITE_URL}" style="font-family:Georgia,serif;font-size:18px;font-weight:bold;color:rgba(240,237,230,0.2);text-decoration:none;letter-spacing:-0.02em;">${BRAND}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

// ─── OTP / Verification template ─────────────────────────────────────────────

export function otpEmail(opts: {
  otp: string
  heading: string
  subheading: string
  note?: string
}): string {
  const { otp, heading, subheading, note } = opts
  const content = `
  ${masthead()}
  <tr>
    <td style="background-color:#ffffff;padding:48px 36px 40px;">
      <p style="font-family:Arial,sans-serif;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.16em;color:#999;margin:0 0 20px;">Verification</p>
      <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:bold;color:#1a1a1a;margin:0 0 10px;line-height:1.15;letter-spacing:-0.02em;">${heading}</h1>
      <p style="font-family:Arial,sans-serif;font-size:14px;color:#666;margin:0 0 36px;line-height:1.65;">${subheading}</p>

      <!-- OTP box -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
        <tr>
          <td align="center" style="background-color:#f7f6f2;border:1px solid #e2dfd7;padding:28px 16px;">
            <span style="font-family:'Courier New',Courier,monospace;font-size:44px;font-weight:bold;letter-spacing:12px;color:#1a1a1a;line-height:1;">${otp}</span>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        <tr>
          <td style="border-left:3px solid #e2dfd7;padding:0 0 0 16px;">
            <p style="font-family:Arial,sans-serif;font-size:13px;color:#888;margin:0;line-height:1.6;">
              This code expires in <strong style="color:#555;">15 minutes</strong>. Do not share it with anyone.
            </p>
          </td>
        </tr>
      </table>

      ${note ? `<p style="font-family:Arial,sans-serif;font-size:12px;color:#bbb;margin:0;line-height:1.6;">${note}</p>` : ''}
    </td>
  </tr>
  ${footer()}`

  return base(content, `Your ${BRAND} verification code is ${otp}`)
}

// ─── Newsletter template ──────────────────────────────────────────────────────

export interface NewsletterPost {
  title: string
  slug: string
  excerpt?: string
  cover_image?: string | null
  category?: string
  source_name?: string
  published_at?: string
}

export function newsletterEmail(opts: {
  posts: NewsletterPost[]
  date: string
  unsubscribeUrl: string
}): string {
  const { posts, date, unsubscribeUrl } = opts
  const lead = posts[0]
  const secondary = posts.slice(1, 3)
  const rest = posts.slice(3, 7)

  const categoryLabel = (cat?: string) =>
    (cat || 'News').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const heroSection = lead ? `
  <tr>
    <td style="background-color:#ffffff;padding:0;">
      ${lead.cover_image ? `
      <a href="${SITE_URL}/post/${lead.slug}" style="display:block;text-decoration:none;">
        <img src="${lead.cover_image}" alt="${escHtml(lead.title)}" width="600" style="width:100%;max-width:600px;height:auto;display:block;border:0;" />
      </a>` : ''}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:32px 36px 28px;">
            <p style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.16em;color:#999;margin:0 0 14px;">${categoryLabel(lead.category)}</p>
            <a href="${SITE_URL}/post/${lead.slug}" style="text-decoration:none;">
              <h2 style="font-family:Georgia,serif;font-size:26px;font-weight:bold;color:#1a1a1a;margin:0 0 12px;line-height:1.18;letter-spacing:-0.02em;">${escHtml(lead.title)}</h2>
            </a>
            ${lead.excerpt ? `<p style="font-family:Arial,sans-serif;font-size:14px;color:#555;margin:0 0 20px;line-height:1.7;">${escHtml(lead.excerpt)}</p>` : ''}
            <a href="${SITE_URL}/post/${lead.slug}" style="display:inline-block;background-color:#1a1a1a;color:#f0ede6;font-family:Arial,sans-serif;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;text-decoration:none;padding:11px 22px;">Read Full Story →</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : ''

  const secondarySection = secondary.length > 0 ? `
  ${divider()}
  <tr>
    <td style="background-color:#ffffff;padding:0 36px 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${secondary.map((post, i) => `
          <td width="50%" valign="top" style="padding:28px ${i === 0 ? '20px 20px 20px 0' : '0 0 20px 20px'};">
            ${post.cover_image ? `
            <a href="${SITE_URL}/post/${post.slug}" style="display:block;text-decoration:none;margin-bottom:14px;">
              <img src="${post.cover_image}" alt="${escHtml(post.title)}" width="248" style="width:100%;height:auto;display:block;border:0;" />
            </a>` : ''}
            <p style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#999;margin:0 0 8px;">${categoryLabel(post.category)}</p>
            <a href="${SITE_URL}/post/${post.slug}" style="text-decoration:none;">
              <h3 style="font-family:Georgia,serif;font-size:16px;font-weight:bold;color:#1a1a1a;margin:0 0 8px;line-height:1.3;letter-spacing:-0.01em;">${escHtml(post.title)}</h3>
            </a>
            ${post.excerpt ? `<p style="font-family:Arial,sans-serif;font-size:12px;color:#777;margin:0;line-height:1.6;">${escHtml(post.excerpt.substring(0, 100))}${post.excerpt.length > 100 ? '…' : ''}</p>` : ''}
          </td>`).join('<td width="1" style="background-color:#e2dfd7;font-size:0;line-height:0;">&nbsp;</td>')}
        </tr>
      </table>
    </td>
  </tr>` : ''

  const restSection = rest.length > 0 ? `
  ${divider()}
  <tr>
    <td style="background-color:#f7f6f2;padding:8px 0;">
      ${rest.map(post => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:20px 36px;border-bottom:1px solid #e2dfd7;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="top" style="padding-right:16px;">
                  <p style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#999;margin:0 0 6px;">${categoryLabel(post.category)}</p>
                  <a href="${SITE_URL}/post/${post.slug}" style="text-decoration:none;">
                    <h4 style="font-family:Georgia,serif;font-size:15px;font-weight:bold;color:#1a1a1a;margin:0 0 5px;line-height:1.35;letter-spacing:-0.01em;">${escHtml(post.title)}</h4>
                  </a>
                  ${post.source_name ? `<p style="font-family:Arial,sans-serif;font-size:11px;color:#aaa;margin:0;">${escHtml(post.source_name)}</p>` : ''}
                </td>
                ${post.cover_image ? `
                <td valign="top" width="88" style="flex-shrink:0;">
                  <a href="${SITE_URL}/post/${post.slug}" style="display:block;text-decoration:none;">
                    <img src="${post.cover_image}" alt="${escHtml(post.title)}" width="88" height="60" style="width:88px;height:60px;object-fit:cover;display:block;border:0;" />
                  </a>
                </td>` : ''}
              </tr>
            </table>
          </td>
        </tr>
      </table>`).join('')}
    </td>
  </tr>` : ''

  const content = `
  ${masthead(date)}
  <tr>
    <td style="background-color:#1a1a1a;padding:0 36px 28px;">
      <p style="font-family:Georgia,serif;font-size:15px;color:rgba(240,237,230,0.55);margin:0;font-style:italic;line-height:1.5;">Your daily briefing — the stories that matter, nothing that doesn't.</p>
    </td>
  </tr>
  ${heroSection}
  ${secondarySection}
  ${restSection}
  ${divider()}
  <tr>
    <td style="background-color:#ffffff;padding:28px 36px;" align="center">
      <a href="${SITE_URL}" style="display:inline-block;border:1px solid #1a1a1a;color:#1a1a1a;font-family:Arial,sans-serif;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;text-decoration:none;padding:12px 28px;">Read More at yup.ng →</a>
    </td>
  </tr>
  ${footer(unsubscribeUrl)}`

  return base(content, `Your YUP daily briefing — ${posts.length} stories you need to read today`)
}
