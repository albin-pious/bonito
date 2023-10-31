

const paginate = async (collection, page, perPage, queryOptions = {}) => {
    try {
      // Ensure page is a valid positive integer, defaulting to 1 if not
      const currentPage = Math.max(1, parseInt(page, 10) || 1);
  
      // Use the `countDocuments` method on the collection
      const totalCount = await collection.countDocuments(queryOptions);
  
      const totalPages = Math.ceil(totalCount / perPage);
  
      // Calculate skipValue after ensuring currentPage is valid
      const skipValue = (currentPage - 1) * perPage;
  
      // Use the `find` method on the collection for querying and pagination
      const result = await collection.find(queryOptions).skip(skipValue).limit(perPage).toArray();
  
      return {
        result,
        currentPage,
        totalPages,
        totalCount,
      };
    } catch (error) {
      console.error('Error in paginate function:', error);
      throw error;
    }
  };
  

module.exports = { paginate }
