// models/StudyMaterial.js
const mongoose = require('mongoose');

const StudyMaterialSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  course:       { type: String, required: true },   // btech, bca, mba…
  semester:     { type: Number, required: true },
  subject:      { type: String, required: true },
  type:         { type: String, required: true,
                  enum: ['pdf','handwritten','video','pyq','assignment','lab','syllabus','important','link','image'] },
  // Local file (uploaded to server)
  fileUrl:      { type: String, default: '' },   // e.g. /uploads/1234-notes.pdf
  fileName:     { type: String, default: '' },   // original filename
  fileSize:     { type: Number, default: 0 },    // bytes
  // External (YouTube / website)
  externalUrl:  { type: String, default: '' },
  tags:         [String],
  uploadedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploaderName: { type: String, default: '' },
  downloads:    { type: Number, default: 0 },
  views:        { type: Number, default: 0 },
  createdAt:    { type: Date,   default: Date.now }
});

StudyMaterialSchema.index({ course:1, semester:1, subject:1 });

module.exports = mongoose.model('StudyMaterial', StudyMaterialSchema);
