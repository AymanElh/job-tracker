const express = require('express');
const applicationController = require('./application.controller');
const { protect } = require('../../middleware/auth');
const upload = require('../../middleware/upload');

const validate = require('../../middleware/validate');
const applicationValidation = require('./application.validation');

const router = express.Router();

const parseFormData = (req, res, next) => {
  if (req.body && typeof req.body.data === 'string') {
    try {
      const parsedData = JSON.parse(req.body.data);
      req.body = { ...req.body, ...parsedData };
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid JSON data in form' });
    }
  }
  next();
};

// All routes are protected
router.use(protect);

router.route('/')
  .get(applicationController.getAllApplications)
  .post(upload.single('resume'), parseFormData, validate(applicationValidation.createApplication), applicationController.createApplication);

router.get('/stats', applicationController.getStatsSummary);
router.get('/export/csv', applicationController.exportApplicationsCsv);
router.post('/batch', applicationController.importApplications);
router.get('/trash', applicationController.getTrashedApplications);

router.route('/:id')
  .get(applicationController.getApplicationById)
  .patch(upload.single('resume'), parseFormData, validate(applicationValidation.updateApplication), applicationController.updateApplication)
  .delete(applicationController.deleteApplication);

router.patch('/:id/restore', applicationController.restoreApplication);
router.delete('/:id/hard', applicationController.hardDeleteApplication);

router.post('/:id/follow-ups', applicationController.addFollowUp);
router.post('/:id/contacts', applicationController.addContact);
router.patch('/:id/contacts/:contactId', applicationController.updateContact);
router.delete('/:id/contacts/:contactId', applicationController.deleteContact);

module.exports = router;
