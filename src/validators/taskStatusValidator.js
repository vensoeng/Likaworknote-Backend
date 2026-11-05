
const Joi = require("joi");

const createTaskStatusSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      "string.empty": "Title មិនអាចទទេបានទេ",
      "any.required": "សូមបញ្ចូល Title",
      "string.min": "Title ត្រូវមានយ៉ាងហោចណាស់ {#limit} តួអក្សរ",
      "string.max": "Title មិនអាចលើស {#limit} តួអក្សរ"
    }),

  des: Joi.string()
    .trim()
    .max(500)
    .allow("")
    .default("")
    .messages({
      "string.max": "Description មិនអាចលើស {#limit} តួអក្សរ"
    }),

  value: Joi.string()
    .trim()
    .max(150)
    .allow("")
    .default("")
    .messages({
      "string.max": "Value មិនអាចលើស {#limit} តួអក្សរ"
    })
}).unknown(false);

const validateTaskStatus = (req, res, next) => {
  const { error, value } = createTaskStatusSchema.validate(
    req.body,
    { abortEarly: false }
  );

  if (error) {
    const errorMessages = {};

    error.details.forEach((item) => {
      errorMessages[item.context.key] = item.message;
    });

    return res.status(400).json({
      success: false,
      errors: errorMessages
    });
  }

  req.body = value;
  next();
};

module.exports = {
  validateTaskStatus
};
