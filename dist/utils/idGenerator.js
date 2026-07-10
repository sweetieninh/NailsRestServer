"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReadableId = void 0;
const crypto_1 = require("crypto");
const generateReadableId = (prefix) => {
    // Avoid collisions across restarts/processes by using UUID entropy.
    const value = (0, crypto_1.randomUUID)().replace(/-/g, '').slice(0, 12);
    return `${prefix}${value}`;
};
exports.generateReadableId = generateReadableId;
