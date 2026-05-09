import {
	SESClient,
	SendEmailCommand,
	type SendEmailCommandInput,
} from '@aws-sdk/client-ses'
import * as Sentry from '@sentry/nextjs'

import { env } from '@/env.mjs'

import enMessages from '../../messages/en.json'
import esMessages from '../../messages/es.json'
import caMessages from '../../messages/ca.json'

export type EmailLocale = 'ca' | 'en' | 'es'

interface EmailParams {
	recipientEmail: string
	recipientName: string
	locale?: EmailLocale
}

interface WelcomeEmailParams extends EmailParams {
	verificationUrl?: string
}

interface VerificationEmailParams extends EmailParams {
	verificationUrl: string
}

interface EmailChangeVerificationEmailParams extends EmailParams {
	verificationUrl: string
}

interface EmailChangedNotificationEmailParams extends EmailParams {
	newEmail: string
}

interface PasswordResetEmailParams extends EmailParams {
	resetUrl: string
}

const messagesMap = {
	ca: caMessages,
	en: enMessages,
	es: esMessages,
} as const

const appUrl = env.NEXT_PUBLIC_SITE_URL
const faviconUrl = new URL('/images/favicon.png', appUrl).toString()
const wordmarkUrl = new URL('/images/email-wordmark.png', appUrl).toString()
let ses: SESClient | null = null

const emailColors = {
	forest50: '#fefff2',
	forest100: '#eaf0e2',
	forest150: '#d9e3d4',
	forest200: '#789b84',
	forest300: '#5a8470',
} as const

async function sendEmail(input: SendEmailCommandInput, action: string) {
	if (!env.EMAILS_ENABLED) return false

	if (!env.AMAZON_REGION || !env.AMAZON_SES_FROM_EMAIL) {
		Sentry.captureException(
			new Error('Email support is enabled but AWS SES is not configured'),
			{ tags: { action } },
		)
		return false
	}

	try {
		ses ??= new SESClient({ region: env.AMAZON_REGION })
		await ses.send(new SendEmailCommand(input))
		return true
	} catch (error) {
		Sentry.captureException(error, { tags: { action } })
		return false
	}
}

function getEmailTranslations(locale: EmailLocale = 'en') {
	return messagesMap[locale] ?? messagesMap.en
}

function replacePlaceholders(
	value: string,
	values: Record<string, string | number>,
) {
	return Object.entries(values).reduce(
		(result, [key, replacement]) =>
			result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(replacement)),
		value,
	)
}

function escapeHtml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')
}

function renderLayout({
	locale,
	title,
	subtitle,
	body,
	footer,
}: {
	locale: EmailLocale
	title: string
	subtitle?: string
	body: string
	footer: string
}) {
	return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background: ${emailColors.forest100}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; overflow: hidden; border-radius: 18px; background: ${emailColors.forest50}; border: 4px solid ${emailColors.forest150};">
          <tr>
            <td style="padding: 32px 36px 24px; background: ${emailColors.forest200}; color: ${emailColors.forest50};">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 16px;">
                <tr>
                  <td height="42" valign="middle" style="height: 42px; padding: 0 12px 0 0; vertical-align: middle; line-height: 0;">
                    <img src="${escapeHtml(faviconUrl)}" width="42" height="42" alt="" style="display: block; width: 42px; height: 42px; border: 0; border-radius: 12px;">
                  </td>
                  <td height="42" valign="middle" style="height: 42px; padding: 0; vertical-align: middle; line-height: 0;">
                    <img src="${escapeHtml(wordmarkUrl)}" width="159" height="42" alt="CookBook" style="display: block; width: 159px; height: 42px; border: 0;">
                  </td>
                </tr>
              </table>
              <h1 style="margin: 0; font-size: 28px; line-height: 1.2; font-weight: 800;">${escapeHtml(title)}</h1>
              ${
					subtitle
						? `<p style="margin: 10px 0 0; font-size: 15px; line-height: 1.5; font-weight: 600;">${escapeHtml(subtitle)}</p>`
						: ''
				}
            </td>
          </tr>
          <tr>
            <td style="padding: 34px 36px; color: ${emailColors.forest300}; font-size: 16px; line-height: 1.7;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding: 22px 36px; border-top: 4px solid ${emailColors.forest150}; color: ${emailColors.forest200}; font-size: 12px; line-height: 1.6; text-align: center;">
              ${escapeHtml(footer)}
            </td>
          </tr>
        </table>
        <p style="margin: 18px 0 0; color: ${emailColors.forest200}; font-size: 12px; text-align: center;">
          ${escapeHtml(replacePlaceholders(getEmailTranslations(locale).emails.copyright, { year: new Date().getFullYear() }))}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim()
}

