// Definición de la clase TareaDAO para manejar operaciones relacionadas con la tabla 'tareas'

class VideojuegoDAO {
    #database = null; // Variable estática para almacenar la instancia de la base de datos
    
    // El constructor recibe la instancia de la base de datos y la almacena en la clase
    constructor(database) {
        this.#database = database;
    }

    // Método para buscar un usuario por su email
    findVideojuegoByUserId(id){
        // Prepara y ejecuta una consulta SQL para buscar el usuario por email
        const sql= `SELECT * FROM videojuegos WHERE id_usuario=?`;
        return this.#database.prepare(sql).all(id);
    }

    // Método para guardar una nueva tarea
    // Recibe como parámetros la info de la nueva tarea: id_usuario, titulo, descripcion, completada
    saveVideojuego(id_usuario, titulo, descripcion, completado = 0, fecha_inicio) {
        fecha_creacion = new Date()
        const sql = `INSERT INTO videojuegos (id_usuario, titulo, descripcion, completado) VALUES (?, ?, ?, ?)`;
        return this.#database.prepare(sql).run(id_usuario, titulo, descripcion, completada);
    }

    // Método para eliminar una tarea por su id
    deleteVideojuego(id) {
        const sql = `DELETE FROM videojuegos WHERE id = ?`;
        return this.#database.prepare(sql).run(id);
    }

    // Método para marcar una tarea como completada (columna completada a 1)
    finishVideojuego(id) {
        const sql = `UPDATE videojuego SET completado = 1 WHERE id = ?`;
        return this.#database.prepare(sql).run(id);
    }
    
}

// Exporta la clase UsuarioDAO para que pueda ser utilizada en otros módulos
module.exports = VideojuegoDAO;