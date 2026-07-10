"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_1 = __importDefault(require("./health"));
const checkin_1 = __importDefault(require("./checkin"));
const customers_1 = __importDefault(require("./customers"));
const database_1 = __importDefault(require("./database"));
const router = (0, express_1.Router)();
router.use('/health', health_1.default);
router.use('/checkin', checkin_1.default);
router.use('/customers', customers_1.default);
router.use('/', database_1.default);
exports.default = router;
