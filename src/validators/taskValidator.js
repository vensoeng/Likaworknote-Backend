
const Joi = require("joi");

const taskFields = {
  status: Joi.boolean().optional(),

  type_id: Joi.number().integer().min(3).required().messages({
    "number.base": "សូមជ្រើសរើសប្រភេទភារកិច្ច",
    "number.integer": "សូមជ្រើសរើសប្រភេទភារកិច្ច",
    "number.min": "សូមជ្រើសរើសប្រភេទភារកិច្ច",
    "any.required": "សូមជ្រើសរើសប្រភេទភារកិច្ច",
  }),

  category_id: Joi.number().integer().min(3).required().messages({
    "number.base": "សូមជ្រើសរើសបែងចែកការងារ",
    "number.integer": "សូមជ្រើសរើសបែងចែកការងារ",
    "number.min": "សូមជ្រើសរើសបែងចែកការងារ",
    "any.required": "សូមជ្រើសរើសបែងចែកការងារ",
  }),

  schedule: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .custom((value, helpers) => {
      const [year, month, day] = value.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));

      if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
      ) {
        return helpers.error("date.invalid");
      }

      return value;
    })
    .messages({
      "string.pattern.base": "សូមជ្រើសរើសកាលបរិច្ឆេទត្រឹមត្រូវ",
      "date.invalid": "កាលបរិច្ឆេទមិនត្រឹមត្រូវទេ",
      "any.required": "សូមជ្រើសរើសកាលបរិច្ឆេទ",
    }),

  statuses_id: Joi.number().integer().min(3).required().messages({
    "number.base": "សូមជ្រើសរើសស្ថានភាពភារកិច្ច",
    "number.integer": "សូមជ្រើសរើសស្ថានភាពភារកិច្ច",
    "number.min": "សូមជ្រើសរើសស្ថានភាពភារកិច្ច",
    "any.required": "សូមជ្រើសរើសស្ថានភាពភារកិច្ច",
  }),

  title: Joi.string().trim().min(1).max(150).required().messages({
    "string.empty": "Title មិនអាចទទេបានទេ",
    "any.required": "សូមបញ្ចូល Title",
    "string.max": "Title មិនអាចលើស {#limit} តួអក្សរ",
  }),

  des: Joi.string().trim().max(500).allow("").optional().messages({
    "string.max": "Description មិនអាចលើស {#limit} តួអក្សរ",
  }),

  rate: Joi.number()
    .integer()
    .min(0)
    .max(100)
    .optional()
    .messages({
      "number.base": "វាយតម្លៃការងារត្រូវតែជាលេខ",
      "number.integer": "វាយតម្លៃការងារត្រូវតែជាលេខ",
      "number.min": "វាយតម្លៃការងារមិនអាចតិចជាង 0 បានទេ",
      "number.max": "វាយតម្លៃការងារមិនអាចលើសពី 100 បានទេ",
    }),
};

const createTaskSchema = Joi.object(taskFields);

const updateTaskSchema = Joi.object(taskFields);

const createValidator = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    convert: true,
  });

  if (error) {
    const errors = {};

    error.details.forEach((detail) => {
      errors[detail.context.key] = detail.message;
    });

    return res.status(400).json({
      success: false,
      errors,
    });
  }

  req.body = value;
  next();
};

module.exports = {
  validateCreateTask: createValidator(createTaskSchema),
  validateUpdateTask: createValidator(updateTaskSchema),
};
