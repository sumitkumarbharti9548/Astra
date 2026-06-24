// routes/studymaterial.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/studyMaterialController');
const { protect, adminOnly } = require('../middleware/auth');
const upload  = require('../middleware/upload');

router.get('/',            ctrl.list);                                    // public — list materials
router.post('/upload',     protect, upload.single('file'), ctrl.upload);  // admin/faculty — upload
router.get('/:id/download',                                ctrl.download); // public — download file
router.delete('/:id',      protect,                        ctrl.remove);  // admin — delete

module.exports = router;
