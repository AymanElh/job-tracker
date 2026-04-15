const ApplicationRepository = require('./ApplicationRepository');
const { AppError } = require('../../utils');
const Contact = require('../contacts/Contact');

class ApplicationService {
  /**
   * Create a new job application
   */
  async createApplication(userId, applicationData) {
    return ApplicationRepository.create({
      ...applicationData,
      userId
    });
  }

  /**
   * Create multiple applications
   */
  async createApplicationsBatch(userId, applicationsArray) {
    const docs = applicationsArray.map(app => ({
      ...app,
      userId
    }));
    return ApplicationRepository.insertMany(docs);
  }

  /**
   * Get all applications for a user without pagination (for export)
   */
  async getAllApplicationsForExport(userId) {
    // using findByUser but overriding limit to a very high number or 0 (if BaseRepository supports it, or direct model call)
    // Actually, BaseRepository.findAll uses skip/limit. If we need all, we should probably just query the model directly.
    return ApplicationRepository.model.find({ userId }).sort('-createdAt').lean();
  }

  /**
   * Get all applications for a user with filters
   */
  async getAllApplications(userId, query) {
    const { 
      page, 
      limit, 
      sort, 
      status, 
      locationType, 
      contractType,
      city,
      appliedVia,
      search 
    } = query;

    const filter = {};
    if (status) filter.status = status;
    if (locationType) filter.locationType = locationType;
    if (contractType) filter.contractType = contractType;
    if (city) {
      const escapedCity = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter['location.city'] = new RegExp(escapedCity, 'i');
    }
    if (appliedVia) filter.appliedVia = appliedVia;
    
    // If search is provided, use the repository's search method
    if (search) {
      return ApplicationRepository.search(userId, search, { page, limit, sort }, filter);
    }

    return ApplicationRepository.findByUser(userId, filter, { page, limit, sort });
  }

  /**
   * Get a single application by ID
   */
  async getApplicationById(userId, applicationId) {
    const application = await ApplicationRepository.findById(applicationId, 'contacts');
    
    if (!application || application.userId.toString() !== userId.toString()) {
      throw new AppError('Application not found or unauthorized', 404);
    }
    
    return application;
  }

  /**
   * Update an application
   */
  async updateApplication(userId, applicationId, updateData) {
    // First verify ownership
    await this.getApplicationById(userId, applicationId);
    
    return ApplicationRepository.update(applicationId, updateData);
  }

  /**
   * Add a follow-up to an application
   */
  async addFollowUp(userId, applicationId, followUpData) {
    const application = await this.getApplicationById(userId, applicationId);
    
    application.followUps.push(followUpData);
    return application.save();
  }

  /**
   * Add a contact to an application
   */
  async addContact(userId, applicationId, contactData) {
    const application = await this.getApplicationById(userId, applicationId);
    
    const contact = await Contact.create({
      ...contactData,
      userId,
      company: application.company.name
    });

    application.contacts.push(contact._id);
    await application.save();
    
    return contact;
  }

  /**
   * Update a contact
   */
  async updateContact(userId, contactId, contactData) {
    const contact = await Contact.findById(contactId);
    if (!contact || contact.userId.toString() !== userId.toString()) {
      throw new AppError('Contact not found or unauthorized', 404);
    }
    
    return Contact.findByIdAndUpdate(contactId, contactData, { new: true });
  }

  /**
   * Delete a contact from an application
   */
  async deleteContact(userId, applicationId, contactId) {
    const application = await this.getApplicationById(userId, applicationId);
    const contact = await Contact.findById(contactId);
    
    if (!contact || contact.userId.toString() !== userId.toString()) {
      throw new AppError('Contact not found or unauthorized', 404);
    }

    // Remove from application's contacts array
    application.contacts = application.contacts.filter(id => id.toString() !== contactId.toString());
    await application.save();

    // Delete the contact document
    return Contact.findByIdAndDelete(contactId);
  }

  /**
   * Delete an application
   */
  async deleteApplication(userId, applicationId) {
    await this.getApplicationById(userId, applicationId);
    return ApplicationRepository.delete(applicationId);
  }

  /**
   * Get dashboard summary stats
   */
  async getStatsSummary(userId) {
    return ApplicationRepository.getStats(userId);
  }
}

module.exports = new ApplicationService();
