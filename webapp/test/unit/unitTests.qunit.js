/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"workstation/workstation/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
