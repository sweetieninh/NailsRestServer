"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dbController_1 = require("../controllers/dbController");
const router = (0, express_1.Router)();
router.get('/getNailsDB', dbController_1.dbController.getNailsDBCollections);
router.get('/getNailsDB/summary', dbController_1.dbController.getNailsDBCollectionSummary);
exports.default = router;
