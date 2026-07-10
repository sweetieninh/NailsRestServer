"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthController = void 0;
const healthController = (_req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'NailsRestServer',
        port: 4010,
        timestamp: new Date().toISOString(),
    });
};
exports.healthController = healthController;
