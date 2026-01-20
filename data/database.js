/*
 * Clase Database
 * ---------------
 * Esta clase implementa un patrón singleton para gestionar la conexión a una base de datos SQLite
 * utilizando la librería better-sqlite3. No puede ser instanciada directamente, sino que provee
 * métodos estáticos para inicializar y acceder a la única instancia de conexión. Permite la ejecución
 * de consultas SQL y la preparación de sentencias SQL. Es útil para centralizar y reutilizar la conexión
 * en una aplicación Node.js, asegurando que solo exista una conexión abierta a la base de datos.
 */

class Database {
  static #db = null;

  constructor() {
    // No se permite instanciar con new. Hay que llamar a getInstance.
    throw new Error(
      "No se puede instanciar. Usa .getInstance() para inicializarla"
    );
  }

  static getInstance(dbPath) {
   
    // Aqui se realiza la inicialización de la conexión con la base de datos utilizando el patrón singleton.

    if (Database.#db == null) {

     // Se verifica que el archivo de base de datos (dbPath) esté definido.
     
     if (!dbPath) {
        throw new Error("dbPath es requerido para la primera inicialización");
      } else {

        // Si la instancia única (#db) aún no ha sido creada, se instancia utilizando BetterSqlite3,
        // y se inicializan las tablas necesarias (tareas y usuarios) llamando a sus respectivos scripts.

        const BetterSqlite3 = require("better-sqlite3");
        Database.#db = new BetterSqlite3(dbPath);

        // Inicializo la tabla de tareas si no existe
        require("./initialize-videojuegos")(Database.#db);

        //Inicializo la tabla de usuarios si no existe
        require("./initialize-usuarios")(Database.#db);
      }
    }
    return Database.#db;
  }

  // Este método estático permite preparar una sentencia SQL utilizando la conexión singleton de la base de datos.
  // Recibe una consulta SQL como parámetro y devuelve una sentencia preparada que puede ser ejecutada posteriormente.
  static prepare(sql) {
    return Database.#db.prepare(sql);
  }
}

module.exports = Database;
