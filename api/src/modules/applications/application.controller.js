const { Parser } = require('@json2csv/plainjs');
const ApplicationService = require('./application.service');
const { ApiResponse, asyncHandler } = require('../../utils');

/**
 * Controller for Job Applications
 */
const createApplication = asyncHandler(async (req, res) => {
  let applicationData = req.body;
  
  // If data is sent as a string (FormData), parse it
  if (typeof req.body.data === 'string') {
    applicationData = JSON.parse(req.body.data);
  }

  if (req.file) {
    applicationData.resumeUrl = `/uploads/resumes/${req.file.filename}`;
  }

  const application = await ApplicationService.createApplication(req.user.id, applicationData);
  ApiResponse.success(res, application, 'Application created successfully', 201);
});

const getAllApplications = asyncHandler(async (req, res) => {
  const result = await ApplicationService.getAllApplications(req.user.id, req.query);
  ApiResponse.paginated(res, result, 'Applications retrieved successfully');
});

const getApplicationById = asyncHandler(async (req, res) => {
  const application = await ApplicationService.getApplicationById(req.user.id, req.params.id);
  ApiResponse.success(res, application, 'Application retrieved successfully');
});

const updateApplication = asyncHandler(async (req, res) => {
  let applicationData = req.body;
  
  // If data is sent as a string (FormData), parse it
  if (typeof req.body.data === 'string') {
    applicationData = JSON.parse(req.body.data);
  }

  if (req.file) {
    applicationData.resumeUrl = `/uploads/resumes/${req.file.filename}`;
  }

  const application = await ApplicationService.updateApplication(req.user.id, req.params.id, applicationData);
  ApiResponse.success(res, application, 'Application updated successfully');
});

const deleteApplication = asyncHandler(async (req, res) => {
  await ApplicationService.deleteApplication(req.user.id, req.params.id);
  ApiResponse.success(res, null, 'Application deleted successfully');
});

const getStatsSummary = asyncHandler(async (req, res) => {
  const stats = await ApplicationService.getStatsSummary(req.user.id);
  ApiResponse.success(res, stats, 'Application statistics retrieved successfully');
});

const addFollowUp = asyncHandler(async (req, res) => {
  const application = await ApplicationService.addFollowUp(req.user.id, req.params.id, req.body);
  ApiResponse.success(res, application, 'Follow-up added successfully');
});

const addContact = asyncHandler(async (req, res) => {
  const contact = await ApplicationService.addContact(req.user.id, req.params.id, req.body);
  ApiResponse.success(res, contact, 'Contact added successfully', 201);
});

const updateContact = asyncHandler(async (req, res) => {
  const contact = await ApplicationService.updateContact(req.user.id, req.params.contactId, req.body);
  ApiResponse.success(res, contact, 'Contact updated successfully');
});

const deleteContact = asyncHandler(async (req, res) => {
  await ApplicationService.deleteContact(req.user.id, req.params.id, req.params.contactId);
  ApiResponse.success(res, null, 'Contact deleted successfully');
});

const importApplications = asyncHandler(async (req, res, next) => {
  const applications = req.body;
  if (!Array.isArray(applications) || applications.length === 0) {
    return next(new AppError('Please provide an array of applications to import', 400));
  }

  const result = await ApplicationService.createApplicationsBatch(req.user.id, applications);
  ApiResponse.success(res, result, `${result.length} applications imported successfully`, 201);
});

const exportApplicationsCsv = asyncHandler(async (req, res) => {
  const applications = await ApplicationService.getAllApplicationsForExport(req.user.id);
  
  const fields = [
    'jobTitle',
    'company.name',
    'company.website',
    'status',
    'location.city',
    'location.country',
    'locationType',
    'contractType',
    'seniority',
    'appliedVia',
    'foundOn',
    'jobUrl',
    'appliedAt',
    'createdAt',
    'updatedAt'
  ];

  try {
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(applications);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=applications_export.csv');
    
    res.status(200).send(csv);
  } catch (err) {
    console.error('Error generating CSV:', err);
    res.status(500).json({ success: false, message: 'Could not generate CSV file' });
  }
});

module.exports = {
  createApplication,
  getAllApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  getStatsSummary,
  addFollowUp,
  addContact,
  updateContact,
  deleteContact,
  importApplications,
  exportApplicationsCsv
};
