/**
 * Format messages for internationalization
 * @param {Object} msgs - The messages to format
 * @returns {Object} The formatted messages
 */
exports.format = function (msgs) {
    const results = {};
    for (const [id] of Object.entries(msgs)) {
        results[id] = { defaultMessage: id };
    }
    return results;
};
