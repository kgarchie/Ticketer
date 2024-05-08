FROM node:18.14.1

# set working directory
WORKDIR /nuxt

# copy package.json and lock
COPY package.json pnpm-lock.yaml ./

# install dependencies in the container
RUN npm install -g pnpm && pnpm install

# copy the rest of the files
COPY . .

# grant permission to the /public directory
RUN mkdir -p /nuxt/public/uploads && \
    chown -R node:node /nuxt/public && \
    chmod -R 777 /nuxt/public

RUN pnpm run build

# set environment variables
ENV PORT=3000

# which port should be exposed expose 3000
EXPOSE 3000

# commands to build and run the nuxt app
CMD ["pnpm", "run", "start"]