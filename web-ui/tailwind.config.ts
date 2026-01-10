import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
    darkMode: 'class',
    content: [
        './app/**/*.{vue,js,ts,jsx,tsx}',
        './app/components/**/*.{vue,js,ts}',
        './app/layouts/**/*.vue',
        './app/pages/**/*.vue',
        './app/composables/**/*.{js,ts}',
        './app/plugins/**/*.{js,ts}',
        './app/utils/**/*.{js,ts}',
        './app/App.{js,ts,vue}',
        './app/app.{js,ts,vue}',
        './app/Error.{js,ts,vue}',
        './app/error.{js,ts,vue}',
        './app/app.config.{js,ts}'
    ]
}
