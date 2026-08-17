// routes/notes.js
const express = require('express');
const router = express.Router();
const { getNotes, createNote, updateNote, deleteNote, generateNote, generateFlashcards } = require('../controllers/notesController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getNotes)
  .post(createNote);

router.route('/:id')
  .put(updateNote)
  .delete(deleteNote);

router.post('/generate', generateNote);
router.post('/flashcards', generateFlashcards);

module.exports = router;



