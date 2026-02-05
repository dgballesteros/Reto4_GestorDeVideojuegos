var express = require('express');
var path = require('path');
var router = express.Router();
var authMiddleware = require('../middlewares/auth');
var Database = require('../data/database');
const UsuarioDAO = require('../data/usuario-dao');
const VideojuegoDAO = require('../data/videojuegos-dao');
var multer = require('multer');
var uploadsDir = path.join(process.cwd(), 'public', 'user-uploads');
var imagenes = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      var name = path.basename(file.originalname);
      if (!name || name === '.' || name === '..') {
        name = Date.now() + (path.extname(file.originalname) || '.jpg');
      }
      cb(null, name);
    }
  })
});

const db = Database.getInstance(path.join(process.cwd(), 'data', 'db.sqlite'));
const usuarioDAO = new UsuarioDAO(db);
const videojuegoDAO = new VideojuegoDAO(db);

/* ========== LOGIN / AUTENTICACIÓN ========== */

router.get('/login', function(req, res, next) {
  const redirect = (req.query.redirect && req.query.redirect.startsWith('/')) ? req.query.redirect : '';
  const flash = req.session.flash || null;
  if (req.session.flash) delete req.session.flash;
  res.render('login', { redirect, flash });
});

router.post('/login', function(req, res, next) {
  const user = usuarioDAO.findUserByEmail(req.body.name);
  const redirectTo = (req.body.redirect && req.body.redirect.startsWith('/')) ? req.body.redirect : null;
  if (user) {
    if (user.password === req.body.password) {
      req.session.user = user;
      if (user.email === 'admin' && user.password === 'admin') {
        res.redirect(redirectTo || '/admin');
      } else {
        res.redirect(redirectTo || '/');
      }
    } else {
      req.session.flash = 'Invalid email or password.';
      res.redirect(redirectTo ? '/login?redirect=' + encodeURIComponent(redirectTo) : '/login');
    }
  } else {
    req.session.flash = 'Invalid email or password.';
    res.redirect(redirectTo ? '/login?redirect=' + encodeURIComponent(redirectTo) : '/login');
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
  const flash = req.session.flash || null;
  if (req.session.flash) {
    delete req.session.flash;
  }
  res.render('index', { flash });
});

router.get('/about-us', function(req, res, next) {
  res.render('about');
});

router.post('/add-to-collection', authMiddleware, function(req, res, next) {
  const sourceId = req.body.gameId || req.body.id;
  if (!sourceId) {
    return res.redirect(req.get('Referer') || '/');
  }
  const source = videojuegoDAO.findVideojuegoById(sourceId);
  if (!source) {
    return res.redirect(req.get('Referer') || '/');
  }
  const userId = req.session.user.id;
  /* Si el juego origen no tiene imagen, usar la de otro con el mismo título (p. ej. el del catálogo) */
  let imagen = source.imagen || null;
  if (!imagen && source.titulo) {
    const conImagen = videojuegoDAO.findOneWithImageByTitle(source.titulo);
    if (conImagen && conImagen.imagen) imagen = conImagen.imagen;
  }
  videojuegoDAO.saveVideojuego(
    userId,
    source.titulo,
    source.descripcion || '',
    source.genero,
    imagen,
    source.plataforma,
    0
  );
  req.session.flash = 'Juego añadido a la colección correctamente';
  const back = req.get('Referer') || '/';
  res.redirect(back);
});

/* ========== PROTEGIDAS (login requerido) ========== */

router.get('/add-game', authMiddleware, function(req, res, next) {
  res.render('add-game');
});

router.post('/add-game', authMiddleware, imagenes.single('imagen'), function(req, res, next) {
  const userID = req.session.user.id;
  const titulo = (req.body.nombre || req.body.titulo || '').trim();
  if (!titulo) {
    return res.redirect('/add-game');
  }
  const descripcion = req.body.descripcion || '';
  const genero = req.body.genero || null;
  const plataforma = req.body.plataforma || null;
  const imagen = req.file ? 'user-uploads/' + req.file.filename : null;
  const completado = req.body.estado === '1' ? 1 : 0;
  try {
    videojuegoDAO.saveVideojuego(userID, titulo, descripcion, genero, imagen, plataforma, completado);
    res.redirect('/my-collection');
  } catch (e) {
    res.redirect('/add-game');
  }
});

router.get('/my-collection', authMiddleware, function(req, res, next) {
  const userId = req.session.user.id;
  const filters = {
    plataforma: req.query.plataforma || '',
    genero: req.query.genero || '',
    estado: req.query.estado !== undefined && req.query.estado !== '' ? req.query.estado : null
  };
  const games = videojuegoDAO.findVideojuegoByUserIdFiltered(userId, filters);
  const allGames = videojuegoDAO.findVideojuegoByUserId(userId);
  const plataformas = [...new Set(allGames.map(g => g.plataforma).filter(Boolean))].sort();
  const generos = [...new Set(allGames.map(g => g.genero).filter(Boolean))].sort();
  const showFilters = allGames.length > 0;

  const flash = req.session.flash || null;
  if (req.session.flash) {
    delete req.session.flash;
  }
  res.render('my-collection', { games, plataformas, generos, filters, showFilters, flash });
});

router.get('/my-collection/:id/edit', authMiddleware, function(req, res, next) {
  const game = videojuegoDAO.findVideojuegoById(req.params.id);
  if (!game) return res.redirect('/my-collection');
  const isAdmin = req.session.user.email === 'admin';
  const isOwner = Number(game.id_usuario) === Number(req.session.user.id);
  if (!isAdmin && !isOwner) {
    return res.redirect('/my-collection');
  }
  res.render('edit-game', { game, isAdmin });
});

router.post('/my-collection/:id/edit', authMiddleware, imagenes.single('imagen'), function(req, res, next) {
  const gameId = req.params.id;
  const game = videojuegoDAO.findVideojuegoById(gameId);
  if (!game) return res.redirect('/my-collection');
  const isAdmin = req.session.user.email === 'admin';
  const isOwner = Number(game.id_usuario) === Number(req.session.user.id);
  if (!isAdmin && !isOwner) {
    return res.redirect('/my-collection');
  }
  const titulo = (req.body.nombre || req.body.titulo || '').trim();
  if (!titulo) {
    return res.redirect('/my-collection/' + gameId + '/edit');
  }
  const descripcion = (req.body.descripcion || '').trim() || null;
  const genero = (req.body.genero || '').trim() || null;
  const plataforma = (req.body.plataforma || '').trim() || null;
  const completado = req.body.estado === '1' ? 1 : 0;
  try {
    videojuegoDAO.updateVideojuego(gameId, { titulo, descripcion, genero, plataforma, completado });
    if (req.file && req.file.filename) {
      videojuegoDAO.updateVideojuegoImagen(gameId, 'user-uploads/' + req.file.filename);
    }
    req.session.flash = 'Game updated successfully.';
    res.redirect(isAdmin ? '/view-games' : '/my-collection');
  } catch (e) {
    res.redirect('/my-collection/' + gameId + '/edit');
  }
});

router.post('/my-collection/:id/delete', authMiddleware, function(req, res, next) {
  const game = videojuegoDAO.findVideojuegoById(req.params.id);
  if (!game) {
    return res.redirect('/my-collection');
  }
  const isAdmin = req.session.user.email === 'admin';
  const isOwner = Number(game.id_usuario) === Number(req.session.user.id);
  if (!isAdmin && !isOwner) {
    return res.redirect('/my-collection');
  }
  videojuegoDAO.deleteVideojuego(req.params.id);
  res.redirect(req.get('Referer') || '/my-collection');
});

router.post('/my-collection/:id/state', authMiddleware, function(req, res, next) {
  const game = videojuegoDAO.findVideojuegoById(req.params.id);
  if (!game || Number(game.id_usuario) !== Number(req.session.user.id)) {
    return res.redirect('/my-collection');
  }
  const completado = req.body.completado === '1' ? 1 : 0;
  videojuegoDAO.updateEstado(req.params.id, completado);
  res.redirect('/my-collection');
});

/* ========== ADMIN / VIEW (solo administrador) ========== */

function adminOnly(req, res, next) {
  if (!req.session || !req.session.user || req.session.user.email !== 'admin') {
    return res.redirect('/');
  }
  next();
}

router.get('/view-users', authMiddleware, adminOnly, function(req, res, next) {
  const users = usuarioDAO.showUsers();
  const flash = req.session.flash || null;
  if (req.session.flash) delete req.session.flash;
  res.render('view-users', { users, flash });
});

router.post('/view-users/:id/delete', authMiddleware, adminOnly, function(req, res, next) {
  const userId = req.params.id;
  const user = usuarioDAO.showUsers().find(function(u) { return String(u.id) === String(userId); });
  if (!user) {
    return res.redirect('/view-users');
  }
  if (user.email === 'admin') {
    req.session.flash = 'Cannot delete the administrator account.';
    return res.redirect('/view-users');
  }
  videojuegoDAO.deleteVideojuegosByUserId(userId);
  usuarioDAO.deleteUsuario(userId);
  req.session.flash = 'User deleted successfully.';
  res.redirect('/view-users');
});

router.get('/view-games', authMiddleware, adminOnly, function(req, res, next) {
  let games = videojuegoDAO.showGames();
  /* Para filas sin imagen, usar la de otro juego con el mismo título (para que el admin vea la imagen) */
  games = games.map(function(g) {
    if (!g.imagen && g.titulo) {
      const ref = videojuegoDAO.findOneWithImageByTitle(g.titulo);
      if (ref && ref.imagen) {
        return Object.assign({}, g, { imagen: ref.imagen });
      }
    }
    return g;
  });
  const flash = req.session.flash || null;
  if (req.session.flash) delete req.session.flash;
  res.render('view-games', { games, flash });
});

/* ========== REGISTER ========== */

router.get('/register', function(req, res, next) {
  res.render('register');
});

router.post('/register', function(req, res, next) {
  const email = (req.body.email || '').trim();
  const password = req.body.password;
  const passwordRepeat = req.body.passwordRepeat;
  if (!email || password !== passwordRepeat) {
    return res.redirect('/register');
  }
  if (usuarioDAO.findUserByEmail(email)) {
    return res.redirect('/register');
  }
  try {
    usuarioDAO.saveUsuario(email, password);
    return res.redirect('/login');
  } catch (e) {
    return res.redirect('/register');
  }
});

module.exports = router;
