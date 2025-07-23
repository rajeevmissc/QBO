const joi = require('joi')
const { joiPasswordExtendCore } = require('joi-password');
const joiPassword = joi.extend(joiPasswordExtendCore);

const userSchema = {
    registerUser: joi.object({
        userName: joi
            .string()
            .max(40)
            .min(3)
            .message({
                "string-min": "{#label} should be at least {#limit} characters",
                "string-man": "{#label} should be at least {#limit} characters",
            })
            .required(),
        userEmail: joi
            .string()
            .email()
            .min(11)
            .message({
                "string-min": "{#label} should be at least {#limit} characters",
                "string-man": "{#label} should be at least {#limit} characters",
            })
            .required(),
        userPassword: joiPassword
            .string()
            .minOfSpecialCharacters(1)
            .minOfLowercase(3)
            .minOfUppercase(1)
            .minOfNumeric(1)
            .noWhiteSpaces()
            .onlyLatinCharacters()
            .messages({
                'password.minOfUppercase': '{#label} should contain at least {#min} uppercase character',
                'password.minOfSpecialCharacters':
                    '{#label} should contain at least {#min} special character',
                'password.minOfLowercase': '{#label} should contain at least {#min} lowercase character',
                'password.minOfNumeric': '{#label} should contain at least {#min} numeric character',
                'password.noWhiteSpaces': '{#label} should not contain white spaces',
                'password.onlyLatinCharacters': '{#label} should contain only latin characters',
            })
            .required(),
        userPhone: joi
            .string()
            .pattern(/^\+?[1-9]\d{7,14}$/) // E.164 international format: +1234567890
            .message({
                "string.pattern.base": "Phone number must be a valid international format",
            })
            .required(),

        userGender: joi
            .string()
            .required(),
    }).unknown(true),

    companyName: joi
        .string()
        .max(50)
        .min(2)
        .message({
            "string.min": "Company name must be at least {#limit} characters",
            "string.max": "Company name must be at most {#limit} characters",
        })
        .required(),

    companyAddress: joi
        .string()
        .max(200)
        .min(5)
        .message({
            "string.min": "Company address must be at least {#limit} characters",
            "string.max": "Company address must be at most {#limit} characters",
        })
        .required(),

    loginUser: joi.object({
        userEmail: joi
            .string()
            .email()
            .required(),
        userPassword: joi
            .string()
    }).unknown(true),

    resetUserPassword: joi.object({
        newPassword: joiPassword
            .string()
            .required(),
        confirmPassword: joiPassword
            .string()
            .required(),
    }),
}

module.exports = userSchema
