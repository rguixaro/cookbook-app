import type { Metadata } from 'next'
import Link from 'next/link'

import { LegalDocument } from '@/components/legal/document'

const lastUpdated = 'May 9, 2026'
const contactEmail = 'privacy@rguixaro.dev'
const repositoryUrl = 'https://github.com/rguixaro/cookbook-app'
const licenseUrl = `${repositoryUrl}/blob/main/LICENSE`

export const metadata: Metadata = {
	title: 'Privacy Policy - CookBook',
	description: 'Privacy Policy for CookBook',
}

export default function PrivacyPolicyPage() {
	return (
		<LegalDocument
			title='Privacy Policy'
			lastUpdated={lastUpdated}
			intro={[
				<>
					This Privacy Policy explains how CookBook collects, uses, stores,
					and protects information in the hosted CookBook recipe
					application. The hosted service at cookbook.rguixaro.dev is
					operated by rguixaro.dev as a personal, non-commercial open
					source project. rguixaro.dev is the controller for personal
					information processed by this hosted service. You can contact
					CookBook at{' '}
					<a
						className='font-bold underline underline-offset-4'
						href={`mailto:${contactEmail}`}>
						{contactEmail}
					</a>
					.
				</>,
				'CookBook lets users create, organize, save, favourite, share, export, and delete recipes and recipe images. The service is intended for users who are at least 16 years old.',
				<>
					CookBook source code is public on{' '}
					<a
						className='font-bold underline underline-offset-4'
						href={repositoryUrl}
						rel='noreferrer'
						target='_blank'>
						GitHub
					</a>{' '}
					and licensed separately under the{' '}
					<a
						className='font-bold underline underline-offset-4'
						href={licenseUrl}
						rel='noreferrer'
						target='_blank'>
						GNU General Public License version 3
					</a>
					. The public repository contains source code and license text,
					not hosted account or recipe data. This policy applies to the
					hosted CookBook service, not to independent self-hosted
					deployments.
				</>,
			]}
			sections={[
				{
					title: 'Information CookBook Collects',
					items: [
						'Account information, such as email address, username, display name, profile image, password hash for email/password accounts, authentication identifiers, session data, and account settings.',
						'Google sign-in information, such as your Google account identifier, email address, name, profile image, and sign-in tokens or OAuth metadata needed to authenticate your account.',
						'Recipe and profile content, including recipes, ingredients, instructions, categories, cooking time, source links, recipe images, saved recipes, favourite recipes, and profile privacy settings.',
						'Technical and security information, including necessary cookies, CloudFront signed cookies for protected recipe images, logs, error reports, IP address, user-agent, and similar infrastructure data where captured by the app or its service providers.',
					],
				},
				{
					title: 'How CookBook Uses Information',
					items: [
						'To authenticate you and keep your account secure.',
						'To provide recipe, profile, search, save, favourite, sharing, export, and deletion features.',
						'To show public profiles and recipes when your privacy settings allow public access.',
						'To store, process, serve, and export recipe data and recipe images.',
						'To troubleshoot errors, monitor reliability, prevent abuse, protect the service, and respond to legal obligations.',
					],
				},
				{
					title: 'Legal Bases',
					items: [
						'Service provision: CookBook processes account, authentication, profile, recipe, image, save, favourite, sharing, export, and deletion information to provide the service you request.',
						'Legitimate interests: CookBook processes technical, security, cookie, log, and error information to operate, secure, troubleshoot, prevent abuse, and maintain the hosted service.',
						'Legal obligations: CookBook may process or retain limited information when needed to comply with applicable law or lawful requests.',
					],
				},
				{
					title: 'Sharing and Service Providers',
					paragraphs: [
						'CookBook does not sell personal information, share personal information for cross-context behavioural advertising, show advertising, charge fees, sell subscriptions, or process payments.',
						'CookBook uses service providers to operate the app, including Google OAuth for sign-in, MongoDB for database storage, AWS S3 for recipe image storage, AWS CloudFront for image delivery, AWS Secrets Manager for secrets, Sentry for error monitoring, and hosting or infrastructure providers used to run the application.',
						'Public profiles, public recipes, recipe images, and source links may be visible to other signed-in users when your profile privacy settings allow public access. Limited recipe previews may also be available through public links or search previews where CookBook intentionally exposes them. CookBook may also disclose limited information if needed for security, abuse prevention, legal compliance, or lawful requests.',
					],
				},
				{
					title: 'Google User Data',
					paragraphs: [
						'CookBook uses Google sign-in for users who choose it. CookBook stores Google identifiers, profile details, and related authentication tokens or metadata only as needed to authenticate users, maintain accounts, prevent abuse, and operate the service. CookBook does not use Google user data for advertising, credit decisions, lending, or selling user data.',
						<>
							CookBook&apos;s use and transfer of information received
							from Google APIs adheres to the{' '}
							<a
								className='font-bold underline underline-offset-4'
								href='https://developers.google.com/terms/api-services-user-data-policy'
								rel='noreferrer'
								target='_blank'>
								Google API Services User Data Policy
							</a>
							{', including the Limited Use requirements.'}
						</>,
					],
				},
				{
					title: 'Cookies',
					paragraphs: [
						'CookBook uses necessary cookies and similar browser storage for authentication, session management, security, and protected image access. Authentication and session cookies keep you signed in, and CloudFront signed cookies authorize access to protected recipe images.',
						'CloudFront signed cookies expire after about 6 hours. Authentication sessions may last up to 7 days. CookBook does not use advertising cookies or third-party tracking cookies.',
					],
				},
				{
					title: 'Retention',
					paragraphs: [
						'CookBook keeps account, recipe, profile, and image data while your account exists so the service can provide the cookbook features you use.',
						'When you delete your account, CookBook deletes your active account and recipe data and attempts to clean up associated recipe images. Limited backups, logs, error reports, security records, or legal records may remain until provider backups rotate, logs expire, or the information is no longer needed for security, troubleshooting, abuse prevention, or legal compliance.',
					],
				},
				{
					title: 'International Processing',
					paragraphs: [
						'CookBook and its service providers may process or store information in countries other than where you live, including outside the European Economic Area. Where required, CookBook relies on provider safeguards and legal transfer mechanisms such as adequacy decisions, Standard Contractual Clauses, data processing terms, or comparable contractual protections.',
					],
				},
				{
					title: 'Your Controls and Privacy Rights',
					items: [
						'You can change your profile privacy setting from your profile page.',
						'You can export your recipe data and recipe images from your profile page.',
						'You can delete your account from your profile page. Account deletion removes your account and recipes from the active service, including associated recipe image cleanup where available.',
						'Providing account and authentication information is required to create and use an account. Providing recipe text, source links, images, and profile content is optional, but CookBook cannot provide the related recipe, sharing, image, export, or profile features without that information.',
						'CookBook does not use personal information for automated decisions that produce legal or similarly significant effects.',
						'Depending on where you live, you may have rights to access, correct, export, delete, restrict, or object to the processing of your personal information.',
						<>
							You can contact{' '}
							<a
								className='font-bold underline underline-offset-4'
								href={`mailto:${contactEmail}`}>
								{contactEmail}
							</a>{' '}
							to request access, correction, deletion, or help with
							privacy questions. CookBook may need to verify your
							identity before completing a request.
						</>,
						'If privacy law gives you the right to complain to a regulator or data protection authority, you may do so in your place of residence.',
					],
				},
				{
					title: 'Security',
					paragraphs: [
						'CookBook uses reasonable technical measures to protect user information, including hashed passwords for email/password accounts and secure service providers for storage and delivery. No internet service can guarantee perfect security.',
					],
				},
				{
					title: 'Changes to This Policy',
					paragraphs: [
						'CookBook may update this Privacy Policy as the service changes. The latest version will be posted on this page with an updated date. If changes materially affect how CookBook uses personal information, CookBook will provide reasonable notice through the service or another appropriate method before the changes take effect when required.',
					],
				},
				{
					title: 'Related Terms',
					paragraphs: [
						<>
							Your use of CookBook is also governed by the{' '}
							<Link
								className='font-bold underline underline-offset-4'
								href='/terms'>
								Terms of Service
							</Link>
							.
						</>,
					],
				},
			]}
		/>
	)
}
