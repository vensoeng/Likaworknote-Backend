const Joi = require("joi");

const createTelegramSchema = Joi.object({
  status: Joi.boolean().empty("").default(false),
  user_id: Joi.number().integer().min(1).empty("").optional(),
  title: Joi.string().trim().min(3).max(100).required().messages({
    "string.empty": "សូមដាក់ឈ្មោះគណនី",
    "any.required": "សូមឈ្មោះគណនី Title",
    "string.min": "ឈ្មោះគណនី ត្រូវមានយ៉ាងហោចណាស់ {#limit} តួអក្សរ",
    "string.max": "ឈ្មោះគណនី មិនអាចលើស {#limit} តួអក្សរ"
  }),
  des: Joi.string().trim().max(500).allow("").messages({
    "string.max": "Description មិនអាចលើស {#limit} តួអក្សរ"
  }),
  telegram_id: Joi.string()
    .trim()
    .max(80)
    .required()
    .messages({
        "string.base": "telegram_id ត្រូវតែជាអក្សរ",
        "any.required": "សូម Telegram ID",
        "string.max": "telegram_id មិនអាចលើសពី {#limit} តួអក្សរបានទេ"
  }),

  created_at: Joi.date().optional(),
  updated_at: Joi.date().optional()
});

const validateTelegram = (req, res, next) => {
  const { error, value } = createTelegramSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.reduce((acc, current) => {
      acc[current.context.key] = current.message;
      return acc;
    }, {});
    
    return res.status(400).json({ 
      success: false, 
      errors: errorMessages 
    });
  }
  
  // រក្សាទុក sanitized value (រួមទាំង default values និង trimmed strings) ចូលក្នុង req.body
  req.body = value;
  next();
};

module.exports = {
  validateTelegram
};