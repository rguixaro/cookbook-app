import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
	cleanup()
})

process.env.DATABASE_URL = 'postgres://test'
process.env.AUTH_SECRET = 'test'
process.env.GOOGLE_ID = 'test'
process.env.GOOGLE_CLIENT_SECRET = 'test'

process.env.AMAZON_REGION = 'eu-west-1'
process.env.AMAZON_S3_BUCKET_NAME = 'test'
process.env.AMAZON_CLOUDFRONT_KEY_PAIR_ID = 'test'
process.env.AMAZON_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME = 'test'

process.env.COOKIES_DOMAIN = 'localhost'
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN = 'cdn.localhost'
