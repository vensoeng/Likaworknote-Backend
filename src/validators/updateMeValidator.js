
const Joi = require("joi");

const createUpdateMeSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).optional(),

  lastName: Joi.string().allow("").trim().max(100).optional(),

  username: Joi.string().trim().min(3).max(50).optional(),

  password: Joi.string().min(6).max(100).allow("").optional(),

}).min(1).unknown(false);

const validateUpdatedMe = (req, res, next) => {
  const { error, value } = createUpdateMeSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: false
  });

  if (error) {
    const errorMessages = {};

    error.details.forEach(current => {
      const key = current.path[0];

      errorMessages[key] = current.message;
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
  validateUpdatedMe
};
