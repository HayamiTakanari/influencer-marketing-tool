"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const scout_controller_1 = require("../controllers/scout.controller");
const router = (0, express_1.Router)();
// Chapter 3: Scout routes
router.post('/', auth_1.authenticate, scout_controller_1.sendScoutInvitation);
router.post('/:scoutId/accept', auth_1.authenticate, scout_controller_1.acceptScout);
router.post('/:scoutId/reject', auth_1.authenticate, scout_controller_1.rejectScout);
router.get('/my/invitations', auth_1.authenticate, scout_controller_1.getMyScoutInvitations);
router.get('/my/sent', auth_1.authenticate, scout_controller_1.getMySentScouts);
router.get('/:scoutId', auth_1.authenticate, scout_controller_1.getScoutDetails);
exports.default = router;
//# sourceMappingURL=scout.routes.js.map