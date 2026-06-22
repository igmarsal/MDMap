import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { createWriteStream } from 'node:fs'
import { createReadStream } from 'node:fs'
import { createGzip } from 'node:zlib'
import { createHash } from 'node:crypto'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const host = '127.0.0.1'
const port = 4173
const url = `http://${host}:${port}`
const appName = 'MDMap'
const releaseDir = path.join(projectRoot, 'release')

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

function getZipFileName() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `${appName}-${date}.zip`
}

async function createZip(sourceDir, zipPath) {
  const AdmZip = (await import('adm-zip')).default
  const zip = new AdmZip()

  function addFileToZip(filePath, zipPath) {
    const stat = statSync(filePath)

    if (stat.isDirectory()) {
      const entries = readdirSync(filePath)
      for (const entry of entries) {
        addFileToZip(path.join(filePath, entry), path.join(zipPath, entry))
      }
      return
    }

    zip.addLocalFile(filePath, zipPath)
  }

  addFileToZip(sourceDir, '')
  zip.writeZip(zipPath)
}

async function main() {
  if (!existsSync(path.join(projectRoot, 'node_modules'))) {
    await run('npm', ['install'])
  }

  await run('npm', ['run', 'build'])

  const distDir = path.join(projectRoot, 'dist')
  if (!existsSync(distDir)) {
    throw new Error(`Build output not found: ${distDir}`)
  }

  mkdirSync(releaseDir, { recursive: true })
  const zipPath = path.join(releaseDir, getZipFileName())
  await createZip(distDir, zipPath)

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
    console.log(`${appName} compilado y disponible en ${url}`)
    console.log(`ZIP portable generado en ${zipPath}`)
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
