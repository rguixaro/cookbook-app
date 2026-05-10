# <img src="public/images/logo.svg" alt="CookBook" height="64"> <img src="public/images/email-wordmark_dark.png" alt="CookBook" height="48">

An open-source web application to organize, manage, and share recipes.

**[cookbook.rguixaro.dev](https://cookbook.rguixaro.dev)**

## Tech Stack

[Next.js 16](https://nextjs.org) | [Auth.js v5](https://authjs.dev/) |
[Prisma](https://prisma.io) | [MongoDB](https://www.mongodb.com/) |
[TypeScript](https://www.typescriptlang.org/) |
[Tailwind CSS](https://tailwindcss.com) | [AWS S3](https://aws.amazon.com/s3/) |
[AWS CloudFront](https://aws.amazon.com/cloudfront/) |
[AWS SES](https://aws.amazon.com/ses/) | [Sentry](https://sentry.io)

## Features

- **Recipe management**: create, edit, and delete recipes with ingredients,
  instructions, cooking time, categories, and source URLs
- **Media uploads**: upload up to 3 images per recipe, stored on S3 and served via
  CloudFront CDN
- **Multi-environment deployment**: isolated production and staging environments with
  separate infrastructure and databases
- **Sharing**: share recipe links or download them as a styled PNG image
- **Authentication**: Google OAuth and email/password authentication via Auth.js
- **Transactional emails**: automated system emails for account verification,
  password resets, and security notifications
- **Social**: favourite and save recipes from other users, browse public user
  profiles
- **Search & filter**: search recipes by name, filter by category or favourites
- **Privacy controls**: toggle profile visibility to restrict access to your recipes
- **i18n**: English, Spanish, and Catalan

## Infrastructure

- Production and staging deployments
- AWS S3 + CloudFront for media storage and delivery
- AWS SES for transactional emails
- MongoDB database with Prisma ORM
- Error monitoring with Sentry
- CI/CD pipelines with GitHub Actions

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

Unit and component tests run automatically on every push and PR to `main`/`stage` via
[GitHub Actions](.github/workflows/test.yml).

```bash
pnpm test
pnpm test:coverage
pnpm test:watch
pnpm test:e2e
pnpm test:e2e:ui
```

## License

[GPL-3.0](./LICENSE)
