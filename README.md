# <img src="public/images/logo.svg" alt="CookBook" height="28"> CookBook

A web application to write down, organize, and share recipes in a simple and easy
manner.

**[cookbook.rguixaro.dev](https://cookbook.rguixaro.dev)**

## Tech Stack

[Next.js 16](https://nextjs.org) | [Auth.js v5](https://authjs.dev/) |
[Prisma](https://prisma.io) | [MongoDB](https://www.mongodb.com/) |
[TypeScript](https://www.typescriptlang.org/) |
[Tailwind CSS](https://tailwindcss.com) | [Radix UI](https://radix-ui.com) |
[AWS S3](https://aws.amazon.com/s3/),
[CloudFront](https://aws.amazon.com/cloudfront/) & [SES](https://aws.amazon.com/ses/)
| [Sentry](https://sentry.io) | [Lucide Icons](https://lucide.dev)

## Features

- **Recipe management**: create, edit, and delete recipes with ingredients,
  instructions, cooking time, categories, and source URLs
- **Image gallery**: upload up to 3 images per recipe, stored on S3 and served via
  CloudFront CDN
- **Search & filter**: search recipes by name, filter by category (8 types) or
  favourites
- **Social**: favourite and save recipes from other users, browse public chef
  profiles
- **Sharing**: share recipe links or download them as a styled PNG image
- **Privacy controls**: toggle profile visibility to restrict access to your recipes
- **Transactional emails**: automated system emails for account verification,
  password resets, and security notifications
- **i18n**: English, Spanish, and Catalan
- **Auth**: Google OAuth and email/password via Auth.js

## Getting Started

<details>
<summary>Prerequisites and setup</summary>

### Prerequisites

- Node.js 20+
- MongoDB instance
- AWS account (S3, CloudFront, SES, Secrets Manager)
- Google OAuth 2.0 credentials

### Setup

1. Clone the repository and install dependencies:

    ```bash
    git clone https://github.com/rguixaro/cookbook-app.git
    cd cookbook-app
    pnpm install
    ```

2. Copy the environment template and fill in your values:

    ```bash
    cp .env.template .env
    ```

    See [`.env.template`](.env.template) for all required variables.

3. Generate the Prisma client and sync the database schema:

    ```bash
    pnpm db:generate
    pnpm db:push
    ```

4. Start the development server:

    ```bash
    pnpm dev
    ```

</details>

## Testing

Unit and component tests run automatically on every push and PR to `main`/`develop`
via [GitHub Actions](.github/workflows/test.yml).

```bash
pnpm test
pnpm test:coverage
pnpm test:watch
pnpm test:e2e
pnpm test:e2e:ui
```

## License

[GPL-3.0](./LICENSE)
