const CRAWLER_USER_AGENT =
	/(bot|crawler|spider|facebookexternalhit|facebot|twitterbot|slackbot|discordbot|linkedinbot|whatsapp|telegrambot|pinterest|embedly|quora link preview|skypeuripreview|google-structured-data-testing-tool)/i

export function isCrawlerUserAgent(userAgent: string | null): boolean {
	return CRAWLER_USER_AGENT.test(userAgent ?? '')
}
