"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const app_1 = __importDefault(require("./app"));
const db_1 = require("./db");
const config_1 = require("./config");
const getLanAddress = () => {
    const nets = os_1.default.networkInterfaces();
    for (const ifaceList of Object.values(nets)) {
        for (const iface of ifaceList ?? []) {
            if (iface.family === 'IPv4' && !iface.internal)
                return iface.address;
        }
    }
    return 'localhost';
};
const startServer = async () => {
    await (0, db_1.connectDB)();
    app_1.default.listen(config_1.config.port, config_1.config.host, () => {
        // config.host may be 0.0.0.0 (all interfaces), so log an address that's actually reachable
        const displayHost = config_1.config.host === '0.0.0.0' ? getLanAddress() : config_1.config.host;
        console.log(`NailsRestServer listening on http://${displayHost}:${config_1.config.port}`);
    });
};
void startServer().catch((error) => {
    console.error('Server failed to start:', error);
    process.exit(1);
});
