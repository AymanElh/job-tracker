const Joi = require('joi');

const createApplication = {
  body: Joi.object().keys({
    jobTitle: Joi.string().required(),
    company: Joi.object().keys({
      name: Joi.string().required(),
      logoUrl: Joi.string().uri().allow(''),
      website: Joi.string().uri().allow(''),
      email: Joi.string().email().allow(''),
    }).required(),
    jobUrl: Joi.string().uri().allow(''),
    jobDescription: Joi.string().allow(''),
    status: Joi.string().valid('planned', 'applied', 'screening', 'technical', 'interview', 'offer', 'rejected', 'withdrawn').default('applied'),
    contractType: Joi.string().valid('full-time', 'part-time', 'contract', 'freelance', 'internship').allow(''),
    seniority: Joi.string().valid('junior', 'mid', 'senior', 'lead').allow(''),
    locationType: Joi.string().valid('remote', 'hybrid', 'onsite').allow(''),
    location: Joi.object().keys({
      city: Joi.string().allow(''),
      country: Joi.string().allow(''),
    }),
    techStack: Joi.array().items(Joi.string()),
    foundOn: Joi.string().valid('linkedin', 'indeed', 'company', 'email', 'referral', 'other').allow(''),
    appliedVia: Joi.string().valid('company-website', 'linkedin', 'indeed', 'email', 'recruiter', 'other').allow(''),
    salary: Joi.object().keys({
      min: Joi.number(),
      max: Joi.number(),
      currency: Joi.string(),
      type: Joi.string().valid('annual', 'monthly', 'hourly'),
    }),
    appliedAt: Joi.date(),
    notes: Joi.string().allow(''),
    cvVersion: Joi.string().allow(''),
    coverLetter: Joi.string().allow(''),
    data: Joi.string(), // For FormData multipart
  }),
};

const updateApplication = {
  params: Joi.object().keys({
    id: Joi.string().required(), // Ideally Joi.string().custom(objectId)
  }),
  body: Joi.object().keys({
    jobTitle: Joi.string(),
    company: Joi.object().keys({
      name: Joi.string(),
      logoUrl: Joi.string().uri().allow(''),
      website: Joi.string().uri().allow(''),
      email: Joi.string().email().allow(''),
    }),
    jobUrl: Joi.string().uri().allow(''),
    jobDescription: Joi.string().allow(''),
    status: Joi.string().valid('planned', 'applied', 'screening', 'technical', 'interview', 'offer', 'rejected', 'withdrawn'),
    contractType: Joi.string().valid('full-time', 'part-time', 'contract', 'freelance', 'internship').allow(''),
    seniority: Joi.string().valid('junior', 'mid', 'senior', 'lead').allow(''),
    locationType: Joi.string().valid('remote', 'hybrid', 'onsite').allow(''),
    location: Joi.object().keys({
      city: Joi.string().allow(''),
      country: Joi.string().allow(''),
    }),
    techStack: Joi.array().items(Joi.string()),
    foundOn: Joi.string().valid('linkedin', 'indeed', 'company', 'email', 'referral', 'other').allow(''),
    appliedVia: Joi.string().valid('company-website', 'linkedin', 'indeed', 'email', 'recruiter', 'other').allow(''),
    salary: Joi.object().keys({
      min: Joi.number(),
      max: Joi.number(),
      currency: Joi.string(),
      type: Joi.string().valid('annual', 'monthly', 'hourly'),
    }),
    appliedAt: Joi.date(),
    notes: Joi.string().allow(''),
    cvVersion: Joi.string().allow(''),
    coverLetter: Joi.string().allow(''),
    data: Joi.string(),
  }).min(1),
};

module.exports = {
  createApplication,
  updateApplication,
};
