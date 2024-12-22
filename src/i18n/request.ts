import { headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import Negotiator from 'negotiator';

export default getRequestConfig(async () => {
	const defaultHeaders = await headers();
	const headersObj = Object.fromEntries(defaultHeaders.entries());
	const negotiator = new Negotiator({ headers: headersObj });

	const locales = ['ca', 'en', 'es'];
	const defaultLocale = 'en';

	const locale = negotiator.language(locales) || defaultLocale;
	return {
		locale,
		messages: (await import(`../../messages/${locale}.json`)).default,
	};
});
