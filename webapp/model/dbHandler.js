sap.ui.define([], function () {
  "use strict";

  const dbHandler = {
    _dbConnections: [],
    _initializeDbConfig: function (config) {
      this._dbConfig = {
        name: config.name || "miBase",
        version: config.version || 1,
        store: config.store || "miStore",
        keyPath: config.keyPath || "id",
        indices: config.indices || [],
        staticData: config.staticData || [],
      };
    },
    _fetchAndStoreOData: function (callback) {
      var ctx = this;
      var openRequest = indexedDB.open(
        ctx._dbConfig.name,
        ctx._dbConfig.version
      );

      openRequest.onupgradeneeded = function (event) {
        var db = event.target.result;
        var objectStore = db.createObjectStore(ctx._dbConfig.store, {
          keyPath: ctx._dbConfig.keyPath,
        });
        ctx._dbConfig.indices.forEach((index) =>
          objectStore.createIndex(index, index, { unique: false })
        );
        // Solo inserta datos estáticos si existen y es la primera vez
        if (ctx._dbConfig.staticData && ctx._dbConfig.staticData.length > 0) {
          ctx._dbConfig.staticData.forEach((item) => objectStore.add(item));
        }
      };

      openRequest.onsuccess = function (event) {
        ctx.db = event.target.result;
        if (callback) callback();
      };

      openRequest.onerror = function (event) {
        console.error(
          "Error al abrir la base de datos:",
          event.target.errorCode
        );
      };
    },
    readAllData: function (callback) {
      var transaction = this.db.transaction([this._dbConfig.store], "readonly");
      var objectStore = transaction.objectStore(this._dbConfig.store);
      var request = objectStore.getAll();
      request.onsuccess = function (event) {
        callback(event.target.result); // Devolvemos todos los datos
      };
    },
    clearAllData: function (callback) {
      var transaction = this.db.transaction(
        [this._dbConfig.store],
        "readwrite"
      );
      var objectStore = transaction.objectStore(this._dbConfig.store);
      var request = objectStore.clear();
      request.onsuccess = function () {
        if (callback) callback();
      };
      request.onerror = function (event) {
        console.error("Error al borrar los registros:", event.target.errorCode);
      };
    },
  };
  return dbHandler;
});
