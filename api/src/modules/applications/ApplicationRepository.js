const mongoose = require('mongoose');
const BaseRepository = require('../../utils/BaseRepository');
const Application = require('./Application');

class ApplicationRepository extends BaseRepository {
  constructor() {
    super(Application);
  }

  /**
   * Find all applications for a specific user with advanced filtering
   */
  async findByUser(userId, filter = {}, options = {}) {
    const query = { ...filter, userId };
    return this.findAll(query, options);
  }

  /**
   * Get applications stats for dashboard
   */
  async getStats(userId) {
    return this.model.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);
  }

  /**
   * Search applications by text (supports partial matching)
   */
  async search(userId, text, options = {}, filters = {}) {
    // Escape special regex characters
    const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedText, 'i');
    const filter = {
      ...filters,
      userId,
      $or: [
        { jobTitle: { $regex: searchRegex } },
        { 'company.name': { $regex: searchRegex } },
        { notes: { $regex: searchRegex } }
      ]
    };
    return this.findAll(filter, options);
  }
}

module.exports = new ApplicationRepository();
