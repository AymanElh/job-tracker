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
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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
   * Search applications by text
   */
  async search(userId, text, options = {}, filters = {}) {
    const filter = {
      ...filters,
      userId,
      $text: { $search: text }
    };
    return this.findAll(filter, options);
  }
}

module.exports = new ApplicationRepository();
