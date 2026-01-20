module.exports = (db) => {
    const sql = `
        CREATE TABLE IF NOT EXISTS videojuegos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_usuario INTEGER NOT NULL,
            titulo TEXT NOT NULL,
            descripcion TEXT,
            completado INTEGER DEFAULT 0,
            fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
    db.prepare(sql).run();

    // Inserta una tarea de ejemplo si la tabla está vacía
    const count = db.prepare('SELECT count(*) as total FROM videojuegos').get();
    if(count.total === 0){
        db.prepare('INSERT INTO videojuegos (id_usuario, titulo, descripcion, completado) VALUES (?, ?, ?, ?)')
        .run(1, 'Counter Strike 2', 'El mejor FPS de la historia', 0);
    }
}