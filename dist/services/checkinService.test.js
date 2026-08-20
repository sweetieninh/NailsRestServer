"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const checkinService_1 = require("./checkinService");
(0, node_test_1.default)('matchesCustomerLookup supports legacy primaryStoreId and formatted phone', () => {
    const customer = {
        businessId: 'biz001',
        primaryStoreId: 'store001',
        phone: '7145552001',
    };
    const result = (0, checkinService_1.matchesCustomerLookup)(customer, {
        businessId: 'biz001',
        storeId: 'store001',
        phone: '(714) 555-2001',
    });
    strict_1.default.equal(result, true);
});
