import { Hono } from 'hono'
import type { Bindings } from '../types'
import { getOrCreateSessionId } from '../lib/session'

const community = new Hono<{ Bindings: Bindings }>()

// GET /api/community/posts
community.get('/posts', async (c) => {
  const sessionId = getOrCreateSessionId(c)

  const { results: posts } = await c.env.DB.prepare(
    `SELECT * FROM posts ORDER BY created_at DESC`
  ).all()

  const { results: likedRows } = await c.env.DB.prepare(
    `SELECT post_id FROM post_likes WHERE session_id = ?`
  )
    .bind(sessionId)
    .all()
  const likedSet = new Set((likedRows as any[]).map((r) => r.post_id))

  const enriched = await Promise.all(
    (posts as any[]).map(async (p) => {
      const { results: comments } = await c.env.DB.prepare(
        `SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC`
      )
        .bind(p.id)
        .all()
      return { ...p, comments, liked_by_me: likedSet.has(p.id) }
    })
  )

  return c.json({ posts: enriched })
})

// POST /api/community/posts  { author, title, content }
community.post('/posts', async (c) => {
  const sessionId = getOrCreateSessionId(c)
  const { author, title, content } = await c.req.json<{ author: string; title: string; content: string }>()

  if (!author?.trim() || !title?.trim() || !content?.trim()) {
    return c.json({ error: 'Author, title, and content are all required.' }, 400)
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO posts (session_id, author, title, content) VALUES (?, ?, ?, ?)`
  )
    .bind(sessionId, author.trim(), title.trim(), content.trim())
    .run()

  return c.json({ success: true, id: result.meta.last_row_id })
})

// PUT /api/community/posts/:id  { title, content } -- only by original author's session
community.put('/posts/:id', async (c) => {
  const sessionId = getOrCreateSessionId(c)
  const id = c.req.param('id')
  const { title, content } = await c.req.json<{ title: string; content: string }>()

  const post = await c.env.DB.prepare(`SELECT session_id FROM posts WHERE id = ?`).bind(id).first()
  if (!post) return c.json({ error: 'Post not found.' }, 404)
  if (post.session_id !== sessionId) return c.json({ error: 'Not authorized to edit this post.' }, 403)

  await c.env.DB.prepare(`UPDATE posts SET title = ?, content = ? WHERE id = ?`)
    .bind(title.trim(), content.trim(), id)
    .run()

  return c.json({ success: true })
})

// DELETE /api/community/posts/:id
community.delete('/posts/:id', async (c) => {
  const sessionId = getOrCreateSessionId(c)
  const id = c.req.param('id')

  const post = await c.env.DB.prepare(`SELECT session_id FROM posts WHERE id = ?`).bind(id).first()
  if (!post) return c.json({ error: 'Post not found.' }, 404)
  if (post.session_id !== sessionId) return c.json({ error: 'Not authorized to delete this post.' }, 403)

  await c.env.DB.prepare(`DELETE FROM posts WHERE id = ?`).bind(id).run()
  return c.json({ success: true })
})

// POST /api/community/posts/bulk-delete  { ids: number[] }
community.post('/posts/bulk-delete', async (c) => {
  const sessionId = getOrCreateSessionId(c)
  const { ids } = await c.req.json<{ ids: number[] }>()
  if (!Array.isArray(ids) || ids.length === 0) return c.json({ error: 'No ids provided.' }, 400)

  const placeholders = ids.map(() => '?').join(',')
  await c.env.DB.prepare(
    `DELETE FROM posts WHERE id IN (${placeholders}) AND session_id = ?`
  )
    .bind(...ids, sessionId)
    .run()

  return c.json({ success: true })
})

// POST /api/community/posts/:id/like -- toggle like (one per session)
community.post('/posts/:id/like', async (c) => {
  const sessionId = getOrCreateSessionId(c)
  const id = c.req.param('id')

  const existing = await c.env.DB.prepare(
    `SELECT id FROM post_likes WHERE post_id = ? AND session_id = ?`
  )
    .bind(id, sessionId)
    .first()

  if (existing) {
    await c.env.DB.prepare(`DELETE FROM post_likes WHERE post_id = ? AND session_id = ?`)
      .bind(id, sessionId)
      .run()
    await c.env.DB.prepare(`UPDATE posts SET likes = MAX(likes - 1, 0) WHERE id = ?`).bind(id).run()
    return c.json({ liked: false })
  } else {
    await c.env.DB.prepare(`INSERT INTO post_likes (post_id, session_id) VALUES (?, ?)`)
      .bind(id, sessionId)
      .run()
    await c.env.DB.prepare(`UPDATE posts SET likes = likes + 1 WHERE id = ?`).bind(id).run()
    return c.json({ liked: true })
  }
})

// POST /api/community/posts/:id/comments  { author, content }
community.post('/posts/:id/comments', async (c) => {
  const id = c.req.param('id')
  const { author, content } = await c.req.json<{ author: string; content: string }>()

  if (!author?.trim() || !content?.trim()) {
    return c.json({ error: 'Author and content are required.' }, 400)
  }

  await c.env.DB.prepare(`INSERT INTO comments (post_id, author, content) VALUES (?, ?, ?)`)
    .bind(id, author.trim(), content.trim())
    .run()

  return c.json({ success: true })
})

export default community
