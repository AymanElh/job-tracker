const express = require('express');
const applicationController = require('./application.controller');
const { protect } = require('../../middleware/auth');
const upload = require('../../middleware/upload');

const validate = require('../../middleware/validate');
const applicationValidation = require('./application.validation');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(applicationController.getAllApplications)
  .post(upload.single('resume'), validate(applicationValidation.createApplication), applicationController.createApplication);

router.get('/stats', applicationController.getStatsSummary);
router.get('/export/csv', applicationController.exportApplicationsCsv);
router.post('/batch', applicationController.importApplications);

router.route('/:id')
  .get(applicationController.getApplicationById)
  .patch(upload.single('resume'), validate(applicationValidation.updateApplication), applicationController.updateApplication)
  .delete(applicationController.deleteApplication);

router.post('/:id/follow-ups', applicationController.addFollowUp);
router.post('/:id/contacts', applicationController.addContact);
router.patch('/:id/contacts/:contactId', applicationController.updateContact);
router.delete('/:id/contacts/:contactId', applicationController.deleteContact);

module.exports = router;
