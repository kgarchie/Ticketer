# Nuxt 3 Minimal Starter

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install the dependencies: Pick one of the following depending on your package manager:

```bash
# yarn
yarn install

# npm
npm install

# pnpm
pnpm install
```

## Development Server

Start the development server on http://localhost:3000 - Development server won't work due to the way WebsSocketServer is Set Up - Skip to Production

```bash
# yarn
yarn dev

# npm
npm run dev
```

## Production

Build the application for production:

```bash
# yarn on linux
yarn build

# yarn on windows
yarn build:windows

# Or
# npm linux
npm run build

# npm windows
npm run build:windows
```

### Recommended: Locally start the built server

```bash
# yarn
yarn start

# npm
npm run start
```

You are basically done at this point. You can now deploy the `.output` directory to your server.

### Untested: Locally preview production build:

```bash
# yarn
yarn preview

# npm
npm run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
