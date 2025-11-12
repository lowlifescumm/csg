const disableTailwind = process.env.DISABLE_TAILWIND === '1'

module.exports = {
  plugins: disableTailwind
    ? {
        autoprefixer: {},
      }
    : {
        '@tailwindcss/postcss': {},
        autoprefixer: {},
      },
}

