// Definición de la clase UsuarioDAO para manejar operaciones relacionadas con la tabla 'usuarios'

class UsuarioDAO {
    #database = null; // Variable estática para almacenar la instancia de la base de datos
    
    // El constructor recibe la instancia de la base de datos y la almacena en la clase
    constructor(database) {
        this.#database = database;
    }

    // Método para buscar un usuario por su email
    findUserByEmail(email){
        // Prepara y ejecuta una consulta SQL para buscar el usuario por email
        return this.#database.prepare("select * from usuarios where email = ?").get(email);
    }

}

// Exporta la clase UsuarioDAO para que pueda ser utilizada en otros módulos
module.exports = UsuarioDAO;