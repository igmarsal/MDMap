import { spawn, execSync } from 'node:child_process'
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
    const standaloneDir = path.join(projectRoot, 'dist-standalone')
    mkdirSync(standaloneDir, { recursive: true })

    // Build con configuración IIFE — genera standalone.js directamente
    execSync(
      `npx vite build --config vite.standalone.config.ts --outDir "${standaloneDir}"`,
      { cwd: projectRoot, stdio: 'inherit', shell: process.platform === 'win32' }
    )

    // Leer los archivos generados
    const htmlFile = path.join(standaloneDir, 'index.html')
    const jsFile = path.join(standaloneDir, 'standalone.js')
    if (!existsSync(htmlFile) || !existsSync(jsFile)) return null

    const html = readFileSync(htmlFile, 'utf-8')
    const js = readFileSync(jsFile, 'utf-8')

    // Favicon como data-URI
    let faviconDataUri = ''
    const faviconPath = path.join(standaloneDir, 'favicon.svg')
    if (existsSync(faviconPath)) {
      faviconDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(readFileSync(faviconPath, 'utf-8'))}`
    }

    // Inline JS: reemplazar <script src="..."> por <script>contenido</script>
    let result = html
      .replace(/<link[^>]*rel="icon"[^>]*>/, () =>
        faviconDataUri ? `<link rel="icon" href="${faviconDataUri}" />` : '')
      .replace(/<script[^>]*src=["'][^"']*["'][^>]*><\/script>/, () => `<script>${js}</script>`)
      // Eliminar type="module" (no funciona con file://)
      .replace(/\s*type="module"/g, '')
      // Eliminar crossorigin
      .replace(/crossorigin\s*=\s*"[^"]*"/g, '')

    // Mover el script inline al <body> después de <div id="root">.
    // El atributo defer no funciona en scripts inline (solo en scripts con src),
    // así que movemos físicamente el tag.
    const scriptStart = result.indexOf('<script>')
    const scriptEnd = result.indexOf('</script>') + '</script>'.length
    if (scriptStart !== -1 && scriptEnd > scriptStart) {
      const scriptTag = result.slice(scriptStart, scriptEnd)
      result = result.slice(0, scriptStart) + result.slice(scriptEnd)
      const bodyEnd = result.indexOf('</body>')
      if (bodyEnd !== -1) {
        result = result.slice(0, bodyEnd) + '\n    ' + scriptTag + '\n  ' + result.slice(bodyEnd)
      }
    }

    const out = path.join(distDir, 'standalone.html')
    writeFileSync(out, result, 'utf-8')
    rmSync(standaloneDir, { recursive: true, force: true })
    return out
  } catch (e) { console.error('Error generando standalone:', e); return null }
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
