"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const contract_controller_1 = require("../controllers/contract.controller");
const router = (0, express_1.Router)();
// Chapter 5: Contract routes
router.post('/', auth_1.authenticate, contract_controller_1.createContract);
router.get('/project/:projectId', auth_1.authenticate, contract_controller_1.getContract);
router.post('/:contractId/sign', auth_1.authenticate, contract_controller_1.signContract);
router.post('/:contractId/reject', auth_1.authenticate, contract_controller_1.rejectContract);
router.get('/my/list', auth_1.authenticate, contract_controller_1.getMyContracts);
exports.default = router;
//# sourceMappingURL=contract.routes.js.map