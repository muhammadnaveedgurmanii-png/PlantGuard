import { Hono } from 'hono'
import type { Bindings } from '../types'
import { getOrCreateSessionId } from '../lib/session'
import { diagnoseLeafImage } from '../lib/ai'

const diagnosis = new Hono<{ Bindings: Bindings }>()

// POST /api/diagnosis/analyze
// Accepts multipart/form-data with field "image".
// Runs AI vision diagnosis, stores the uploaded image in R2, saves the
// full result to D1, and returns the diagnosis to the client.
diagnosis.post('/analyze', async (c) => {
  const sessionId = getOrCreateSessionId(c)

  const body = await c.req.parseBody()
  const file = body['image']

  if (!(file instanceof File)) {
    return c.json({ error: 'No image uploaded. Please attach a leaf photo.' }, 400)
  }

  const MAX_BYTES = 8 * 1024 * 1024 // 8MB
  if (file.size > MAX_BYTES) {
    return c.json({ error: 'Image too large. Please upload a photo under 8MB.' }, 400)
  }
  if (!file.type.startsWith('image/')) {
    return c.json({ error: 'File must be an image (png/jpg/jpeg).' }, 400)
  }

  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  // Build a data URL for the vision model
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  const base64 = btoa(binary)
  const dataUrl = `data:${file.type};base64,${base64}`

  let result
  try {
    result = await diagnoseLeafImage(c.env.OPENAI_API_KEY, c.env.OPENAI_BASE_URL, dataUrl)
  } catch (e: any) {
    return c.json({ error: `AI diagnosis failed: ${e.message || e}` }, 502)
  }

  if (!result.is_leaf) {
    return c.json({
      is_leaf: false,
      message: 'This image does not appear to contain a plant leaf. Please upload a clear leaf photo.'
    })
  }

  // Store image in R2 (best-effort; diagnosis still returns if this fails)
  let imageKey: string | null = null
  try {
    imageKey = `diagnoses/${sessionId}/${Date.now()}-${crypto.randomUUID()}.${file.type.split('/')[1] || 'jpg'}`
    await c.env.IMAGES.put(imageKey, arrayBuffer, { httpMetadata: { contentType: file.type } })
  } catch {
    imageKey = null
  }

  try {
    await c.env.DB.prepare(
      `INSERT INTO diagnoses
        (session_id, image_key, plant_name, disease_name, is_healthy, confidence, severity, symptoms, spread, treatment, prevention, raw_ai_response)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        sessionId,
        imageKey,
        result.plant_name,
        result.disease_name,
        result.is_healthy ? 1 : 0,
        result.confidence,
        result.severity,
        JSON.stringify(result.symptoms),
        JSON.stringify(result.spread),
        JSON.stringify(result.treatment),
        JSON.stringify(result.prevention),
        JSON.stringify(result)
      )
      .run()
  } catch (e) {
    // Non-fatal: still return the diagnosis even if history save fails
  }

  return c.json({ is_leaf: true, image_key: imageKey, ...result })
})

// GET /api/diagnosis/history
diagnosis.get('/history', async (c) => {
  const sessionId = getOrCreateSessionId(c)
  const dateFilter = c.req.query('date') // YYYY-MM-DD optional

  let query = `SELECT * FROM diagnoses WHERE session_id = ?`
  const params: any[] = [sessionId]
  if (dateFilter) {
    query += ` AND date(created_at) = ?`
    params.push(dateFilter)
  }
  query += ` ORDER BY created_at DESC`

  const { results } = await c.env.DB.prepare(query)
    .bind(...params)
    .all()

  const parsed = results.map((r: any) => ({
    ...r,
    symptoms: safeParse(r.symptoms),
    spread: safeParse(r.spread),
    treatment: safeParse(r.treatment),
    prevention: safeParse(r.prevention)
  }))

  const total = parsed.length
  const avgConfidence =
    total > 0 ? parsed.reduce((sum: number, r: any) => sum + (r.confidence || 0), 0) / total : 0
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayCount = parsed.filter((r: any) => (r.created_at || '').slice(0, 10) === todayStr).length

  return c.json({
    records: parsed,
    stats: { total, avg_confidence: Math.round(avgConfidence * 10) / 10, today_count: todayCount }
  })
})

// DELETE /api/diagnosis/history/:id
diagnosis.delete('/history/:id', async (c) => {
  const sessionId = getOrCreateSessionId(c)
  const id = c.req.param('id')
  await c.env.DB.prepare(`DELETE FROM diagnoses WHERE id = ? AND session_id = ?`).bind(id, sessionId).run()
  return c.json({ success: true })
})

// GET /api/diagnosis/image/:key -- serves the stored leaf image from R2
diagnosis.get('/image/*', async (c) => {
  const key = c.req.path.replace('/api/diagnosis/image/', '')
  const obj = await c.env.IMAGES.get(key)
  if (!obj) return c.notFound()
  return new Response(obj.body, {
    headers: { 'Content-Type': obj.httpMetadata?.contentType || 'image/jpeg' }
  })
})

function safeParse(v: any) {
  try {
    return JSON.parse(v)
  } catch {
    return []
  }
}

export default diagnosis
