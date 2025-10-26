import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('Hono is running on Vercel!'))
app.get('/api/test', (c) => c.json({ ok: true }))

export default app
