sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, ODataModel, Fragment, Filter) {
    "use strict";

    return Controller.extend("workstation.workstation.controller.Workstation", {
      // ─────────────────────────────────────────────
      // ▶ Carga de la estación de trabajo
      // ─────────────────────────────────────────────

      onInit: function () {
        // Verifica si hay un identificador de estación de trabajo en localStorage
        var sWorkstationId = localStorage.getItem("WORKSTATIONID");
        if (sWorkstationId) {
          sap.ui.require(["sap/m/MessageToast"], function (MessageToast) {
            MessageToast.show(
              "Estación de trabajo cargada correctamente: " + sWorkstationId
            );
          });
        } else {
          // Si no hay un identificador, abre el popup para asignar una estación de trabajo
          this.onIngresarDeposito();
        }
      },

      // ─────────────────────────────────────────────
      // ▶ Limpiar el almacenamiento local (Solo para pruebas)
      // ─────────────────────────────────────────────

      onBorrarLocalStorage: function () {
        // Elimina el identificador de estación de trabajo del localStorage
        localStorage.removeItem("WORKSTATIONID");
        sap.ui.require(["sap/m/MessageToast"], function (MessageToast) {
          MessageToast.show(
            "El identificador de estación de trabajo ha sido borrado"
          );
        });
      },

      // ─────────────────────────────────────────────
      // ▶ Abrir popup para ingresar depósito
      // ─────────────────────────────────────────────

      onIngresarDeposito: function () {
        var oView = this.getView();
        // Verifica si el diálogo ya está creado
        if (!this.byId("workstationDialog")) {
          // Crea el diálogo de forma asíncrona
          Fragment.load({
            id: oView.getId(),
            name: "workstation.workstation.view.WorkstationCreate",
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            oDialog.open();
          });
        } else {
          // Si el diálogo ya existe, simplemente lo abre
          this.byId("workstationDialog").open();
        }
      },

      // ─────────────────────────────────────────────
      // ▶ Confirmar el depósito ingresado
      // ─────────────────────────────────────────────

      onContinuarDeposito: function () {
        // Obtiene el valor del input de depósito
        var oInputDeposito = this.byId("inputDeposito");
        var sDeposito = oInputDeposito.getValue();
        // Valida que el campo no esté vacío
        if (!sDeposito) {
          sap.m.MessageToast.show("Por favor ingrese el nombre del depósito");
          oInputDeposito.setValueState("Error");
          return;
        } else {
          oInputDeposito.setValueState("None");
        }
        // Realiza la consulta al backend para obtener las estaciones de trabajo disponibles
        var oModel = new sap.ui.model.odata.v2.ODataModel(
          "/sap/opu/odata/SAP/ZWORKSTATION_SRV/"
        );
        var aFilters = [new sap.ui.model.Filter("DepositoId", "EQ", sDeposito)];
        var that = this;
        oModel.read("/zworkstationSet", {
          filters: aFilters,
          success: function (oData) {
            if (oData.results && oData.results.length > 0) {
              // Si hay resultados, actualiza los registros en el backend
              that.updateWorkstations(oModel, oData.results);
              that.byId("workstationDialog").close();
            } else {
              // Si no hay resultados, muestra un mensaje de advertencia
              sap.m.MessageBox.warning(
                "No hay estaciones de trabajo disponibles para el depósito: " +
                  sDeposito
              );
            }
          },
          error: function () {
            sap.m.MessageBox.error("Error al consultar el backend");
          },
        });
      },

      // ─────────────────────────────────────────────
      // ▶ Actualizar estaciones de trabajo en el backend
      // ─────────────────────────────────────────────

      updateWorkstations: function (oModel, aResults) {
        var that = this;
        aResults.forEach(function (item) {
          const oEntry = {
            WorkstationId: item.WorkstationId,
            DepositoId: item.DepositoId,
            Ocupado: item.Ocupado,
            FechaAsignacion: item.FechaAsignacion,
            HoraAsignacion: item.HoraAsignacion,
          };
          // Actualiza las estaciónes de trabajo correspondientes en el backend
          const sPath = "/zworkstationSet('" + oEntry.WorkstationId + "')";
          oModel.update(sPath, oEntry, {
            success: function () {
              sap.m.MessageToast.show(
                "Se le ha asignado la estación de trabajo: " +
                  oEntry.WorkstationId
              );
              // Guarda el identificador de la estación de trabajo en localStorage
              localStorage.setItem("WORKSTATIONID", oEntry.WorkstationId);
              if (that._refreshList) {
                that._refreshList();
              }
            },
            error: function () {
              sap.m.MessageBox.error(
                "No se pudo asignar una estación de trabajo"
              );
            },
          });
        });
      },
    });
  }
);
