const ActivityLog = require('../models/ActivityLog');

/**
 * @desc    Logger utility for user activities
 * @param   {String} userId - ID of the user performing the action
 * @param   {String} action - Description of the action (e.g., 'Vente effectuée')
 * @param   {String} entity - Entity involved (e.g., 'Product', 'Sale')
 * @param   {String} entityId - ID of the involved entity
 * @param   {String} ip - Optional client IP
 * @param   {Object} details - Optional extra details
 */
const logActivity = async (userId, action, entity, entityId, ip = '', details = {}) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      entity,
      entityId,
      ipAddress: ip,
      details
    });
  } catch (error) {
    console.error(`[LOGGER ERROR] : ${error.message}`);
  }
};

module.exports = logActivity;
