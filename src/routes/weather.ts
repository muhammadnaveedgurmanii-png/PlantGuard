import { Hono } from 'hono'
import type { Bindings } from '../types'
import { detectLocationFromIp, geocodeCity, getRealWeatherForecast } from '../lib/weather'

const weather = new Hono<{ Bindings: Bindings }>()

// GET /api/weather/detect -- IP-based location detection
weather.get('/detect', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') || null
  const loc = await detectLocationFromIp(ip)
  return c.json(loc)
})

// GET /api/weather/forecast?city=Lahore  OR  ?lat=..&lon=..&city=..&country=..
weather.get('/forecast', async (c) => {
  const city = c.req.query('city')
  const lat = c.req.query('lat')
  const lon = c.req.query('lon')
  const country = c.req.query('country') || ''

  let loc
  if (lat && lon) {
    loc = { latitude: parseFloat(lat), longitude: parseFloat(lon), city: city || 'Unknown', country }
  } else if (city) {
    loc = await geocodeCity(city)
    if (!loc) return c.json({ error: `Could not find location "${city}".` }, 404)
  } else {
    return c.json({ error: 'Provide either city, or lat+lon.' }, 400)
  }

  const forecast = await getRealWeatherForecast(loc)
  if (!forecast) return c.json({ error: 'Weather service unavailable. Please try again.' }, 502)

  return c.json(forecast)
})

export default weather
