/*global QUnit*/

sap.ui.define([
	"workstation/workstation/controller/Workstation.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Workstation Controller");

	QUnit.test("I should test the Workstation controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
