import { Hono } from 'hono'
import { serveStatic } from 'hono/serve-static'
import fs from 'fs'
import crypto from 'crypto'
import { exec } from 'child_process'

const app = new Hono()

app.use(
  '/*',
  serveStatic({
    root: './dist',
    getContent: path => {
      try {
        if (path.endsWith('.js') && !fs.existsSync(path)) {
          const tsPath = path.replace('.js', '.ts')
          if (fs.existsSync(tsPath)) {
            const file = fs.readFileSync(tsPath)
            return file
          }
        }

        const file = fs.readFileSync(path)
        if (!file) return null
        return file as any
      } catch (error) {
        if (path === 'dist/main/index.html' || path === 'dist/') {
          return null
        }
        return null
      }
    },
    onFound: (path, c) => {
      if (
        path.endsWith('.js') ||
        path.endsWith('.ts') ||
        path.endsWith('.css')
      ) {
        c.header(
          'Cache-Control',
          'no-store, no-cache, must-revalidate, max-age=0',
        )
      }
    },
  }),
)

app.use('*', async (c, next) => {
  c.header('Cache-Control', 'no-store, no-cache')
  await next()
})

app.get('/', c => {
  const html = Bun.file('./dist/pages/main/index.html')
  return c.html(html.text())
})

const secret = 'LHOUwjBFGyori7tltMnRQ2YtanvObPZOenCowk/Cq90='

app.post('/github-push-event', async c => {
  console.log('Webhook received!')
  const githubEvent = c.req.header('X-GitHub-Event')
  const signature = c.req.header('X-Hub-Signature-256')

  console.log(`GitHub Event: ${githubEvent}`)
  console.log(`Signature: ${signature}`)

  if (githubEvent !== 'push' || !signature) {
    console.log('Invalid event or missing signature')
    return c.json({ error: 'Invalid event or missing signature' }, 400)
  }

  const payload = await c.req.text()
  console.log(`Payload received: ${payload.substring(0, 200)}...`) // İlk 200 karakteri göster

  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expectedSignature = `sha256=${hmac.digest('hex')}`

  console.log(`Expected Signature: ${expectedSignature}`)
  console.log(`Signatures match: ${signature === expectedSignature}`)

  if (signature !== expectedSignature) {
    console.log('Signature validation failed')
    return c.json({ error: 'Invalid signature' }, 401)
  }

  console.log('Webhook validated successfully, running build process...')

  c.status(200)
  setImmediate(() => {
    runBuildProcess()
  })

  return c.body(null)
})

function runBuildProcess(): void {
  console.log('Starting build process...')
  const command =
    '/usr/bin/git pull && /root/.nvm/versions/node/v22.11.0/bin/bun run build && sudo systemctl restart holding-mbd.service'
  console.log(`Executing command: ${command}`)

  exec(
    command,
    { cwd: '/root/holding' },
    (error: Error | null, stdout: string, stderr: string) => {
      if (error) {
        console.error(`Exec error: ${error}`)
        console.error(`stderr: ${stderr}`)
        return
      }
      console.log(`Command output: ${stdout}`)
      console.log('Build process completed successfully')
    },
  )
}

const port = 3090
console.log(`Server is running on port ${port}`)

export default { fetch: app.fetch, port }
