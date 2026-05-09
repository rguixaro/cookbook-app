import type { Metadata } from 'next'
import Link from 'next/link'

import { LegalDocument } from '@/components/legal/document'

const lastUpdated = 'May 9, 2026'
const contactEmail = 'privacy@rguixaro.dev'
const repositoryUrl = 'https://github.com/rguixaro/cookbook-app'
const licenseUrl = `${repositoryUrl}/blob/main/LICENSE`

export const metadata: Metadata = {
	title: 'Terms of Service - CookBook',
	description: 'Terms of Service for CookBook',
}

export default function TermsOfServicePage() {
	return (
		<LegalDocument
			title='Terms of Service'
			lastUpdated={lastUpdated}
			intro={[
				<>
					These Terms of Service govern your use of CookBook. CookBook is a
					hosted recipe application that lets users create, store,
					organize, save, favourite, share, export, and delete recipes and
					recipe images. If you have questions, contact{' '}
					<a
						className='font-bold underline underline-offset-4'
						href={`mailto:${contactEmail}`}>
						{contactEmail}
					</a>
					.
				</>,
				'By creating an account or using CookBook, you agree to these Terms. If you do not agree, do not use the service.',
				'CookBook is provided as a personal, non-commercial open source project. The hosted service does not charge fees, sell subscriptions, process payments, display advertising, or operate for commercial gain.',
			]}
			sections={[
				{
					title: 'Eligibility',
					paragraphs: [
						'You must be at least 16 years old to use CookBook. By using the service, you confirm that you meet this age requirement.',
					],
				},
				{
					title: 'Hosted Service and Open Source Code',
					paragraphs: [
						<>
							CookBook source code is public on{' '}
							<a
								className='font-bold underline underline-offset-4'
								href={repositoryUrl}
								rel='noreferrer'
								target='_blank'>
								GitHub
							</a>{' '}
							and licensed under the{' '}
							<a
								className='font-bold underline underline-offset-4'
								href={licenseUrl}
								rel='noreferrer'
								target='_blank'>
								GNU General Public License version 3
							</a>
							{', as provided in the repository license file.'}
						</>,
						'The GPL governs copying, modifying, and distributing the software code. These Terms govern use of the hosted CookBook service, including accounts, hosted data, recipe content, and service access.',
						'These Terms do not limit rights granted by the open source license. The open source license does not give anyone a right to use this hosted service in a way that violates these Terms.',
						'If you run your own self-hosted deployment, you are responsible for that deployment, its users, legal notices, privacy practices, and compliance obligations.',
					],
				},
				{
					title: 'Accounts and Sign-In',
					paragraphs: [
						'You may sign in with Google or with an email address and password. You are responsible for keeping your credentials secure and for activity that happens through your account.',
						'You must provide accurate account information and keep your email address and username appropriate for a public recipe service.',
					],
				},
				{
					title: 'Your Content',
					paragraphs: [
						'You retain ownership of the recipes, recipe text, source links, images, and other content you add to CookBook.',
						'You grant CookBook a limited license to host, store, process, display, reproduce, and transmit your content only as needed to operate, secure, maintain, and improve the hosted service. This includes displaying public profiles and recipes when your privacy settings allow public access.',
						'You are responsible for making sure you have the rights needed to upload or share recipe text, source links, and images through CookBook.',
					],
				},
				{
					title: 'Public Sharing and Privacy Settings',
					paragraphs: [
						'Profiles and recipes are private by default. If you make your profile public, your profile and recipes may be visible to other signed-in users. Limited recipe previews may also be available through public links or search previews where CookBook intentionally exposes them.',
						'Private profile settings restrict public access, but you should not add information to CookBook that you are not comfortable storing in an online service.',
					],
				},
				{
					title: 'Acceptable Use',
					items: [
						'Do not use CookBook for unlawful, abusive, harassing, deceptive, infringing, or harmful activity.',
						'Do not upload content that you do not have the right to use or share.',
						'Do not attempt to break, bypass, overload, scrape, or interfere with the hosted service, authentication, image protection, or infrastructure.',
						<>
							Do not use CookBook to send spam, distribute malware,
							collect other users&apos; information, or violate the
							privacy or rights of others.
						</>,
					],
				},
				{
					title: 'Exports and Account Deletion',
					paragraphs: [
						'CookBook provides account export features for recipe data and recipe images from the profile page.',
						'You can delete your account from the profile page. Account deletion permanently removes your active account and recipes from the service, subject to limited backups, logs, security records, or legal records that may remain for a reasonable period.',
					],
				},
				{
					title: 'Recipes and Health',
					paragraphs: [
						'Recipes and related content in CookBook are user-provided. CookBook does not verify recipes for accuracy, allergens, nutrition, food safety, dietary suitability, or medical use.',
						'CookBook is not professional dietary, medical, nutrition, or food-safety advice. Use your own judgment and consult qualified professionals where needed.',
					],
				},
				{
					title: 'Third-Party Services and Links',
					paragraphs: [
						'CookBook uses third-party services for authentication, storage, image delivery, error monitoring, and hosting. Recipes may also include source links to third-party websites. CookBook is not responsible for third-party websites or services.',
					],
				},
				{
					title: 'Service Changes and Availability',
					paragraphs: [
						'CookBook may limit, change, suspend, or discontinue parts of the hosted service, including because it is a personal, non-commercial project. CookBook may also be unavailable because of maintenance, infrastructure issues, security events, or other operational reasons.',
						'The service is provided as available and without guarantees that it will always be secure, uninterrupted, or error-free.',
					],
				},
				{
					title: 'No Warranties',
					paragraphs: [
						'The hosted CookBook service is provided as is and as available, to the fullest extent allowed by law. CookBook makes no warranties about the service, user content, recipe accuracy, availability, security, fitness for a particular purpose, or non-infringement.',
					],
				},
				{
					title: 'Limitation of Liability',
					paragraphs: [
						'To the fullest extent allowed by law, CookBook is not responsible for indirect, incidental, special, consequential, or punitive damages, or for lost data, profits, goodwill, or service availability issues arising from use of the hosted service.',
					],
				},
				{
					title: 'Copyright and Takedown Requests',
					paragraphs: [
						<>
							If you believe content on CookBook infringes your rights,
							contact{' '}
							<a
								className='font-bold underline underline-offset-4'
								href={`mailto:${contactEmail}`}>
								{contactEmail}
							</a>{' '}
							with enough information to identify the content and
							explain the issue.
						</>,
					],
				},
				{
					title: 'Applicable Law',
					paragraphs: [
						'These Terms are governed by the laws that apply to the operator of the hosted CookBook service, without regard to conflict-of-law rules. Nothing in these Terms limits any mandatory rights that apply where you live.',
					],
				},
				{
					title: 'Account or Content Restrictions',
					paragraphs: [
						'CookBook may restrict, suspend, remove, or delete accounts or content when reasonably necessary to protect the service, respond to misuse, address legal or security concerns, or enforce these Terms.',
					],
				},
				{
					title: 'Privacy',
					paragraphs: [
						<>
							The{' '}
							<Link
								className='font-bold underline underline-offset-4'
								href='/privacy'>
								Privacy Policy
							</Link>{' '}
							explains how CookBook collects, uses, stores, and
							protects information.
						</>,
					],
				},
				{
					title: 'Changes to These Terms',
					paragraphs: [
						'CookBook may update these Terms as the service changes. The latest version will be posted on this page with an updated date. If changes materially affect your use of CookBook, CookBook will provide reasonable notice through the service or another appropriate method before the changes take effect when required. Continued use of the service after changes means you accept the updated Terms.',
					],
				},
				{
					title: 'Contact',
					paragraphs: [
						<>
							For questions about these Terms, contact{' '}
							<a
								className='font-bold underline underline-offset-4'
								href={`mailto:${contactEmail}`}>
								{contactEmail}
							</a>
							.
						</>,
					],
				},
			]}
		/>
	)
}
