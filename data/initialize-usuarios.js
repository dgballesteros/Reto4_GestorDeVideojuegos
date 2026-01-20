module.exports = (db) => {
    const sql = `
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL
        )
    `;
    db.prepare(sql).run();

    // Si no hay usuarios, creo el usuario administrador
    const count = db.prepare('SELECT count(*) as total FROM usuarios').get();
    if(count.total === 0){
        db.prepare('INSERT INTO usuarios (email, password) VALUES (?, ?)').run('admin', 'admin');
    }


}