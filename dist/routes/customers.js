"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customersController_1 = require("../controllers/customersController");
const validateRequest_1 = require("../middleware/validateRequest");
const customerValidator_1 = require("../validators/customerValidator");
const router = (0, express_1.Router)();
router.post('/register', (0, validateRequest_1.validateRequest)(customerValidator_1.registerCustomerValidator), customersController_1.customersController.register);
exports.default = router;
