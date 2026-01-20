var createError = require('http-errors');
var express = require('express');
var path = require('path');
var fs = require('fs');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressLayouts = require('express-ejs-layouts');
var expressSession = require('express-session');

var authMiddleware = require('./middlewares/auth');
var indexRouter = require('./routes/index');

// ✅ IMPORTANTE: database.js está dentro de /data
var Database = require('./data/database');

var app = express();

/* =====================================================
   INICIALIZACIÓN DE SQLITE
   ===================================================== */

// Asegurar que existe la carpeta /data
var dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });

// Ruta al archivo SQLite
var dbPath = path.join(dataDir, 'db.sqlite');

// Abre / crea la base de datos y ejecuta initialize-usuarios y initialize-videojuegos
var db = Database.getInstance(dbPath);

// Hacer la DB accesible desde toda la app si hace falta
app.locals.db = db;

/* =====================================================
   VIEW ENGINE
   ===================================================== */

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);

/* =====================================================
   MIDDLEWARES
   ===================================================== */

// Logging manual
app.use((req, res, next) => {
  console.log(`Nueva petición en ${req.hostname} a las ${(new Date()).toISOString()}`);
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Sesiones
app.use(expressSession({
  secret: 'mi-clave-secreta-supersegura',
  resave: false,
  saveUninitialized: false, // correcto para login
  cookie: { secure: false } // true solo con HTTPS
}));

// Hacer la sesión accesible en EJS
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

/* =====================================================
   RUTAS
   ===================================================== */

app.use('/', indexRouter);

/* =====================================================
   ERRORES
   ===================================================== */

// 404
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
