"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthController = void 0;
const config_1 = require("../config");
const healthController = (_req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'NailsRestServer',
        port: config_1.config.port,
        timestamp: new Date().toISOString(),
    });
};
exports.healthController = healthController;
