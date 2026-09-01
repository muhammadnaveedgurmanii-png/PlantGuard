// Cloudflare bindings available to every Hono route in this app.
export type Bindings = {
  DB: D1Database
  IMAGES: R2Bucket
  OPENAI_API_KEY: string
  OPENAI_BASE_URL: string
}
