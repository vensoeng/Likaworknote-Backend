const Joi = require("joi");

const createTaskSchema = Joi.object({
  status: Joi.boolean().empty("").default(false),
  user_id: Joi.number().integer().min(1).empty("").optional(),
  
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
  
  schedule: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    "string.pattern.base": "សូមជ្រើសរើសកាលបរិច្ឆេទត្រឹមត្រូវ",
    "any.required": "សូមជ្រើសរើសកាលបរិច្ឆេទ",
    "string.empty": "សូមជ្រើសរើសកាលបរិច្ឆេទ",
  }),
  
  statuses_id: Joi.number().integer().min(3).required().messages({
    "number.base": "សូមជ្រើសរើសស្ថានភាពភារកិច្ច",
    "number.integer": "សូមជ្រើសរើសស្ថានភាពភារកិច្ច",
    "number.min": "សូមជ្រើសរើសស្ថានភាពភារកិច្ច",
    "any.required": "សូមជ្រើសរើសស្ថានភាពភារកិច្ច",
  }),
  
  // reminder_id: Joi.number().integer().min(3).required().messages({
  //   "number.base": "សូមជ្រើសរើសភារកិច្ច",
  //   "number.integer": "សូមជ្រើសរើសភារកិច្ច",
  //   "number.min": "សូមជ្រើសរើសភារកិច្ច",
  //   "any.required": "សូមជ្រើសរើសភារកិច្ច",
  // }),
  
  // telegram_id: Joi.number().integer().min(3).empty("").optional().messages({
  //   "number.base": "សូមជ្រើសរើសគណនី Telegram",
  //   "number.integer": "សូមជ្រើសរើសគណនី Telegram",
  //   "number.min": "សូមជ្រើសរើសគណនី Telegram",
  // }),
  
  title: Joi.string().trim().min(1).max(150).required().messages({
    "string.empty": "Title មិនអាចទទេបានទេ",
    "any.required": "សូមបញ្ចូល Title",
    "string.min": "Title ត្រូវមានយ៉ាងហោចណាស់ {#limit} តួអក្សរ",
    "string.max": "Title មិនអាចលើស {#limit} តួអក្សរ",
  }),
  
  des: Joi.string().trim().max(500).allow("").messages({
    "string.max": "Description មិនអាចលើស {#limit} តួអក្សរ",
  }),
  
  rate: Joi.number()
    .integer()
    .min(0)
    .max(100)
    .empty("")
    .default(0)
    .messages({
      "number.base": "វាយតម្លៃការងារត្រូវតែជាលេខ",
      "number.integer": "វាយតម្លៃការងារត្រូវតែជាលេខ",
      "number.min": "វាយតម្លៃការងារត្រូវតែពី 1 ដល់ 100",
      "number.max": "វាយតម្លៃការងារមិនអាចលើសពី 100 បានទេ",
    }),
    
  created_at: Joi.date().optional(),
  updated_at: Joi.date().optional(),
});

const validateTask = (req, res, next) => {
  const { error, value } = createTaskSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.reduce((acc, current) => {
      acc[current.context.key] = current.message;
      return acc;
    }, {});

    return res.status(400).json({
      success: false,
      errors: errorMessages,
    });
  }

  req.body = value;
  next();
};

module.exports = {
  validateTask,
};