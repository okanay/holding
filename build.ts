import { build } from 'bun'
import {
  existsSync,
  readdirSync,
  mkdirSync,
  copyFileSync,
  statSync,
  watch as fsWatch,
} from 'fs'
import path from 'path'

// Sabit değerler
const DIRECTORIES = {
  src: './src',
  dist: './dist',
  get pages() {
    return path.join(this.src, 'pages') // Yeni pages dizini
  },
  get assets() {
    return path.join(this.src, 'assets')
  },
  get scripts() {
    return path.join(this.assets, 'scripts')
  },
  get packages() {
    return path.join(this.scripts, 'packages')
  },
  get uiForms() {
    return path.join(this.scripts, 'ui')
  },
  get constants() {
    return path.join(this.src, 'constants')
  },
  get styles() {
    return path.join(this.assets, 'styles')
  },
  get deps() {
    return path.join(this.scripts, 'deps')
  },
}

const PAGES = {
  scripts: ['layout', 'main', 'about', 'contact', 'press-example', 'team'],
  directories: ['layout', 'main', 'about', 'contact', 'press-example', 'team'],
}

// Build yapılandırması
const BUILD_CONFIG = {
  format: 'esm' as const,
  external: ['*'],
  splitting: true,
}

const DEPS_BUILD_CONFIG = {
  format: 'esm' as const,
  external: [], // Hiçbir şeyi external olarak işaretleme
  splitting: false, // Code splitting'i kapat
  bundle: true, // Tüm bağımlılıkları bundle et
}

// Dosya işlem takibi için cache
const fileCache = new Map<string, number>()

// Yardımcı fonksiyonlar
function isFileChanged(filePath: string): boolean {
  if (!existsSync(filePath)) return false
  const currentMtime = statSync(filePath).mtimeMs
  const previousMtime = fileCache.get(filePath)

  if (previousMtime !== currentMtime) {
    fileCache.set(filePath, currentMtime)
    return true
  }
  return false
}

