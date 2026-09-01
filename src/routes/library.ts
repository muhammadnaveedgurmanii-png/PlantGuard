import { Hono } from 'hono'
import type { Bindings } from '../types'
import { generateCultivationGuide, generateDiseaseInfo } from '../lib/ai'

const library = new Hono<{ Bindings: Bindings }>()

// Common plants/crops shown in the "Cultivation Tips" browse dropdown.
const KNOWN_PLANTS = [
  'Apple', 'Tomato', 'Potato', 'Corn (Maize)', 'Grape', 'Cherry', 'Peach',
  'Bell Pepper', 'Strawberry', 'Raspberry', 'Squash', 'Wheat', 'Rice',
  'Soybean', 'Cotton', 'Citrus / Orange'
]

// Common diseases shown in the "Disease Library" browse dropdown.
const KNOWN_DISEASES = [
  'Apple Scab', 'Apple Black Rot', 'Cedar Apple Rust', 'Tomato Early Blight',
  'Tomato Late Blight', 'Tomato Leaf Mold', 'Tomato Septoria Leaf Spot',
  'Tomato Yellow Leaf Curl Virus', 'Tomato Mosaic Virus', 'Potato Early Blight',
  'Potato Late Blight', 'Corn Common Rust', 'Corn Northern Leaf Blight',
  'Corn Gray Leaf Spot', 'Grape Black Rot', 'Grape Esca (Black Measles)',
  'Grape Leaf Blight', 'Cherry Powdery Mildew', 'Peach Bacterial Spot',
  'Bell Pepper Bacterial Spot', 'Strawberry Leaf Scorch', 'Squash Powdery Mildew'
]

library.get('/plants', (c) => c.json({ plants: KNOWN_PLANTS }))
library.get('/diseases', (c) => c.json({ diseases: KNOWN_DISEASES }))

// GET /api/library/cultivation?plant=Tomato
library.get('/cultivation', async (c) => {
  const plant = c.req.query('plant')
  if (!plant) return c.json({ error: 'plant query param required' }, 400)

  const cached = await c.env.DB.prepare(`SELECT * FROM cultivation_cache WHERE plant_name = ?`)
    .bind(plant)
    .first()

  if (cached) {
    return c.json({
      plant_name: plant,
      watering: cached.watering,
      sunlight: cached.sunlight,
      temperature: cached.temperature,
      soil: cached.soil,
      fertilizer: cached.fertilizer,
      spacing: cached.spacing,
      extra_tips: safeParse(cached.extra_tips as string)
    })
  }

  try {
    const guide = await generateCultivationGuide(c.env.OPENAI_API_KEY, c.env.OPENAI_BASE_URL, plant)
    await c.env.DB.prepare(
      `INSERT INTO cultivation_cache (plant_name, watering, sunlight, temperature, soil, fertilizer, spacing, extra_tips)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(plant_name) DO UPDATE SET
         watering=excluded.watering, sunlight=excluded.sunlight, temperature=excluded.temperature,
         soil=excluded.soil, fertilizer=excluded.fertilizer, spacing=excluded.spacing, extra_tips=excluded.extra_tips`
    )
      .bind(
        plant,
        guide.watering,
        guide.sunlight,
        guide.temperature,
        guide.soil,
        guide.fertilizer,
        guide.spacing,
        JSON.stringify(guide.extra_tips)
      )
      .run()

    return c.json({ plant_name: plant, ...guide })
  } catch (e: any) {
    return c.json({ error: `AI cultivation guide failed: ${e.message || e}` }, 502)
  }
})

// GET /api/library/disease?name=Tomato+Early+Blight
library.get('/disease', async (c) => {
  const name = c.req.query('name')
  if (!name) return c.json({ error: 'name query param required' }, 400)

  const cached = await c.env.DB.prepare(`SELECT * FROM disease_cache WHERE disease_name = ?`)
    .bind(name)
    .first()

  if (cached) {
    return c.json({
      disease_name: name,
      plant_name: cached.plant_name,
      symptoms: safeParse(cached.symptoms as string),
      spread: safeParse(cached.spread as string),
      treatment: safeParse(cached.treatment as string),
      prevention: safeParse(cached.prevention as string)
    })
  }

  try {
    const info = await generateDiseaseInfo(c.env.OPENAI_API_KEY, c.env.OPENAI_BASE_URL, name)
    await c.env.DB.prepare(
      `INSERT INTO disease_cache (disease_name, plant_name, symptoms, spread, treatment, prevention)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(disease_name) DO UPDATE SET
         plant_name=excluded.plant_name, symptoms=excluded.symptoms, spread=excluded.spread,
         treatment=excluded.treatment, prevention=excluded.prevention`
    )
      .bind(
        name,
        info.plant_name,
        JSON.stringify(info.symptoms),
        JSON.stringify(info.spread),
        JSON.stringify(info.treatment),
        JSON.stringify(info.prevention)
      )
      .run()

    return c.json({ disease_name: name, ...info })
  } catch (e: any) {
    return c.json({ error: `AI disease info failed: ${e.message || e}` }, 502)
  }
})

function safeParse(v: string) {
  try {
    return JSON.parse(v)
  } catch {
    return []
  }
}

export default library
