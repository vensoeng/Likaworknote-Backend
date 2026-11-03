const Joi = require("joi");

const createTaskTypeSchema = Joi.object({
  status: Joi.boolean().empty("").default(false),
  user_id: Joi.number().integer().min(1).empty("").optional(),
  title: Joi.string().trim().min(1).max(150).required().messages({
    "string.empty": "Title មិនអាចទទេបានទេ",
    "any.required": "សូមបញ្ចូល Title",
    "string.min": "Title ត្រូវមានយ៉ាងហោចណាស់ {#limit} តួអក្សរ",
    "string.max": "Title មិនអាចលើស {#limit} តួអក្សរ"
  }),
  des: Joi.string().trim().max(500).allow("").messages({
    "string.max": "Description មិនអាចលើស {#limit} តួអក្សរ"
  }),
  created_at: Joi.date().optional(),
  updated_at: Joi.date().optional()
});

const validateTaskType = (req, res, next) => {
  const { error, value } = createTaskTypeSchema.validate(req.body, { abortEarly: false });
  
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
  validateTaskType
};