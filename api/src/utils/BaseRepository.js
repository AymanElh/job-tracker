/**
 * Base Repository providing common database operations
 * using the Repository Pattern.
 */
class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  /**
   * Find documents with pagination, sorting, and filtering
   */
  async findAll(filter = {}, options = {}) {
    const { 
      page = 1, 
      limit = 10, 
      sort = '-createdAt', 
      select = '',
      populate = '',
    } = options;

    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.model.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .select(select)
        .populate(populate),
      this.model.countDocuments(filter)
    ]);

    return {
      docs,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a single document by ID
   */
  async findById(id, populate = '') {
    return this.model.findById(id).populate(populate);
  }

  /**
   * Find one document by filter
   */
  async findOne(filter, populate = '') {
    return this.model.findOne(filter).populate(populate);
  }

  /**
   * Create a new document
   */
  async create(data) {
    return this.model.create(data);
  }

  /**
   * Insert multiple documents
   */
  async insertMany(docs) {
    return this.model.insertMany(docs);
  }

  /**
   * Update a document by ID
   */
  async update(id, data) {
    return this.model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete (soft delete if applicable, hard delete here)
   */
  async delete(id) {
    return this.model.findByIdAndDelete(id);
  }

  /**
   * Count documents matching filter
   */
  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }
}

module.exports = BaseRepository;
