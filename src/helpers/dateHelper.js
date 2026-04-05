const { format, parse, toZonedTime } = require('date-fns-tz');
const GlobalSettings = require('../models/GlobalSettings');

// Format date based on global settings
const formatDate = async (date, options = {}) => {
  const settings = await GlobalSettings.getSettings();
  const { dateFormat, timeFormat, timezone } = settings.general;
  
  let formatString = dateFormat;
  if (options.includeTime) {
    formatString += timeFormat === '24h' ? ' HH:mm' : ' hh:mm a';
  }
  
  const zonedDate = toZonedTime(date, timezone);
  return format(zonedDate, formatString, { timeZone: timezone });
};

// Sync version
const formatDateSync = (date, settings, includeTime = false) => {
  const { dateFormat, timeFormat, timezone } = settings.general;
  
  let formatString = dateFormat;
  if (includeTime) {
    formatString += timeFormat === '24h' ? ' HH:mm' : ' hh:mm a';
  }
  
  const zonedDate = toZonedTime(date, timezone);
  return format(zonedDate, formatString, { timeZone: timezone });
};

// Get current time in business timezone
const getCurrentTime = async () => {
  const settings = await GlobalSettings.getSettings();
  const now = new Date();
  return toZonedTime(now, settings.general.timezone);
};

module.exports = {
  formatDate,
  formatDateSync,
  getCurrentTime
};
