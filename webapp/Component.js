/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "workstation/workstation/model/models",
    "workstation/workstation/model/dbHandler",
  ],
  function (UIComponent, Device, models, dbHandler) {
    "use strict";

    return UIComponent.extend("workstation.workstation.Component", {
      metadata: {
        manifest: "json",
      },

      /**
       * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
       * @public
       * @override
       */
      init: function () {
        // call the base component's init function
        UIComponent.prototype.init.apply(this, arguments);

        // enable routing
        this.getRouter().initialize();

        // set the device model
        this.setModel(models.createDeviceModel(), "device");

        // Configuración de la base interna según tu tabla ZPTL_WORKSTATIONS
        dbHandler._initializeDbConfig({
          name: "ZPTL_WORKSTATIONS",
          version: 1,
          store: "ZPTL_WORKSTATIONS",
          keyPath: "WORKSTATIONID",
          indices: [
            "DEPOSITO_ID",
            "OCUPADA",
            "FECHA_ASIGNACION",
            "HORA_ASIGNACION",
          ],
          staticData: [],
        });
        this.dbHandler = dbHandler;
      },
    });
  }
);
