const Joi = require('joi');

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
<<<<<<< HEAD
    listing : Joi.object({
=======
>>>>>>> 66b3219 (Fix: valid package.json structure)
        title: Joi.string().required(),
        description: Joi.string().required(),
        location: Joi.string().required(),
        country: Joi.string().required(),
        price: Joi.number().required().min(0),
        image: Joi.string().allow("", null)
    }).required(),
});
<<<<<<< HEAD
        image: Joi.string().allow("", null),
        category: Joi.string(),
    }).required()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required(),
    }).required()
})
=======
>>>>>>> 66b3219 (Fix: valid package.json structure)
