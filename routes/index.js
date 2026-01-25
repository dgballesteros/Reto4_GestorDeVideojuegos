var express = require('express');
var path = require('path');
var router = express.Router();
var authMiddleware = require('../middlewares/auth');
var Database = require('../data/database');
const UsuarioDAO = require('../data/usuario-dao');
const VideojuegoDAO = require('../data/videojuegos-dao');
var multer = require('multer');
var imagenes = multer({ dest: 'public/images/'});

const db = Database.getInstance(path.join(process.cwd(), 'data', 'db.sqlite'));
const usuarioDAO = new UsuarioDAO(db);
const videojuegoDAO = new VideojuegoDAO(db);

/* ========== LOGIN / AUTENTICACIÓN ========== */

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.post('/login', function(req, res, next) {
  const user = usuarioDAO.findUserByEmail(req.body.name);
  if (user) {
    if (user.password === req.body.password) {
      req.session.user = user;
      if (user.email === 'admin' && user.password === 'admin') {
        res.redirect('/admin');
      } else {
        res.redirect('/');
      }
    } else {
      res.redirect('/login');
    }
  } else {
    res.redirect('/login');
  }
});

router.get('/logout', function(req, res, next) {
  req.session.destroy(function(err) {
    if (err) return next(err);
    res.redirect('/');
  });
});

/* ========== ADMIN ========== */

router.get('/admin', function(req, res, next) {
  res.render('admin');
});
/* ========== PÚBLICO ========== */

router.get('/', function(req, res, next) {
  res.render('index', {});
});

router.get('/about-us', function(req, res, next) {
  res.render('about');
});

/* ========== PROTEGIDAS (login requerido) ========== */

router.get('/add-game', authMiddleware, function(req, res, next) {
  res.render('add-game');
});

router.post('/add-game', authMiddleware, imagenes.single('imagen'), function(req, res, next) { 
  const userID = req.session.user.id;
  const nombre = req.body.nombre;
  const descripcion = req.body.descripcion;
  const genero = req.body.genero;
  const imagen = req.file.filename;
  if (videojuegoDAO.saveVideojuego(userID, nombre, descripcion, genero, imagen)) {
    res.redirect('/my-collection');
  } else {
    res.redirect('/add-game');
  }
});

router.get('/my-collection', authMiddleware, function(req, res, next) {
  const games = videojuegoDAO.findVideojuegoByUserId(req.session.user.id);
  res.render('my-collection', { games });
});

/* ========== ADMIN / VIEW ========== */

router.get('/view-users', function(req, res, next) {
  const users = usuarioDAO.showUsers();
  res.render('view-users', { users });
});

router.get('/view-games', function(req, res, next) {
  const games = videojuegoDAO.showGames();
  res.render('view-games', { games });
});

/* ========== REGISTER ========== */

router.get('/register', function(req, res, next) {
  res.render('register');
});

router.post('/register', function(req, res, next) { 
  const email = req.body.email;
  const password = req.body.password;
  const passwordRepeat = req.body.passwordRepeat;
  if (password === passwordRepeat) {
    if (usuarioDAO.saveUsuario(email, password)) {
      res.redirect('/login');
    } else {
      res.redirect('/register');
    }
  } else {
    res.redirect('/register');
  }
});

module.exports = router;
