const LegalDocument = require('../models/legalDocument');
const multer = require('multer');
const path = require('path');



// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/legal-documents/');
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  
  const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['.pdf', '.doc', '.docx'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  });


  // Get all legal documents
exports.getAllLegalDocuments = async (req, res) => {
    try {
      const documents = await LegalDocument.find({ isActive: 'active' })
        .populate('order', 'orderNumber orderStatus')
        .populate('property', 'property_name property_location')
        .populate('assignedTo', 'name email');
      
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Get single legal document
  exports.getLegalDocument = async (req, res) => {
    try {
      const document = await LegalDocument.findById(req.params.id)
        .populate('order', ' orderStatus')
        .populate('property', 'property_name property_location')
        .populate('assignedTo', 'name email')
        .populate('remarks.commentedBy', 'name email');
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Upload document file
  exports.uploadDocument = async (req, res) => {
    upload.single('file')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
  
      try {
        const document = await LegalDocument.findById(req.params.id);
        if (!document) {
          return res.status(404).json({ message: 'Document not found' });
        }
  
        const fileData = {
          title: req.body.title,
          fileUrl: `/uploads/legal-documents/${req.file.filename}`,
          uploadDate: new Date().toISOString()
        };
  
        document.documentFiles.push(fileData);
        await document.save();
  
        res.json(document);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });
  };
  
  // Add remark
  exports.addRemark = async (req, res) => {
    try {
      const document = await LegalDocument.findById(req.params.id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
  
      const remark = {
        comment: req.body.comment,
        commentedBy: req.user._id, // Assuming you have user in request from auth middleware
        commentDate: new Date().toISOString()
      };
  
      document.remarks.push(remark);
      await document.save();
  
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }

}

// Update document status
exports.updateDocumentStatus = async (req, res) => {
    try {
      const { documentStatus } = req.body;
      const document = await LegalDocument.findById(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
  
      document.documentStatus = documentStatus;
      if (documentStatus === 'completed') {
        document.completionDate = new Date().toISOString();
      }
      
      await document.save();
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Assign legal document to user
  exports.assignDocument = async (req, res) => {
    try {
      const { assignedTo } = req.body;
      const document = await LegalDocument.findById(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
  
      document.assignedTo = assignedTo;
      await document.save();
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Delete document (soft delete)
  exports.deleteDocument = async (req, res) => {
    try {
      const document = await LegalDocument.findById(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
  
      document.isActive = 'deleted';
      await document.save();
      
      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Create new legal document
  exports.createLegalDocument = async (req, res) => {
    try {
      const { order, property } = req.body;
      
      const newDocument = new LegalDocument({
        order,
        property,
        documentStatus: 'pending',
        assignedTo: req.body.assignedTo
      });
  
      await newDocument.save();
      res.status(201).json(newDocument);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Delete document file
  exports.deleteDocumentFile = async (req, res) => {
    try {
      const { fileId } = req.params;
      const document = await LegalDocument.findById(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
  
      document.documentFiles = document.documentFiles.filter(
        file => file._id.toString() !== fileId
      );
      
      await document.save();
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  