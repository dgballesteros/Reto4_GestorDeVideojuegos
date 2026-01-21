module.exports = (db) => {
    const sql = `
        CREATE TABLE IF NOT EXISTS videojuegos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_usuario INTEGER NOT NULL,
            titulo TEXT NOT NULL,
            imagen VARCHAR(200),
            descripcion TEXT,
            genero VARCHAR(50),
            completado INTEGER DEFAULT 0
        )
    `;
    db.prepare(sql).run();

    // Inserta una tarea de ejemplo si la tabla está vacía
    // const count = db.prepare('SELECT count(*) as total FROM videojuegos').get();
}