function renderButton(url: string, label: string) {
	return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
  <tr>
    <td align="center">
      <a href="${escapeHtml(url)}" style="display: inline-block; padding: 14px 28px; border-radius: 14px; background: ${emailColors.forest200}; color: ${emailColors.forest50}; text-decoration: none; font-weight: 800;">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>
`.trim()
}

function buildMessage({
	to,
	subject,
	html,
	text,
}: {
	to: string
	subject: string
	html: string
	text: string
}): SendEmailCommandInput {
	return {
		Source: `CookBook <${env.AMAZON_SES_FROM_EMAIL}>`,
		Destination: { ToAddresses: [to] },
		Message: {
			Subject: { Data: subject, Charset: 'UTF-8' },
			Body: {
				Html: { Data: html, Charset: 'UTF-8' },
				Text: { Data: text, Charset: 'UTF-8' },
			},
		},
	}
}

export async function sendWelcomeEmail(params: WelcomeEmailParams) {
	const locale = params.locale ?? 'en'
	const t = getEmailTranslations(locale).emails.welcome
	const recipientName = escapeHtml(params.recipientName)
	const verificationSection = params.verificationUrl
		? `
<div style="margin: 28px 0; padding: 20px; border-radius: 14px; background: ${emailColors.forest100}; border-left: 12px solid ${emailColors.forest200}; color: ${emailColors.forest300};">
  <p style="margin: 0 0 12px; font-weight: 800;">${escapeHtml(t['verify-title'])}</p>
  <p style="margin: 0; color: ${emailColors.forest200};">${escapeHtml(t['verify-body'])}</p>
</div>
${renderButton(params.verificationUrl, t['verify-cta'])}
<p style="margin: 0 0 24px; color: ${emailColors.forest200}; font-size: 13px; word-break: break-all;">${escapeHtml(params.verificationUrl)}</p>
`
		: ''

	const html = renderLayout({
		locale,
		title: t.title,
		subtitle: t.subtitle,
		body: `
<p style="margin: 0 0 18px; font-weight: 800;">${replacePlaceholders(t.greeting, { name: recipientName })}</p>
<p style="margin: 0 0 20px;">${escapeHtml(t.intro)}</p>
<ul style="margin: 0 0 20px; padding-left: 22px;">
  <li>${escapeHtml(t['step-1'])}</li>
  <li>${escapeHtml(t['step-2'])}</li>
  <li>${escapeHtml(t['step-3'])}</li>
</ul>
${verificationSection || renderButton(appUrl, t.cta)}
<p style="margin: 0; color: ${emailColors.forest200}; font-size: 14px;">${escapeHtml(t.help)}</p>
`,
		footer: t.footer,
	})

	const text = `
${t.title}

${replacePlaceholders(t.greeting, { name: params.recipientName })}

${t.intro}

- ${t['step-1']}
- ${t['step-2']}
- ${t['step-3']}

${
	params.verificationUrl
		? `${t['verify-title']}\n${t['verify-body']}\n${t['verify-cta']}: ${params.verificationUrl}`
		: `${t.cta}: ${appUrl}`
}

${t.help}

---
${t.footer}
${replacePlaceholders(getEmailTranslations(locale).emails.copyright, { year: new Date().getFullYear() })}
`.trim()

	return sendEmail(
		buildMessage({
			to: params.recipientEmail,
			subject: replacePlaceholders(t.subject, { name: params.recipientName }),
			html,
			text,
		}),
		'sendWelcomeEmail',
	)
}

export async function sendVerificationEmail(params: VerificationEmailParams) {
	const locale = params.locale ?? 'en'
	const t = getEmailTranslations(locale).emails.verification
	const html = renderLayout({
		locale,
		title: t.title,
		subtitle: t.subtitle,
		body: `
<p style="margin: 0 0 18px; font-weight: 800;">${replacePlaceholders(t.greeting, { name: escapeHtml(params.recipientName) })}</p>
<p style="margin: 0;">${escapeHtml(t.body)}</p>
${renderButton(params.verificationUrl, t.cta)}
<p style="margin: 0; color: ${emailColors.forest200}; font-size: 13px; word-break: break-all;">${escapeHtml(params.verificationUrl)}</p>
`,
		footer: t.footer,
	})
	const text = `
${t.title}

${replacePlaceholders(t.greeting, { name: params.recipientName })}

${t.body}

${t.cta}: ${params.verificationUrl}

---
${t.footer}
${replacePlaceholders(getEmailTranslations(locale).emails.copyright, { year: new Date().getFullYear() })}
`.trim()

	return sendEmail(
		buildMessage({
			to: params.recipientEmail,
			subject: t.subject,
			html,
			text,
		}),
		'sendVerificationEmail',
	)
}

export async function sendEmailChangeVerificationEmail(
	params: EmailChangeVerificationEmailParams,
) {
	const locale = params.locale ?? 'en'
	const t = getEmailTranslations(locale).emails['email-change-verification']
	const html = renderLayout({
		locale,
		title: t.title,
		subtitle: t.subtitle,
		body: `
<p style="margin: 0 0 18px; font-weight: 800;">${replacePlaceholders(t.greeting, { name: escapeHtml(params.recipientName) })}</p>
<p style="margin: 0;">${escapeHtml(t.body)}</p>
${renderButton(params.verificationUrl, t.cta)}
<p style="margin: 0 0 16px; color: ${emailColors.forest200}; font-size: 13px; word-break: break-all;">${escapeHtml(params.verificationUrl)}</p>
<p style="margin: 0; color: ${emailColors.forest200}; font-size: 14px;">${escapeHtml(t.help)}</p>
`,
		footer: t.footer,
	})
	const text = `
${t.title}

${replacePlaceholders(t.greeting, { name: params.recipientName })}

${t.body}

${t.cta}: ${params.verificationUrl}

${t.help}

---
${t.footer}
${replacePlaceholders(getEmailTranslations(locale).emails.copyright, { year: new Date().getFullYear() })}
`.trim()

	return sendEmail(
		buildMessage({
			to: params.recipientEmail,
			subject: t.subject,
			html,
			text,
		}),
		'sendEmailChangeVerificationEmail',
	)
}

export async function sendPasswordResetEmail(params: PasswordResetEmailParams) {
	const locale = params.locale ?? 'en'
	const t = getEmailTranslations(locale).emails['password-reset']
	const html = renderLayout({
		locale,
		title: t.title,
		subtitle: t.subtitle,
		body: `
<p style="margin: 0 0 18px; font-weight: 800;">${replacePlaceholders(t.greeting, { name: escapeHtml(params.recipientName) })}</p>
<p style="margin: 0;">${escapeHtml(t.body)}</p>
${renderButton(params.resetUrl, t.cta)}
<p style="margin: 0 0 16px; color: ${emailColors.forest200}; font-size: 13px; word-break: break-all;">${escapeHtml(params.resetUrl)}</p>
<p style="margin: 0; color: ${emailColors.forest200}; font-size: 14px;">${escapeHtml(t.help)}</p>
`,
		footer: t.footer,
	})
	const text = `
${t.title}

${replacePlaceholders(t.greeting, { name: params.recipientName })}

${t.body}

${t.cta}: ${params.resetUrl}

${t.help}

---
${t.footer}
${replacePlaceholders(getEmailTranslations(locale).emails.copyright, { year: new Date().getFullYear() })}
`.trim()

	return sendEmail(
		buildMessage({
			to: params.recipientEmail,
			subject: t.subject,
			html,
			text,
		}),
		'sendPasswordResetEmail',
	)
}

export async function sendEmailChangedEmail(
	params: EmailChangedNotificationEmailParams,
) {
	const locale = params.locale ?? 'en'
	const t = getEmailTranslations(locale).emails['email-changed']
	const html = renderLayout({
		locale,
		title: t.title,
		subtitle: t.subtitle,
		body: `
<p style="margin: 0 0 18px; font-weight: 800;">${replacePlaceholders(t.greeting, { name: escapeHtml(params.recipientName) })}</p>
<p style="margin: 0;">${escapeHtml(replacePlaceholders(t.body, { email: params.newEmail }))}</p>
<p style="margin: 18px 0 0; color: ${emailColors.forest200}; font-size: 14px;">${escapeHtml(t.help)}</p>
`,
		footer: t.footer,
	})
	const text = `
${t.title}

${replacePlaceholders(t.greeting, { name: params.recipientName })}

${replacePlaceholders(t.body, { email: params.newEmail })}

${t.help}

---
${t.footer}
${replacePlaceholders(getEmailTranslations(locale).emails.copyright, { year: new Date().getFullYear() })}
`.trim()

	return sendEmail(
		buildMessage({
			to: params.recipientEmail,
			subject: t.subject,
			html,
			text,
		}),
		'sendEmailChangedEmail',
	)
}

export async function sendPasswordChangedEmail(params: EmailParams) {
	const locale = params.locale ?? 'en'
	const t = getEmailTranslations(locale).emails['password-changed']
	const html = renderLayout({
		locale,
		title: t.title,
		subtitle: t.subtitle,
		body: `
<p style="margin: 0 0 18px; font-weight: 800;">${replacePlaceholders(t.greeting, { name: escapeHtml(params.recipientName) })}</p>
<p style="margin: 0;">${escapeHtml(t.body)}</p>
<p style="margin: 18px 0 0; color: ${emailColors.forest200}; font-size: 14px;">${escapeHtml(t.help)}</p>
`,
		footer: t.footer,
	})
	const text = `
${t.title}

${replacePlaceholders(t.greeting, { name: params.recipientName })}

${t.body}

${t.help}

---
${t.footer}
${replacePlaceholders(getEmailTranslations(locale).emails.copyright, { year: new Date().getFullYear() })}
`.trim()

	return sendEmail(
		buildMessage({
			to: params.recipientEmail,
			subject: t.subject,
			html,
			text,
		}),
		'sendPasswordChangedEmail',
	)
}

export async function sendAccountDeletedEmail(params: EmailParams) {
	const locale = params.locale ?? 'en'
	const t = getEmailTranslations(locale).emails['account-deleted']
	const html = renderLayout({
		locale,
		title: t.title,
		subtitle: t.subtitle,
		body: `
<p style="margin: 0 0 18px; font-weight: 800;">${replacePlaceholders(t.greeting, { name: escapeHtml(params.recipientName) })}</p>
<p style="margin: 0;">${escapeHtml(t.body)}</p>
`,
		footer: t.footer,
	})
	const text = `
${t.title}

${replacePlaceholders(t.greeting, { name: params.recipientName })}

${t.body}

---
${t.footer}
${replacePlaceholders(getEmailTranslations(locale).emails.copyright, { year: new Date().getFullYear() })}
`.trim()

	return sendEmail(
		buildMessage({
			to: params.recipientEmail,
			subject: t.subject,
			html,
			text,
		}),
		'sendAccountDeletedEmail',
	)
}
