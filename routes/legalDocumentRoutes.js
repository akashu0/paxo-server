// routes/legalDocumentRoutes.js
const express = require('express');
const router = express.Router();
const { adminVerify } = require('../middlewares/admin');
const legalDocumentController = require('../controllers/legalDocumentController');

// Get all legal documents
router.get('/get-all-legal', adminVerify, legalDocumentController.getAllLegalDocuments);

// Get single legal document
router.get('/get-one-legal/:id', adminVerify, legalDocumentController.getLegalDocument);

// Create new legal document
router.post('/', adminVerify, legalDocumentController.createLegalDocument);

// Upload document file
router.post('/upload-legal-document/:id', adminVerify, legalDocumentController.uploadDocument);

// Add remark to document
router.post('/legal-remark/:id', adminVerify, legalDocumentController.addRemark);

// Update document status
router.patch('/update-status/:id', adminVerify, legalDocumentController.updateDocumentStatus);

// Assign document to user
router.patch('/:id/assign', adminVerify, legalDocumentController.assignDocument);

// Delete document file
router.delete('/:id/files/:fileId', adminVerify, legalDocumentController.deleteDocumentFile);

// Delete document (soft delete)
router.delete('/:id', adminVerify, legalDocumentController.deleteDocument);

module.exports = router;