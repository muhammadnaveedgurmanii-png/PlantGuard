import { Hono } from 'hono'
import type { Bindings } from '../types'
import { getOrCreateSessionId } from '../lib/session'
import { chatWithAssistant } from '../lib/ai'

const chatbot = new Hono<{ Bindings: Bindings }>()

const MAX_HISTORY = 20 // messages of context sent to the model

// POST /api/chat/send  { message: string }
chatbot.post('/send', async (c) => {
  const sessionId = getOrCreateSessionId(c)
  const { message } = await c.req.json<{ message: string }>()

  if (!message || !message.trim()) {
    return c.json({ error: 'Message cannot be empty.' }, 400)
  }

  // Save user message
  await c.env.DB.prepare(`INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'user', ?)`)
    .bind(sessionId, message)
    .run()

  // Load recent history for context
  const { results } = await c.env.DB.prepare(
    `SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT ?`
  )
    .bind(sessionId, MAX_HISTORY)
    .all()

  const history = (results as any[]).reverse().map((r) => ({ role: r.role, content: r.content }))

  let reply: string
  try {
    reply = await chatWithAssistant(c.env.OPENAI_API_KEY, c.env.OPENAI_BASE_URL, history)
  } catch (e: any) {
    return c.json({ error: `AI chatbot failed: ${e.message || e}` }, 502)
  }

  await c.env.DB.prepare(`INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'assistant', ?)`)
    .bind(sessionId, reply)
    .run()

  return c.json({ reply })
})

// GET /api/chat/history
chatbot.get('/history', async (c) => {
  const sessionId = getOrCreateSessionId(c)
  const { results } = await c.env.DB.prepare(
    `SELECT role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC`
  )
    .bind(sessionId)
    .all()
  return c.json({ messages: results })
})

// DELETE /api/chat/history -- clear conversation
chatbot.delete('/history', async (c) => {
  const sessionId = getOrCreateSessionId(c)
  await c.env.DB.prepare(`DELETE FROM chat_messages WHERE session_id = ?`).bind(sessionId).run()
  return c.json({ success: true })
})

export default chatbot
