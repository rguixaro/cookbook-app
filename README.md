# CookBook

A web application to write down, organize, and share recipes in a simple and easy
manner.

## Tech Stack

- [**Next.js 16 (App Router)**](https://nextjs.org) | React-based framework.
- [**Auth.js v5**](https://authjs.dev/) | Authentication for the Web.
- [**Prisma**](https://prisma.io) | Next-generation Node.js and TypeScript ORM.
- [**MongoDB**](https://www.mongodb.com/) | Document-oriented database.
- [**TypeScript**](https://www.typescriptlang.org/) | JavaScript with syntax for
  types.
- [**Tailwind CSS**](https://tailwindcss.com) & [**Radix**](https://radix-ui.com) |
  Design System.
- [**AWS S3**](https://aws.amazon.com/s3/) &
  [**CloudFront**](https://aws.amazon.com/cloudfront/) | Image storage and CDN.
- [**Lucide Icons**](https://lucide.dev) | Icon toolkit.

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB instance
- AWS account (S3, CloudFront, Secrets Manager)
- Google OAuth 2.0 credentials

### Setup

1. Clone the repository and install dependencies:

    ```bash
    git clone https://github.com/rguixaro/cookbook-app.git
    cd cookbook-app
    npm install
    ```

2. Copy the environment template and fill in your values:

    ```bash
    cp .env.template .env
    ```

    See [`.env.template`](.env.template) for all required variables.

3. Generate the Prisma client and sync the database schema:

    ```bash
    npm run db:generate
    npm run db:push
    ```

4. Start the development server:

    ```bash
    npm run dev
    ```

## License

[GPL-3.0](./LICENSE)