function ensureDirectoryExists(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function getOutputDirectory(type: 'scripts' | 'packages' | 'ui' | 'styles') {
  const base = path.join(DIRECTORIES.dist, 'assets')
  switch (type) {
    case 'scripts':
      return path.join(base, 'scripts')
    case 'packages':
      return path.join(base, 'scripts', 'packages')
    case 'ui':
      return path.join(base, 'scripts', 'ui')
    case 'styles':
      return path.join(base, 'styles')
    default:
      return base
  }
}

// Constants dosyalarının build edilmesi
async function buildConstants() {
  if (!existsSync(DIRECTORIES.constants)) return

  const outdir = path.join(DIRECTORIES.dist, 'constants')
  ensureDirectoryExists(outdir)

  const constantFiles = readdirSync(DIRECTORIES.constants).filter(file =>
    file.endsWith('.ts'),
  )

  for (const file of constantFiles) {
    const entrypoint = path.join(DIRECTORIES.constants, file)
    if (isFileChanged(entrypoint)) {
      const basename = path.basename(file, '.ts')
      await build({
        ...BUILD_CONFIG,
        entrypoints: [entrypoint],
        outdir,
        minify: false,
        naming: `${basename}.js`,
      })
      console.log(`Constants güncellendi: ${basename}.js`)
    }
  }
}

// Diğer build fonksiyonları güncellendi
async function buildPageSpecificTS(script: string) {
  const entrypoint = path.join(DIRECTORIES.scripts, `${script}.ts`)
  if (!isFileChanged(entrypoint)) return

  const outdir = getOutputDirectory('scripts')
  ensureDirectoryExists(outdir)

  await build({
    ...BUILD_CONFIG,
    entrypoints: [entrypoint],
    outdir,
    minify: false,
    naming: `${script}.js`,
  })
  console.log(`${script}.js güncellendi`)
}

async function buildUIForms(specificFile?: string) {
  if (!existsSync(DIRECTORIES.uiForms)) return

  const outdir = getOutputDirectory('ui')
  ensureDirectoryExists(outdir)

  const buildForm = async (formFile: string) => {
    const entrypoint = path.join(DIRECTORIES.uiForms, formFile)
    if (isFileChanged(entrypoint)) {
      const basename = path.basename(formFile, '.ts')
      await build({
        ...BUILD_CONFIG,
        entrypoints: [entrypoint],
        outdir,
        minify: false,
        naming: `${basename}.js`,
      })
      console.log(`UI Form güncellendi: ${basename}.js`)
    }
  }

  if (specificFile) {
    await buildForm(specificFile)
  } else {
    const forms = readdirSync(DIRECTORIES.uiForms).filter(file =>
      file.endsWith('.ts'),
    )
    for (const form of forms) {
      await buildForm(form)
    }
  }
}

async function buildSharedPackages(specificFile?: string) {
  if (!existsSync(DIRECTORIES.packages)) return

  const outdir = getOutputDirectory('packages')
  ensureDirectoryExists(outdir)

  const buildPackage = async (packageFile: string) => {
    const entrypoint = path.join(DIRECTORIES.packages, packageFile)
    if (isFileChanged(entrypoint)) {
      const basename = path.basename(packageFile, '.ts')
      await build({
        ...BUILD_CONFIG,
        entrypoints: [entrypoint],
        outdir,
        minify: true,
        naming: `${basename}.js`,
      })
      console.log(`Package güncellendi: ${basename}.js`)
    }
  }

  if (specificFile) {
    await buildPackage(specificFile)
  } else {
    const packages = readdirSync(DIRECTORIES.packages).filter(file =>
      file.endsWith('.ts'),
    )
    for (const packageFile of packages) {
      await buildPackage(packageFile)
    }
  }
}

async function buildExternals(specificFile?: string) {
  if (!existsSync(DIRECTORIES.deps)) return

  const outdir = path.join(DIRECTORIES.dist, 'assets/scripts/deps')
  ensureDirectoryExists(outdir)

  const buildExternal = async (depsFile: string) => {
    const entrypoint = path.join(DIRECTORIES.deps, depsFile)
    if (isFileChanged(entrypoint)) {
      const basename = path.basename(depsFile, '.ts')
      await build({
        ...DEPS_BUILD_CONFIG,
        entrypoints: [entrypoint],
        outdir,
        minify: true,
        naming: `${basename}.js`,
      })
      console.log(`External paket güncellendi: ${basename}.js`)
    }
  }

  if (specificFile) {
    await buildExternal(specificFile)
  } else {
    const depsFiles = readdirSync(DIRECTORIES.deps).filter(file =>
      file.endsWith('.ts'),
    )
    for (const file of depsFiles) {
      await buildExternal(file)
    }
  }
}

async function buildAll() {
  fileCache.clear()
  await buildConstants()
  await buildExternals() // Externals build'i ekle
  for (const script of PAGES.scripts) {
    await buildPageSpecificTS(script)
  }
  await buildSharedPackages()
  await buildUIForms()
  copyHTML()
  copyStyles()
  copyAssets()
}

function watchFiles() {
  console.log('Watch modu başlatıldı...')

  // src klasörünü izle
  fsWatch(DIRECTORIES.src, { recursive: true }, async (event, filename) => {
    if (!filename) return

    const relativePath = filename.replace(/\\/g, '/')
    console.log(`Değişiklik algılandı (src): ${relativePath}`)

    if (relativePath.includes('scripts/deps/')) {
      // External paketler için kontrol
      await buildExternals(path.basename(relativePath))
    } else if (relativePath.startsWith('constants/')) {
      await buildConstants()
    } else if (relativePath.endsWith('.ts')) {
      if (relativePath.includes('ui/')) {
        await buildUIForms(path.basename(relativePath))
      } else if (relativePath.includes('packages/')) {
        await buildSharedPackages(path.basename(relativePath))
      } else {
        const script = PAGES.scripts.find(s => relativePath.includes(`${s}.ts`))
        if (script) await buildPageSpecificTS(script)
      }
    } else if (relativePath.endsWith('.html')) {
      copyHTML(path.basename(relativePath))
    } else if (relativePath.endsWith('.css')) {
      copyStyles(path.basename(relativePath))
    } else if (relativePath.startsWith('assets/')) {
      copyAssets(relativePath.replace('assets/', ''))
    } else if (relativePath.startsWith('pages/')) {
      // Pages klasörü değişikliği için
      copyHTML(path.basename(relativePath))
    }
  })

  // pages klasörünü izle (eğer varsa)
  if (existsSync(DIRECTORIES.pages)) {
    fsWatch(DIRECTORIES.pages, { recursive: true }, async (event, filename) => {
      if (!filename) return

      const relativePath = filename.replace(/\\/g, '/')
      console.log(`Değişiklik algılandı (pages): ${relativePath}`)

      if (relativePath.endsWith('.html')) {
        copyHTML(path.basename(relativePath))
      }
    })
  }
}

// Copy fonksiyonları aynı kalabilir
function copyFileIfChanged(src: string, dest: string): boolean {
  if (!existsSync(src)) return false

  if (isFileChanged(src)) {
    ensureDirectoryExists(path.dirname(dest))
    copyFileSync(src, dest)
    return true
  }
  return false
}

function copyFileRecursive(src: string, dest: string, onlyCopyChanged = true) {
  if (statSync(src).isDirectory()) {
    ensureDirectoryExists(dest)
    readdirSync(src).forEach(childItemName => {
      const srcChildPath = path.join(src, childItemName)
      const destChildPath = path.join(dest, childItemName)
      copyFileRecursive(srcChildPath, destChildPath, onlyCopyChanged)
    })
  } else {
    if (!onlyCopyChanged || isFileChanged(src)) {
      copyFileSync(src, dest)
      console.log(`Dosya kopyalandı: ${dest}`)
    }
  }
}

function copyAssets(specificFile?: string) {
  const distAssetsDir = path.join(DIRECTORIES.dist, 'assets')
  if (existsSync(DIRECTORIES.assets)) {
    ensureDirectoryExists(distAssetsDir)

    if (specificFile) {
      const srcPath = path.join(DIRECTORIES.assets, specificFile)
      const destPath = path.join(distAssetsDir, specificFile)
      if (copyFileIfChanged(srcPath, destPath)) {
        console.log(`Asset güncellendi: ${specificFile}`)
      }
    } else {
      copyFileRecursive(DIRECTORIES.assets, distAssetsDir)
    }
  }
}

function copyHTML(specificFile?: string) {
  PAGES.directories.forEach(dir => {
    // Önce pages klasöründe arayalım, yoksa eski yolda arayalım
    const srcDirPath = path.join(DIRECTORIES.pages, dir)
    const oldSrcDirPath = path.join(DIRECTORIES.src, dir)

    // Pages klasöründe bu dizin varsa oradan kopyala - dist/pages içine
    if (existsSync(srcDirPath)) {
      // dist/pages ve alt dizini oluştur
      const destPagesDir = path.join(DIRECTORIES.dist, 'pages')
      const destDirPath = path.join(destPagesDir, dir)
      ensureDirectoryExists(destDirPath)

      if (specificFile) {
        const srcPath = path.join(srcDirPath, specificFile)
        const destPath = path.join(destDirPath, specificFile)
        if (copyFileIfChanged(srcPath, destPath)) {
          console.log(`HTML güncellendi (pages): ${specificFile}`)
        }
      } else {
        readdirSync(srcDirPath)
          .filter(file => file.endsWith('.html'))
          .forEach(file => {
            const srcPath = path.join(srcDirPath, file)
            const destPath = path.join(destDirPath, file)
            if (copyFileIfChanged(srcPath, destPath)) {
              console.log(`HTML güncellendi (pages): ${file}`)
            }
          })
      }
    }
    // Eski yolda bu dizin varsa oradan kopyala (geriye dönük uyumluluk)
    else if (existsSync(oldSrcDirPath)) {
      const destDirPath = path.join(DIRECTORIES.dist, dir)
      ensureDirectoryExists(destDirPath)

      if (specificFile) {
        const srcPath = path.join(oldSrcDirPath, specificFile)
        const destPath = path.join(destDirPath, specificFile)
        if (copyFileIfChanged(srcPath, destPath)) {
          console.log(`HTML güncellendi (src): ${specificFile}`)
        }
      } else {
        readdirSync(oldSrcDirPath)
          .filter(file => file.endsWith('.html'))
          .forEach(file => {
            const srcPath = path.join(oldSrcDirPath, file)
            const destPath = path.join(destDirPath, file)
            if (copyFileIfChanged(srcPath, destPath)) {
              console.log(`HTML güncellendi (src): ${file}`)
            }
          })
      }
    }
  })
}

function copyStyles(specificFile?: string) {
  const distStylesDir = getOutputDirectory('styles')

  if (!existsSync(DIRECTORIES.styles)) return
  ensureDirectoryExists(distStylesDir)

  if (specificFile) {
    const srcPath = path.join(DIRECTORIES.styles, specificFile)
    const destPath = path.join(distStylesDir, specificFile)
    if (copyFileIfChanged(srcPath, destPath)) {
      console.log(`CSS güncellendi: ${specificFile}`)
    }
  } else {
    readdirSync(DIRECTORIES.styles)
      .filter(file => file.endsWith('.css'))
      .forEach(file => {
        const srcPath = path.join(DIRECTORIES.styles, file)
        const destPath = path.join(distStylesDir, file)
        if (copyFileIfChanged(srcPath, destPath)) {
          console.log(`CSS güncellendi: ${file}`)
        }
      })
  }
}

async function main() {
  if (process.argv.includes('--watch')) {
    await buildAll()
    watchFiles()
  } else {
    await buildAll()
  }
}

main()
