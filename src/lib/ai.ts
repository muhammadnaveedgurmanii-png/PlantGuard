// Thin wrapper around the OpenAI-compatible Chat Completions API used for:
// 1) Vision-based plant disease diagnosis from an uploaded leaf photo
// 2) The AI Plant Care chatbot
// 3) On-demand cultivation tips / disease library lookups (cached in D1)
//
// Uses plain fetch() instead of the `openai` npm package to keep the
// Worker bundle small and avoid Node-specific dependencies.

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
  >
}

const MODEL = 'gpt-5'

async function callChatCompletions(
  apiKey: string,
  baseUrl: string,
  messages: ChatMessage[],
  jsonMode: boolean
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
    })
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`AI API error ${res.status}: ${errText.slice(0, 500)}`)
  }

  const data = await res.json<any>()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('AI API returned no content')
  return content
}

export type DiagnosisResult = {
  is_leaf: boolean
  is_healthy: boolean
  plant_name: string
  disease_name: string
  confidence: number // 0-100
  severity: 'None' | 'Low' | 'Moderate' | 'High' | 'Critical'
  symptoms: string[]
  spread: string[]
  treatment: string[]
  prevention: string[]
  notes: string
}

const DIAGNOSIS_SYSTEM_PROMPT = `You are PlantGuard AI, an expert plant pathologist and agronomist.
You will be shown a photo. Perform these steps:

1. First determine if the photo actually shows a plant leaf (or plant part). If it does NOT show a plant/leaf, set "is_leaf" to false and leave other fields as best-guess defaults.
2. If it is a leaf, identify the plant species/crop if possible.
3. Determine if the plant looks healthy or diseased/pest-damaged.
4. If diseased, identify the most likely disease or issue, estimate your confidence (0-100), and assess severity (None, Low, Moderate, High, Critical).
5. Provide practical, actionable information: symptoms visible, how the disease spreads, treatment steps, and prevention tips. Each of these should be an array of short, concrete bullet-point strings (3-6 items each).
6. If uncertain, say so honestly in "notes" and lower the confidence score rather than guessing with false confidence.

Respond ONLY with a single JSON object matching exactly this shape, no markdown, no extra text:
{
  "is_leaf": boolean,
  "is_healthy": boolean,
  "plant_name": string,
  "disease_name": string,
  "confidence": number,
  "severity": "None" | "Low" | "Moderate" | "High" | "Critical",
  "symptoms": string[],
  "spread": string[],
  "treatment": string[],
  "prevention": string[],
  "notes": string
}`

export async function diagnoseLeafImage(
  apiKey: string,
  baseUrl: string,
  imageDataUrl: string
): Promise<DiagnosisResult> {
  const raw = await callChatCompletions(
    apiKey,
    baseUrl,
    [
      { role: 'system', content: DIAGNOSIS_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this plant leaf photo and return the JSON diagnosis.' },
          { type: 'image_url', image_url: { url: imageDataUrl } }
        ]
      }
    ],
    true
  )

  const parsed = JSON.parse(raw)
  return {
    is_leaf: !!parsed.is_leaf,
    is_healthy: !!parsed.is_healthy,
    plant_name: parsed.plant_name || 'Unknown',
    disease_name: parsed.disease_name || (parsed.is_healthy ? 'Healthy' : 'Unknown'),
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    severity: parsed.severity || 'None',
    symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
    spread: Array.isArray(parsed.spread) ? parsed.spread : [],
    treatment: Array.isArray(parsed.treatment) ? parsed.treatment : [],
    prevention: Array.isArray(parsed.prevention) ? parsed.prevention : [],
    notes: parsed.notes || ''
  }
}

const CHATBOT_SYSTEM_PROMPT = `You are PlantGuard AI Assistant, a friendly and knowledgeable virtual agronomist and plant-care expert.
Help farmers and plant lovers with questions about plant diseases, pest control, cultivation practices, soil, watering, fertilizers, and general gardening.
Keep answers practical, concise, and easy to understand. Use simple language. Use short paragraphs or bullet points when listing steps.
If the user writes in Urdu/Roman Urdu, you may respond in the same style to be helpful. If a question is unrelated to plants/farming/gardening, politely redirect back to plant care topics.`

export async function chatWithAssistant(
  apiKey: string,
  baseUrl: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: CHATBOT_SYSTEM_PROMPT },
    ...history.map((h) => ({ role: h.role, content: h.content }))
  ]
  return callChatCompletions(apiKey, baseUrl, messages, false)
}

export type CultivationGuide = {
  watering: string
  sunlight: string
  temperature: string
  soil: string
  fertilizer: string
  spacing: string
  extra_tips: string[]
}

export async function generateCultivationGuide(
  apiKey: string,
  baseUrl: string,
  plantName: string
): Promise<CultivationGuide> {
  const raw = await callChatCompletions(
    apiKey,
    baseUrl,
    [
      {
        role: 'system',
        content: `You are an expert agronomist. Provide a concise cultivation guide for the given plant/crop.
Respond ONLY with a JSON object of this exact shape, no markdown:
{
  "watering": string,
  "sunlight": string,
  "temperature": string,
  "soil": string,
  "fertilizer": string,
  "spacing": string,
  "extra_tips": string[]
}
Keep each string field to 1-2 short sentences. extra_tips should have 3-5 short bullet items.`
      },
      { role: 'user', content: `Plant/crop: ${plantName}` }
    ],
    true
  )
  const parsed = JSON.parse(raw)
  return {
    watering: parsed.watering || '',
    sunlight: parsed.sunlight || '',
    temperature: parsed.temperature || '',
    soil: parsed.soil || '',
    fertilizer: parsed.fertilizer || '',
    spacing: parsed.spacing || '',
    extra_tips: Array.isArray(parsed.extra_tips) ? parsed.extra_tips : []
  }
}

export type DiseaseInfo = {
  plant_name: string
  symptoms: string[]
  spread: string[]
  treatment: string[]
  prevention: string[]
}

export async function generateDiseaseInfo(
  apiKey: string,
  baseUrl: string,
  diseaseName: string
): Promise<DiseaseInfo> {
  const raw = await callChatCompletions(
    apiKey,
    baseUrl,
    [
      {
        role: 'system',
        content: `You are an expert plant pathologist. Provide detailed information about the given plant disease.
Respond ONLY with a JSON object of this exact shape, no markdown:
{
  "plant_name": string,
  "symptoms": string[],
  "spread": string[],
  "treatment": string[],
  "prevention": string[]
}
Each array should have 3-6 short, concrete bullet-point strings.`
      },
      { role: 'user', content: `Disease: ${diseaseName}` }
    ],
    true
  )
  const parsed = JSON.parse(raw)
  return {
    plant_name: parsed.plant_name || '',
    symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
    spread: Array.isArray(parsed.spread) ? parsed.spread : [],
    treatment: Array.isArray(parsed.treatment) ? parsed.treatment : [],
    prevention: Array.isArray(parsed.prevention) ? parsed.prevention : []
  }
}
