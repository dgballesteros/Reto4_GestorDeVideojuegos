// Middleware para gestinar las páginas protegidas.
// Esta función se ejecuta en cada solicitud HTTP recibida por el servidor.
// req: el objeto de la solicitud (request).
// res: el objeto de la respuesta (response).
// next: función para pasar el control al siguiente middleware.
module.exports = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    return res.redirect('/login');
  }
};
