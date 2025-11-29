"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const influencer_controller_1 = require("../controllers/influencer.controller");
const router = (0, express_1.Router)();
router.get('/search', influencer_controller_1.searchInfluencers);
router.get('/categories', influencer_controller_1.getCategories);
router.get('/prefectures', influencer_controller_1.getPrefectures);
router.get('/:id', influencer_controller_1.getInfluencerById);
router.get('/:id/stats', influencer_controller_1.getInfluencerStats);
exports.default = router;
//# sourceMappingURL=influencer.routes.js.map