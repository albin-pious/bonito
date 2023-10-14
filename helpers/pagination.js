

const paginate = async (model, page, perPage, queryOptions = {}) => {
    try {
        // Ensure page is a valid positive integer, defaulting to 1 if not
        const currentPage = Math.max(1, parseInt(page, 10) || 1);

        const totalCount = await model.countDocuments(queryOptions);
        const totalPages = Math.ceil(totalCount / perPage);

        // Calculate skipValue after ensuring currentPage is valid
        const skipValue = (currentPage - 1) * perPage;
        console.log('currentPage:', currentPage, 'perPage:', perPage, 'skipValue:', skipValue);

        const result = await model.find(queryOptions).skip(skipValue).limit(perPage);

        return {
            result,
            currentPage,
            totalPages,
            totalCount
        }
    } catch (error) {
        console.error('Error in paginate function:', error);
        throw error;
    }
}

module.exports = { paginate }
