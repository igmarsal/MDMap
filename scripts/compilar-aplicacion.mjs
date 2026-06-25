import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, unlinkSync, rmSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
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
      if (code === 0) resolve()
      else reject(new Error(`${command} failed with code ${code}`))
    })
  })
}

async function createZip(sourceDir, zipPath) {
  const AdmZip = (await import('adm-zip')).default
  const zip = new AdmZip()

  function addDirToZip(dirPath, zipFolder) {
    for (const entry of readdirSync(dirPath)) {
      const fullPath = path.join(dirPath, entry)
      if (statSync(fullPath).isDirectory()) {
        addDirToZip(fullPath, zipFolder ? `${zipFolder}/${entry}` : entry)
      } else {
        zip.addLocalFile(fullPath, zipFolder || '')
      }
    }
  }

  addDirToZip(sourceDir, '')
  zip.writeZip(zipPath)
}

function generateStandalone(distDir) {
  try {
    const assets = readdirSync(path.join(distDir, 'assets'))
    const jsFile = assets.find(f => f.startsWith('index-') && f.endsWith('.js'))
    const cssFile = assets.find(f => f.startsWith('index-') && f.endsWith('.css'))
    if (!jsFile || !cssFile) return null

    const html = readFileSync(path.join(distDir, 'index.html'), 'utf-8')
    const js = readFileSync(path.join(distDir, 'assets', jsFile), 'utf-8')
    const css = readFileSync(path.join(distDir, 'assets', cssFile), 'utf-8')

    // Inlinear el favicon como data-URI para que standalone.html funcione con
    // file:// sin depender de un favicon.svg externo.
    let faviconDataUri = ''
    const faviconPath = path.join(distDir, 'favicon.svg')
    if (existsSync(faviconPath)) {
      faviconDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(readFileSync(faviconPath, 'utf-8'))}`
    }

    // Eliminar export {...}; del final del JS (no válido fuera de módulos)
    const jsClean = js.replace(/export\s*\{[^}]+\};?\s*$/, '')

    let result = html
      .replace(/<link rel="stylesheet"[^>]*>/, () => `<style>${css}</style>`)
      .replace(/<script[^>]*src=["'][^"']*["'][^>]*><\/script>/, () => `<script>${jsClean}</script>`)
      .replace(/crossorigin\s*=\s*"[^"]*"/g, '')
      .replace(/<link[^>]*rel="icon"[^>]*>/, () =>
        faviconDataUri ? `<link rel="icon" href="${faviconDataUri}" />` : '')
      // Eliminar type="module" si existe (no funciona con file://)
      .replace(/\s*type="module"/g, '')

    const out = path.join(distDir, 'standalone.html')
    writeFileSync(out, result, 'utf-8')
    return out
  } catch { return null }
}

async function main() {
  // Extraer versión desde docs/changelog.md (primera línea ## vX.X.X)
  const changelogPath = path.join(projectRoot, 'docs', 'changelog.md')
  const changelog = readFileSync(changelogPath, 'utf-8')
  const versionMatch = changelog.match(/^##\s+v(\d+\.\d+\.\d+)/m)
  const version = versionMatch ? versionMatch[1] : '0.0.0'
  const appName = 'MDMap'

  if (!existsSync(path.join(projectRoot, 'node_modules'))) {
    await run('npm', ['install'])
  }

  await run('npm', ['run', 'build'])

  const distDir = path.join(projectRoot, 'dist')
  if (!existsSync(distDir)) {
    throw new Error(`Build output not found: ${distDir}`)
  }

  mkdirSync(releaseDir, { recursive: true })

  // Prepare release folder (limpieza completa: ficheros y subdirectorios)
  const releaseDest = path.join(releaseDir, appName)
  if (existsSync(releaseDest)) {
    rmSync(releaseDest, { recursive: true, force: true })
  }
  mkdirSync(releaseDest, { recursive: true })

  // Eliminar ZIPs de versiones anteriores para no acumularlos en release/
  for (const entry of readdirSync(releaseDir)) {
    if (/^MDMap_v.*\.zip$/.test(entry)) {
      unlinkSync(path.join(releaseDir, entry))
    }
  }

  // Copy built files + server script
  function copyRecursive(src, dest) {
    mkdirSync(dest, { recursive: true })
    for (const entry of readdirSync(src)) {
      const srcPath = path.join(src, entry)
      const destPath = path.join(dest, entry)
      if (statSync(srcPath).isDirectory()) {
        copyRecursive(srcPath, destPath)
      } else {
        copyFileSync(srcPath, destPath)
      }
    }
  }
  copyRecursive(distDir, releaseDest)
  copyFileSync(path.join(projectRoot, 'server.mjs'), path.join(releaseDest, 'server.mjs'))

  // Generate standalone HTML (everything inlined, works with file:// in any browser)
  const standalonePath = generateStandalone(distDir)
  if (standalonePath) {
    copyFileSync(standalonePath, path.join(releaseDest, 'standalone.html'))
  }

  // Create ZIP
  const zipName = `${appName}_v${version}.zip`
  const zipPath = path.join(releaseDir, zipName)
  await createZip(releaseDest, zipPath)

  console.log(`\n✅ ${appName} v${version} compilado en:`)
  console.log(`   ${releaseDest}/`)
  console.log(`   ${zipPath}`)
  console.log(`\nPara ejecutar:`)
  console.log(`   - Sin dependencias: abre dist/standalone.html en el navegador`)
  if (process.platform === 'win32') {
    console.log(`   - Con Node.js: cd release\\${appName} && node server.mjs`)
  } else {
    console.log(`   - Con Node.js: cd release/${appName} && node server.mjs`)
  }
  console.log(`   - Servir con cualquier HTTP server: apunta al directorio dist/`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
