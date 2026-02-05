class VideojuegoDAO {
    #database = null;

    constructor(database) {
        this.#database = database;
    }

    findVideojuegoByUserId(id) {
        const sql = `SELECT * FROM videojuegos WHERE id_usuario = ? ORDER BY titulo`;
        return this.#database.prepare(sql).all(id);
    }

    findVideojuegoById(id) {
        return this.#database.prepare('SELECT * FROM videojuegos WHERE id = ?').get(id);
    }

    /** Devuelve un juego con el mismo título que tenga imagen (para reutilizar imagen al copiar a colección) */
    findOneWithImageByTitle(titulo) {
        return this.#database.prepare('SELECT * FROM videojuegos WHERE titulo = ? AND (imagen IS NOT NULL AND imagen != \'\') LIMIT 1').get(titulo);
    }

    findVideojuegoByUserIdFiltered(idUsuario, filters = {}) {
        let sql = `SELECT * FROM videojuegos WHERE id_usuario = ?`;
        const params = [idUsuario];
        if (filters.plataforma) {
            params.push(filters.plataforma);
            sql += ` AND plataforma = ?`;
        }
        if (filters.genero) {
            params.push(filters.genero);
            sql += ` AND genero = ?`;
        }
        if (filters.estado !== undefined && filters.estado !== '' && filters.estado !== null) {
            params.push(Number(filters.estado));
            sql += ` AND completado = ?`;
        }
        sql += ` ORDER BY titulo`;
        return this.#database.prepare(sql).all(...params);
    }

    saveVideojuego(id_usuario, titulo, descripcion, genero, imagen, plataforma, completado = 0) {
        const sql = `INSERT INTO videojuegos (id_usuario, titulo, descripcion, genero, imagen, plataforma, completado) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        return this.#database.prepare(sql).run(id_usuario, titulo, descripcion, genero || null, imagen || null, plataforma || null, completado);
    }

    updateVideojuego(id, data) {
        const sql = `UPDATE videojuegos SET titulo = ?, descripcion = ?, genero = ?, plataforma = ?, completado = ? WHERE id = ?`;
        return this.#database.prepare(sql).run(
            data.titulo,
            data.descripcion ?? null,
            data.genero ?? null,
            data.plataforma ?? null,
            data.completado !== undefined ? Number(data.completado) : 0,
            id
        );
    }

    updateVideojuegoImagen(id, imagen) {
        const sql = `UPDATE videojuegos SET imagen = ? WHERE id = ?`;
        return this.#database.prepare(sql).run(imagen, id);
    }

    updateEstado(id, completado) {
        const sql = `UPDATE videojuegos SET completado = ? WHERE id = ?`;
        return this.#database.prepare(sql).run(Number(completado), id);
    }

    showGames() {
        return this.#database.prepare('SELECT * FROM videojuegos ORDER BY titulo').all();
    }

    deleteVideojuego(id) {
        const sql = `DELETE FROM videojuegos WHERE id = ?`;
        return this.#database.prepare(sql).run(id);
    }

    deleteVideojuegosByUserId(idUsuario) {
        const sql = `DELETE FROM videojuegos WHERE id_usuario = ?`;
        return this.#database.prepare(sql).run(idUsuario);
    }
}

module.exports = VideojuegoDAO;
