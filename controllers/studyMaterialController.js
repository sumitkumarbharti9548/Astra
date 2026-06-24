// controllers/studyMaterialController.js
const StudyMaterial = require('../models/StudyMaterial');
const path = require('path');
const fs   = require('fs');

/* POST /api/study/upload ─────────────────────────────── */
exports.upload = async (req, res, next) => {
  try {
    const { title, description, course, semester, subject, type, externalUrl, tags } = req.body;

    if (!title || !course || !semester || !subject || !type)
      return res.status(400).json({ success: false, message: 'title, course, semester, subject and type are required' });

    const data = {
      title, description, course,
      semester:     parseInt(semester),
      subject,      type,
      tags:         tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      uploadedBy:   req.user._id,
      uploaderName: req.user.name,
    };

    if (req.file) {
      data.fileUrl  = '/uploads/' + req.file.filename;
      data.fileName = req.file.originalname;
      data.fileSize = req.file.size;
    }
    if (externalUrl) data.externalUrl = externalUrl;

    if (!data.fileUrl && !data.externalUrl)
      return res.status(400).json({ success: false, message: 'Please upload a file or provide a URL' });

    const material = await StudyMaterial.create(data);
    res.status(201).json({ success: true, material });
  } catch (e) { next(e); }
};

/* GET /api/study?course=btech&semester=3&subject=DBMS ── */
exports.list = async (req, res, next) => {
  try {
    const { course, semester, subject } = req.query;
    const q = {};
    if (course)   q.course   = course;
    if (semester) q.semester = parseInt(semester);
    if (subject)  q.subject  = subject;

    const materials = await StudyMaterial.find(q)
      .sort('-createdAt')
      .populate('uploadedBy', 'name');
    res.json({ success: true, materials });
  } catch (e) { next(e); }
};

/* GET /api/study/:id/download ───────────────────────── */
exports.download = async (req, res, next) => {
  try {
    const m = await StudyMaterial.findById(req.params.id);
    if (!m) return res.status(404).json({ success: false, message: 'Not found' });
    if (!m.fileUrl) return res.status(400).json({ success: false, message: 'No file attached' });

    const filePath = path.join(__dirname, '../public', m.fileUrl);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ success: false, message: 'File missing on server' });

    await StudyMaterial.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });
    res.download(filePath, m.fileName || path.basename(m.fileUrl));
  } catch (e) { next(e); }
};

/* DELETE /api/study/:id ─────────────────────────────── */
exports.remove = async (req, res, next) => {
  try {
    const m = await StudyMaterial.findById(req.params.id);
    if (!m) return res.status(404).json({ success: false, message: 'Not found' });
    if (req.user.role !== 'admin' && String(m.uploadedBy) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Not authorized' });

    if (m.fileUrl) {
      const fp = path.join(__dirname, '../public', m.fileUrl);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    await m.deleteOne();
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { next(e); }
};
