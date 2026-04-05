const validateCreateCategory = (data) => {
  const errors = [];

  if (!data.name || data.name.trim() === '') {
    errors.push('Category name is required');
  }

  if (data.attributes && Array.isArray(data.attributes)) {
    for (let i = 0; i < data.attributes.length; i++) {
      const attr = data.attributes[i];
      if (!attr.name || attr.name.trim() === '') {
        errors.push(`Attribute at index ${i} must have a name`);
      }
      if (attr.type === 'select' && (!attr.options || attr.options.length === 0)) {
        errors.push(`Attribute "${attr.name}" of type 'select' must have options`);
      }
    }
  }

  return errors;
};

const validateUpdateCategory = (data) => {
  const errors = [];

  if (data.attributes && Array.isArray(data.attributes)) {
    for (let i = 0; i < data.attributes.length; i++) {
      const attr = data.attributes[i];
      if (!attr.name || attr.name.trim() === '') {
        errors.push(`Attribute at index ${i} must have a name`);
      }
      if (attr.type === 'select' && (!attr.options || attr.options.length === 0)) {
        errors.push(`Attribute "${attr.name}" of type 'select' must have options`);
      }
    }
  }

  return errors;
};

module.exports = {
  validateCreateCategory,
  validateUpdateCategory
};
