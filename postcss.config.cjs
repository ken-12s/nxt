// postcss.config.cjs
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, // ← v4는 이 플러그인 사용
    autoprefixer: {},
  },
}
