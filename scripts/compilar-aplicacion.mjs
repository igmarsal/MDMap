import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const host = '127.0.0.1'
const port = 4173
const url = `http://${host}:${port}`

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} ${args.join(' ')} failed with code ${code}`))
      }
    })
  })
}

function waitForServer() {
  const startedAt = Date.now()
  const timeout = 30000

  return new Promise((resolve, reject) => {
    function attempt() {
      const socket = net.createConnection({ host, port })

      socket.on('connect', () => {
        socket.end()
        resolve()
      })

      socket.on('error', () => {
        if (Date.now() - startedAt > timeout) {
          reject(new Error(`Preview server did not start on ${url}`))
          return
        }
        setTimeout(attempt, 500)
      })
    }

    attempt()
  })
}

function openBrowser() {
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' })
    return
  }

  if (process.platform === 'darwin') {
    spawn('open', [url], { detached: true, stdio: 'ignore' })
    return
  }

  spawn('xdg-open', [url], { detached: true, stdio: 'ignore' })
}

async function main() {
  if (!existsSync(path.join(projectRoot, 'node_modules'))) {
    await run('npm', ['install'])
  }

  await run('npm', ['run', 'build'])

  const preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port)], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    detached: process.platform !== 'win32',
  })

  let stopping = false

  async function stop() {
    if (stopping) return
    stopping = true
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(preview.pid), '/f', '/t'], { stdio: 'ignore' })
    } else {
      process.kill(-preview.pid)
    }
  }

  process.on('SIGINT', async () => {
    await stop()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await stop()
    process.exit(0)
  })

  preview.on('close', (code) => {
    if (!stopping && code !== 0) {
      process.exit(code || 1)
    }
  })

  try {
    await waitForServer()
    openBrowser()
    console.log(`Mapamental compilado y disponible en ${url}`)
  } catch (error) {
    await stop()
    console.error(error)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
