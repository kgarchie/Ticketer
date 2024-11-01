// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    css: [
        '~/assets/css/bulma.min.css',
        '~/assets/scss/style.scss',
    ],
    runtimeConfig: {
        public: {
            DEV: process.env.DEV
        }
    },
    nitro: {
        experimental: {
            websocket: true
        }
    }
})
