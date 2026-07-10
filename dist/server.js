"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = require("./db");
const config_1 = require("./config");
const startServer = async () => {
    await (0, db_1.connectDB)();
    app_1.default.listen(config_1.config.port, config_1.config.host, () => {
        console.log(`NailsRestServer listening on http://${config_1.config.host}:${config_1.config.port}`);
    });
};
void startServer().catch((error) => {
    console.error('Server failed to start:', error);
    process.exit(1);
});
