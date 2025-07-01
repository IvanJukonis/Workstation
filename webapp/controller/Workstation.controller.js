sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/core/Fragment",
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, ODataModel, Fragment) {
    "use strict";

    return Controller.extend("workstation.workstation.controller.Workstation", {
      // ─────────────────────────────────────────────
      // ▶ ON INIT
      // ─────────────────────────────────────────────
      onInit: function () {
        // ────────────────────────────────────
        // ▶ CARGA DE BD / READ ODATA
        // ────────────────────────────────────
        const dbHandler = this.getOwnerComponent().dbHandler;
        const that = this;
        let bTransactionDone = false;
        let bReadDone = false;
        let oDataResults = null;
        let oModel = null;
        dbHandler._fetchAndStoreOData(() => {
          dbHandler.readAllData(function (data) {
            if (data && data.length > 0) {
              sap.ui.require(["sap/m/MessageToast"], function (MessageToast) {
                MessageToast.show("Estación de trabajo cargada correctamente");
              });
              that._refreshList();
            } else {
              oModel = new sap.ui.model.odata.v2.ODataModel(
                "/sap/opu/odata/SAP/ZWORKSTATION_SRV/"
              );
              oModel.read("/zworkstationSet", {
                success: function (oData) {
                  if (oData.results && oData.results.length > 0) {
                    oDataResults = oData.results;
                    var db = dbHandler.db;
                    var storeName = dbHandler._dbConfig.store;
                    var transaction = db.transaction([storeName], "readwrite");
                    var objectStore = transaction.objectStore(storeName);

                    oData.results.forEach(function (item) {
                      objectStore.put({
                        WORKSTATIONID: item.WorkstationId,
                        DEPOSITO_ID: item.DepositoId,
                        OCUPADA: item.Ocupado ? "" : "X",
                        FECHA_ASIGNACION: item.FechaAsignacion,
                        HORA_ASIGNACION: item.HoraAsignacion,
                      });
                    });
                    transaction.oncomplete = function () {
                      sap.ui.require(
                        ["sap/m/MessageToast"],
                        function (MessageToast) {
                          MessageToast.show("Registros importados desde OData");
                        }
                      );
                      that._refreshList();
                      bTransactionDone = true;
                      if (bTransactionDone && oDataResults) {
                        that._updateBackendRecords(oModel, oDataResults);
                        var oInfoModel = new sap.ui.model.json.JSONModel({
                          WorkstationId: oEntry.WorkstationId,
                          DepositoId: oEntry.DepositoId,
                          Fecha: oEntry.FechaAsignacion,
                          Hora: oEntry.HoraAsignacion,
                        });
                        this.getView().setModel(oInfoModel, "info");
                      }
                    };
                    transaction.onerror = function () {
                      sap.ui.require(
                        ["sap/m/MessageToast"],
                        function (MessageToast) {
                          MessageToast.show("Error al importar los registros");
                        }
                      );
                    };
                  } else {
                    sap.ui.require(
                      ["sap/m/MessageToast"],
                      function (MessageToast) {
                        MessageToast.show(
                          "No se encontraron registros en el backend"
                        );
                      }
                    );
                  }
                },
                error: function (oError) {
                  console.error(
                    "Error al leer datos del servicio OData:",
                    oError
                  );
                  sap.ui.require(
                    ["sap/m/MessageToast"],
                    function (MessageToast) {
                      MessageToast.show("Error al consultar el backend");
                    }
                  );
                },
              });
            }
          });
        });
      },
      // ─────────────────────────────────────────────
      // ▶ UPDATE WORKSTATION ODATA
      // ─────────────────────────────────────────────
      // Establecer la estacion de trabajo como ocupada
      // ─────────────────────────────────────────────
      _updateBackendRecords: function (oModel, aResults) {
        aResults.forEach(function (item) {
          const oEntry = {
            WorkstationId: item.WorkstationId,
            DepositoId: item.DepositoId,
            Ocupado: item.Ocupado,
            FechaAsignacion: item.FechaAsignacion,
            HoraAsignacion: item.HoraAsignacion,
          };

          const sPath = "/zworkstationSet('" + oEntry.WorkstationId + "')";

          oModel.update(sPath, oEntry, {
            success: function () {
              sap.m.MessageToast.show(
                "Asignación de nueva estación de trabajo: " +
                  oEntry.WorkstationId
              );
            },
            error: function (oError) {
              sap.m.MessageBox.error(
                "No se pudo asignar una estación de trabajo"
              );
            },
          });
        });
      },

      _openPopNewWorkstation: function (oData) {
        var oView = this.getView();

        // Seteás el modelo acá
        var oInfoModel = new sap.ui.model.json.JSONModel({
          WorkstationId: oData.WorkstationId,
          DepositoId: oData.DepositoId,
          Fecha: oData.FechaAsignacion,
          Hora: oData.HoraAsignacion,
        });
        oView.setModel(oInfoModel, "info");

        if (!this._oPopNewWorkstation) {
          sap.ui.core.Fragment.load({
            name: "workstation.workstation.view.PopNewWorkstation",
            controller: this,
          }).then(
            function (oDialog) {
              oView.addDependent(oDialog);
              this._oPopNewWorkstation = oDialog;
              oDialog.open();
            }.bind(this)
          );
        } else {
          this._oPopNewWorkstation.open();
        }
      },

      // ─────────────────────────────────────────────
      // ▶ ON CREATE
      // ─────────────────────────────────────────────

      onCreate: function () {
        var oInputWORKSTATIONID = this.byId("inputWORKSTATIONID");
        var oInputDEPOSITO_ID = this.byId("inputDEPOSITO_ID");
        var oInputOCUPADA = this.byId("inputOCUPADA");
        var oInputFECHA_ASIGNACION = this.byId("inputFECHA_ASIGNACION");
        var oInputHORA_ASIGNACION = this.byId("inputHORA_ASIGNACION");

        var newItem = {
          WORKSTATIONID: oInputWORKSTATIONID.getValue(),
          DEPOSITO_ID: oInputDEPOSITO_ID.getValue(),
          OCUPADA: oInputOCUPADA.getValue(),
          FECHA_ASIGNACION: oInputFECHA_ASIGNACION.getValue(),
          HORA_ASIGNACION: oInputHORA_ASIGNACION.getValue(),
        };

        if (
          !newItem.WORKSTATIONID ||
          !newItem.DEPOSITO_ID ||
          !newItem.OCUPADA ||
          !newItem.FECHA_ASIGNACION ||
          !newItem.HORA_ASIGNACION
        ) {
          sap.m.MessageToast.show("Por favor ingrese todos los campos");
          return;
        }

        var dbHandler = this.getOwnerComponent().dbHandler;
        var transaction = dbHandler.db.transaction(
          [dbHandler._dbConfig.store],
          "readwrite"
        );
        var objectStore = transaction.objectStore(dbHandler._dbConfig.store);

        objectStore.put(newItem);

        transaction.oncomplete = function () {
          sap.m.MessageToast.show("Workstation creada correctamente");
          oInputWORKSTATIONID.setValue("");
          oInputDEPOSITO_ID.setValue("");
          oInputOCUPADA.setValue("");
          oInputFECHA_ASIGNACION.setValue("");
          oInputHORA_ASIGNACION.setValue("");
          this._refreshList();
        }.bind(this);

        transaction.onerror = function () {
          sap.m.MessageToast.show("Error al crear la workstation");
        };
      },

      // ─────────────────────────────────────────────
      // ▶ ON UPDATE
      // ─────────────────────────────────────────────

      onUpdate: function () {
        var oInputWORKSTATIONID = this.byId("inputWORKSTATIONID");
        var oInputDEPOSITO_ID = this.byId("inputDEPOSITO_ID");
        var oInputOCUPADA = this.byId("inputOCUPADA");
        var oInputFECHA_ASIGNACION = this.byId("inputFECHA_ASIGNACION");
        var oInputHORA_ASIGNACION = this.byId("inputHORA_ASIGNACION");

        var updatedItem = {
          WORKSTATIONID: oInputWORKSTATIONID.getValue(),
          DEPOSITO_ID: oInputDEPOSITO_ID.getValue(),
          OCUPADA: oInputOCUPADA.getValue(),
          FECHA_ASIGNACION: oInputFECHA_ASIGNACION.getValue(),
          HORA_ASIGNACION: oInputHORA_ASIGNACION.getValue(),
        };

        if (
          !updatedItem.WORKSTATIONID ||
          !updatedItem.DEPOSITO_ID ||
          !updatedItem.OCUPADA ||
          !updatedItem.FECHA_ASIGNACION ||
          !updatedItem.HORA_ASIGNACION
        ) {
          sap.m.MessageToast.show("Por favor ingrese todos los campos");
          return;
        }

        var dbHandler = this.getOwnerComponent().dbHandler;
        var transaction = dbHandler.db.transaction(
          [dbHandler._dbConfig.store],
          "readwrite"
        );
        var objectStore = transaction.objectStore(dbHandler._dbConfig.store);

        var request = objectStore.get(updatedItem.WORKSTATIONID);

        request.onsuccess = function (event) {
          var data = event.target.result;
          if (data) {
            data.DEPOSITO_ID = updatedItem.DEPOSITO_ID;
            data.OCUPADA = updatedItem.OCUPADA;
            data.FECHA_ASIGNACION = updatedItem.FECHA_ASIGNACION;
            data.HORA_ASIGNACION = updatedItem.HORA_ASIGNACION;
            objectStore.put(data);
          }
        };

        transaction.oncomplete = function () {
          sap.m.MessageToast.show("Workstation actualizada correctamente");
          this._refreshList();
        }.bind(this);

        transaction.onerror = function () {
          sap.m.MessageToast.show("Error al actualizar la workstation");
        };
      },

      // ─────────────────────────────────────────────
      // ▶ ON DELETE
      // ─────────────────────────────────────────────

      onDelete: function () {
        var oInputWORKSTATIONID = this.byId("inputWORKSTATIONID");

        var dbHandler = this.getOwnerComponent().dbHandler;
        var transaction = dbHandler.db.transaction(
          [dbHandler._dbConfig.store],
          "readwrite"
        );
        var objectStore = transaction.objectStore(dbHandler._dbConfig.store);

        var request = objectStore.delete(oInputWORKSTATIONID.getValue());

        request.onsuccess = function () {
          sap.m.MessageToast.show("Workstation eliminada correctamente");
          this._refreshList();
        }.bind(this);

        request.onerror = function () {
          sap.m.MessageToast.show("Error al eliminar la workstation");
        };
      },

      // ─────────────────────────────────────────────
      // ▶ REFRESH LIST
      // ─────────────────────────────────────────────

      _refreshList: function () {
        var oList = this.byId("list");
        //   oList.removeAllItems();

        var dbHandler = this.getOwnerComponent().dbHandler;
        dbHandler.readAllData(function (data) {
          data.forEach(function (item) {
            /*             oList.addItem(
              new sap.m.StandardListItem({
                title: item.WORKSTATIONID + " - " + item.DEPOSITO_ID,
                description:
                  "Ocupada: " +
                  item.OCUPADA +
                  " | Fecha: " +
                  item.FECHA_ASIGNACION +
                  " | Hora: " +
                  item.HORA_ASIGNACION,
              })
            ); */
          });
        });
      },

      // ─────────────────────────────────────────────
      // ▶ ON PRESS
      // ─────────────────────────────────────────────

      onPress: function () {
        var oModel = new ODataModel("/sap/opu/odata/SAP/ZWORKSTATION_SRV/");
        var aFilters = [];
        var that = this;
        oModel.read("/zworkstationSet", {
          filters: aFilters,
          success: function (oData) {
            if (oData.results && oData.results.length > 0) {
              var dbHandler = that.getOwnerComponent().dbHandler;
              var db = dbHandler.db;
              var storeName = dbHandler._dbConfig.store;
              var transaction = db.transaction([storeName], "readwrite");
              var objectStore = transaction.objectStore(storeName);

              oData.results.forEach(function (item) {
                objectStore.put({
                  WORKSTATIONID: item.WorkstationId,
                  DEPOSITO_ID: item.DepositoId,
                  OCUPADA: item.Ocupado ? "S" : "N",
                  FECHA_ASIGNACION: item.FechaAsignacion,
                  HORA_ASIGNACION: item.HoraAsignacion,
                });
              });

              transaction.oncomplete = function () {
                sap.ui.require(["sap/m/MessageToast"], function (MessageToast) {
                  MessageToast.show("Registros importados a la base local");
                });
                if (that._refreshList) {
                  that._refreshList();
                }
              };
              transaction.onerror = function () {
                sap.ui.require(["sap/m/MessageToast"], function (MessageToast) {
                  MessageToast.show("Error al importar los registros");
                });
              };
            } else {
              sap.ui.require(["sap/m/MessageToast"], function (MessageToast) {
                MessageToast.show("No se encontraron registros en el backend");
              });
            }
          },
          error: function (oError) {
            console.error("Error al leer datos del servicio OData:", oError);
            sap.ui.require(["sap/m/MessageToast"], function (MessageToast) {
              MessageToast.show("Error al consultar el backend");
            });
          },
        });
      },

      // ─────────────────────────────────────────────
      // ▶ POPUP WORKSTATION
      // ─────────────────────────────────────────────

      onOpenPopupWorkstation: function () {
        var oView = this.getView();
        if (!this.byId("workstationDialog")) {
          Fragment.load({
            id: oView.getId(),
            name: "workstation.workstation.view.WorkstationCreate",
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            oDialog.open();
          });
        } else {
          this.byId("workstationDialog").open();
        }
      },

      // ─────────────────────────────────────────────
      // ▶ CLOSE POPUP
      // ─────────────────────────────────────────────

      onCloseDialog: function () {
        this.byId("workstationDialog").close();
      },

      // ─────────────────────────────────────────────
      // ▶ CLEAR DATABASE
      // ─────────────────────────────────────────────

      onClearDatabase: function () {
        var dbHandler = this.getOwnerComponent().dbHandler;
        dbHandler.clearAllData(function () {
          sap.ui.require(["sap/m/MessageToast"], function (MessageToast) {
            MessageToast.show("Todos los registros han sido borrados");
          });
        });
        // Opcional: refresca la lista si tienes una función para ello
        if (this._refreshList) {
          this._refreshList();
        }
      },

      // ─────────────────────────────────────────────
      // ▶ ADD RECORDS
      // ─────────────────────────────────────────────

      onAddTwoRecords: function () {
        var dbHandler = this.getOwnerComponent().dbHandler;
        var db = dbHandler.db;
        var storeName = dbHandler._dbConfig.store;

        var transaction = db.transaction([storeName], "readwrite");
        var objectStore = transaction.objectStore(storeName);

        var record = {
          WORKSTATIONID: "WS001",
          DEPOSITO_ID: "DEP01",
          OCUPADA: "N",
          FECHA_ASIGNACION: "20240621",
          HORA_ASIGNACION: "120000",
        };

        objectStore.put(record);

        transaction.oncomplete = function () {
          sap.ui.require(["sap/m/MessageToast"], function (MessageToast) {
            MessageToast.show("Registro agregado correctamente");
          });
          if (this._refreshList) {
            this._refreshList();
          }
        }.bind(this);

        transaction.onerror = function () {
          sap.ui.require(["sap/m/MessageToast"], function (MessageToast) {
            MessageToast.show("Error al agregar el registro");
          });
        };
      },
    });
  }
);
