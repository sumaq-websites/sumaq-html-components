const { series, parallel, src, dest, watch } = require('gulp')
const del = require('del')
const fs = require('fs')
const path = require('path')
const sourcemaps = require('gulp-sourcemaps')
const sass = require('gulp-sass')
const { rollup } = require('rollup')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const { babel } = require('@rollup/plugin-babel')
const { terser } = require('rollup-plugin-terser')
var postcss = require('gulp-postcss')
const cssnano = require('cssnano')
const purgecss = require('@fullhuman/postcss-purgecss')
var mustache = require('mustache')
const globby = require('globby')
const Window = require('window')

const { document } = new Window()

var browserSync = require('browser-sync').create()

const isProduction = process.env.NODE_ENV === 'production'

const dir = {
  tmp: path.join(process.cwd(), '.tmp'),
  src: path.join(process.cwd(), 'src'),
  dist: path.join(process.cwd(), '_site'),
  public: path.join(process.cwd(), 'public'),
  components: path.join(process.cwd(), './node_modules/@sumaq/html-components')
}

const config = require('./src/config')
const { template } = require('@babel/core')

/**
 * Lee las templates para generar las paginas principales
 * @param {Carpeta de archivos} tplDir
 */
async function _getTemplates(tplDir = path.join(dir.src, 'pages')) {
  const source = path.join(tplDir, '**/*.html')
  return globby.sync(source).map((file) => {
    const parse = path.parse(file)
    const fileDir = path.basename(parse.dir.replace(tplDir, '')) // parse.dir.substr(parse.dir.indexOf(tplDir) + (tplDir.length + 1))
    return {
      dir: fileDir,
      filename: parse.base,
      name: parse.name,
      file
    }
  })
}

/**
 * Partial de mustache
 */
async function _getPartials() {
  return globby
    .sync([`${dir.components}/html/**/*.html`, `${dir.src}/components/html/**/*.html`])
    .reduce((partials, file) => {
      const parse = path.parse(file)
      const partial = fs.readFileSync(file, 'utf8')
      return { ...partials, [parse.name]: partial.toString() }
    }, {})
}

function _removeLineBreaks(str) {
  return str.replace(/(\r\n|\n|\r)/gm, '').replace(/\s+/g, ' ')
}

function _startServer(baseDir, filePath) {
  const _404s = globby.sync(path.join(filePath, '**/404.html')).reduce((acc, file) => {
    const fileDir = path.basename(path.parse(file).dir.replace(filePath, ''))
    const route = fileDir ? `/${fileDir}/` : 'index'
    acc[route] = fs.readFileSync(file, 'utf8')
    return acc
  }, {})

  const routes = config.i18n.routes.reduce((_routes, route) => {
    return { ..._routes, [route.path]: `${filePath}/${route.name}.html` }
  }, {})

  browserSync.init(
    {
      server: {
        baseDir,
        routes
      }
    },
    (err, bs) => {
      bs.addMiddleware('*', (req, res) => {
        let _404 = _404s['index']
        for (const route in _404s) {
          if (req.url.startsWith(route)) {
            _404 = _404s[route]
          }
        }
        res.write(_404)
        res.end()
      })
    }
  )
}

async function clean() {
  const hasTmpDir = fs.existsSync(dir.tmp)
  if (!hasTmpDir) {
    fs.mkdirSync(dir.tmp)
  }
  const hasDistDir = fs.existsSync(dir.dist)
  if (!hasDistDir) {
    fs.mkdirSync(dir.dist)
  }
  return del.sync([`${dir.tmp}/**/*`, `${dir.dist}/**/*`, `${dir.dist}/**/.*`])
}

async function scripts(cb) {
  const bundle = await rollup({
    input: `${dir.src}/scripts/scripts.js`,
    plugins: [nodeResolve(), babel({ babelHelpers: 'bundled' })]
  })

  return bundle.write({
    file: `${dir.tmp}/scripts.js`,
    format: 'esm'
  })
}

function styles() {
  return src(`${dir.src}/styles/*.scss`)
    .pipe(sass().on('error', sass.logError))
    .pipe(dest(dir.tmp))
    .pipe(browserSync.stream({ match: '**/*.css' }))
}

async function markups(cb) {
  try {
    const partials = await _getPartials()
    const templates = await _getTemplates()
    templates.forEach((tpl) => {
      const template = fs.readFileSync(tpl.file, 'utf8').toString()
      const templateStr = mustache.render(template, {}, partials, ['{%', '%}'])
      const dataPath = path.join(dir.src, 'data', tpl.dir, `${tpl.name}.json`)
      const view = JSON.parse(fs.readFileSync(dataPath, 'utf8').toString())
      const data = { ...view, ...config.functions }
      const htmlStr = mustache.render(templateStr, data, partials, ['{{', '}}'])
      const filePath = path.join(dir.tmp, tpl.dir, tpl.filename)
      fs.mkdirSync(path.join(dir.tmp, tpl.dir), { recursive: true })
      fs.writeFileSync(filePath, htmlStr)
    })
    cb()
  } catch (error) {
    cb(error)
  }
}

function server(cb) {
  _startServer([dir.tmp, dir.public], dir.tmp)

  watch([`${dir.src}/**/*.scss`], styles)
  watch(`${dir.src}/scripts/**/*`, scripts)
  watch(
    [`${dir.components}/html/**/*.html`, `${dir.src}/**/*.html`, `${dir.src}/data/**/*.json`, './mustacheFunctions.js'],
    markups
  )
  watch([`${dir.tmp}/**/*.js`, `${dir.tmp}/**/*.html`]).on('change', browserSync.reload)
}

function copy(cb) {
  return src([`${dir.public}/**/*`]).pipe(dest(dir.dist))
}

/**
 * Compila los html y los deja listo para generar la versión que va a firebase y a publicarse en netlify
 */
async function html(cb) {
  try {
    const partials = await _getPartials()
    const templates = await _getTemplates()
    // Esto se envía a firebase
    templates.forEach((tpl) => {
      const template = fs.readFileSync(tpl.file, 'utf8').toString()
      const htmlStr = mustache.render(template, {}, partials, ['{%', '%}'])
      const filePath = path.join(dir.tmp, tpl.dir, tpl.filename)
      fs.mkdirSync(path.join(dir.tmp, tpl.dir), { recursive: true })
      fs.writeFileSync(filePath, _removeLineBreaks(htmlStr))
    })

    // Esto se envía a netlify
    const tmpTemplateFiles = await _getTemplates(dir.tmp)
    tmpTemplateFiles.forEach((tpl) => {
      const template = fs.readFileSync(tpl.file, 'utf8').toString()
      const dataPath = path.join(dir.src, 'data', tpl.dir, `${tpl.name}.json`)
      const view = JSON.parse(fs.readFileSync(dataPath, 'utf8').toString())
      const data = { ...view, ...config.functions }
      const htmlStr = mustache.render(template, data, partials, ['{{', '}}'])
      const filePath = path.join(dir.dist, tpl.dir, tpl.filename)
      fs.mkdirSync(path.join(dir.dist, tpl.dir), { recursive: true })
      fs.writeFileSync(filePath, _removeLineBreaks(htmlStr))
    })

    cb()
  } catch (error) {
    cb(error)
  }

  cb()
}

function css(cb) {
  var plugins = [
    purgecss({
      content: [`${dir.tmp}/*.html`]
    }),
    cssnano({
      preset: 'default'
    })
  ]

  return src(`${dir.tmp}/*.css`)
    .pipe(sourcemaps.init())
    .pipe(postcss(plugins))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(`${dir.dist}`))
}

async function js(cb) {
  const bundle = await rollup({
    input: `${dir.tmp}/scripts.js`
  })

  return bundle.write({
    file: `${dir.dist}/scripts.js`,
    format: 'esm',
    sourcemap: true,
    plugins: [terser()]
  })
}

function webserver(cb) {
  _startServer(dir.dist, dir.dist)
}

async function sumaqHtml(cb) {
  try {
    const partials = await _getPartials()
    const templates = await _getTemplates()
    // fs.writeFileSync(path.join(dir.tmp, 'partials.json'), JSON.stringify(partials))
    // Esto se envía a firebase
    templates.forEach((tpl) => {
      const template = fs.readFileSync(tpl.file, 'utf8').toString()
      const htmlStr = mustache.render(template, {}, partials, ['{%', '%}'])
      const filePath = path.join(dir.tmp, tpl.dir, tpl.filename)
      fs.mkdirSync(path.join(dir.tmp, tpl.dir), { recursive: true })
      // fs.writeFileSync(filePath, htmlStr)
      fs.writeFileSync(filePath, _removeLineBreaks(htmlStr))
    })
    cb()
  } catch (error) {
    cb(error)
  }

  cb()
}

// function publish(cb) {
//   cb();
// }

const serve = series(clean, parallel(markups, styles, scripts), server)
exports.default = serve
exports.serve = serve
exports.build = series(clean, parallel(styles, scripts), parallel(html, css, js), copy)
// exports.publish = publish;
// exports.upload = upload;
exports.clean = clean
exports.markups = markups
exports.html = html
exports.css = css
exports.js = js
exports.webserver = webserver
exports.sumaq = series(clean, parallel(styles, scripts, sumaqHtml), parallel(css, js))
