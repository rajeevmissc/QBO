const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const path = require('path');
require("dotenv").config();
const userSchema = require('../models/userSchema');
const userLogger = require('../utils/userLogger/userLogger');
const sgMail = require("../services/sendEmail");


module.exports = {
    createUser: async (req, res) => {
        try {
            const userData = new userSchema(req.body);
            const salt = await bcrypt.genSalt(10);
            const isUserExist = await userSchema.findOne({
                userEmail: req.body.userEmail,
            });
            if (isUserExist) {
                userLogger.log('error', "User is Already Registered with this email");
                return res.status(401).send({
                    success: false,
                    message: "User is Already Registered with this email. You can only login.",
                });
            } else {
                const profilePicFileName =
                    userData.userGender === 'male'
                        ? 'maleAvatar.png'
                        : 'femaleAvatar.png';

                const profilePicPath = path.join(__dirname, 'uploads', profilePicFileName);
                userData.userProfilePic = profilePicPath;
                userData.userPassword = await bcrypt.hash(req.body.userPassword, salt);
                userData.pastPasswords.push(userData.userPassword);
                await userData.save();
                userLogger.log('info', "User Created Successfully ✔ .");
                return res.status(201).send({
                    success: true,
                    message: "User Created Successfully ✔ .",
                });
            }
        } catch (error) {
            userLogger.log('error', `Error: ${error.message}`);
            return res.status(500).send({
                success: false,
                message: "Error",
                error: error.message,
            });
        }
    },

    userLogin: async (req, res) => {
        try {
            const isUserExist = await userSchema.findOne({
                userEmail: req.body.userEmail
            });
            if (isUserExist) {
                const bcryptPassword = await bcrypt.compare(req.body.userPassword, isUserExist.userPassword)
                if (bcryptPassword) {
                    const token = jwt.sign({ isUserExist }, process.env.SECRET_KEY, {
                        expiresIn: "1h",
                    })
                    userLogger.log('info', "User Login Successfully .")
                    res.status(200).send({
                        success: true,
                        message: 'User Login Successfully .',
                        token: token
                    })
                }
                else {
                    userLogger.log('error', "Email or Password is incorrect .")
                    res.status(401).send({
                        success: false,
                        message: "Email or Password is incorrect."
                    })
                }
            }
            else {
                userLogger.log('error', "Email is not valid")
                res.status(401).send({
                    success: false,
                    message: "Email is not valid, first create account"
                })
            }
        }
        catch (error) {
            userLogger.log('error', `Error: ${error.message}`)
            res.status(500).send({
                success: false,
                message: "Error Occurs .",
                error: error.message
            })
        }
    },

    // resetPasswordEmail: async (req, res) => {
    //     const { userEmail } = req.body;
    //     try {
    //         const userData = await userSchema.findOne({ userEmail });

    //         if (userData != null) {
    //             const secret = userData._id + process.env.SECRET_KEY;
    //             const token = jwt.sign({ userID: userData._id }, secret, { expiresIn: "20m" });

    //             const link = `http://blog/user/password/${userData._id}/${token}`;
    //             const msg = {
    //                 from: process.env.SENDGRID_SENDER,
    //                 to: userEmail,
    //                 subject: "Password Reset Request",
    //                 text: `Click here to reset your password: ${link}`,
    //                 html: `<p>Click <a href="${link}">here</a> to reset your password. The link expires in 20 minutes.</p>`
    //             };
    //             await sgMail.send(msg); // ✅ fixed here

    //             userLogger.log('info', `Email has been sent successfully to ${userEmail}`);
    //             return res.status(200).json({
    //                 success: true,
    //                 message: `Email has been sent successfully to ${userEmail}`,
    //                 token,
    //                 userID: userData._id
    //             });
    //         } else {
    //             userLogger.log('error', "Email is not valid");
    //             return res.status(403).json({
    //                 success: false,
    //                 message: "This email is Not Valid"
    //             });
    //         }
    //     } catch (error) {
    //         console.error("SendGrid error details:", error?.response?.body || error.message);
    //         userLogger.log('error', `Error: ${error.message}`);
    //         return res.status(500).json({
    //             success: false,
    //             error: `Error occurred: ${error.message}`,
    //         });
    //     }
    // },

    resetPasswordEmail: async (req, res) => {
  const { userEmail } = req.body;
  try {
    const userData = await userSchema.findOne({ userEmail });

    if (userData != null) {
      const secret = userData._id + process.env.SECRET_KEY;
      const token = jwt.sign({ userID: userData._id }, secret, { expiresIn: "20m" });

      const link = `http://localhost:3000/auth/reset-password/${userData._id}/${token}`;

      const msg = {
        from: { name: "ISSC", email: process.env.BREVO_SENDER || 'ruchis@issc.co.in' },
        to: userEmail,
        subject: "Password Reset Request",
        text: `Click here to reset your password: ${link}`,
        html: `<p>Click <a href="${link}">here</a> to reset your password. The link expires in 20 minutes.</p>`
      };

      await sgMail.send(msg); // ✅ using Brevo now

      userLogger.log('info', `Email has been sent successfully to ${userEmail}`);
      return res.status(200).json({
        success: true,
        message: `Email has been sent successfully to ${userEmail}`,
        token,
        userID: userData._id
      });
    } else {
      userLogger.log('error', "Email is not valid");
      return res.status(403).json({
        success: false,
        message: "This email is Not Valid"
      });
    }
  } catch (error) {
    console.error("Brevo error details:", error?.response?.body || error.message);
    userLogger.log('error', `Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: `Error occurred: ${error.message}`,
    });
  }
},

    resetUserPassword: async (req, res) => {
        const { newPassword, confirmPassword } = req.body;
        const { id } = req.params;
        const salt = await bcrypt.genSalt(10);
        let isPasswordExist = false
        try {
            const isUser = await userSchema.findById(id);
            if (isUser != null) {
                if (newPassword === confirmPassword) {
                    const bcryptPassword = await bcrypt.hash(confirmPassword, salt);
                    for (const oldPassword of isUser.pastPasswords) {
                        if (await bcrypt.compare(newPassword, oldPassword)) {
                            isPasswordExist = true;
                            break;
                        }
                    }
                    if (isPasswordExist) {
                        userLogger.log('error', "This password your already use in past")
                        return res.status(403).send({
                            success: false,
                            message: "This password your already use in past , try different one!"
                        })
                    }
                    await userSchema.findByIdAndUpdate(isUser._id, {
                        $set: { userPassword: bcryptPassword },
                    });
                    isUser.pastPasswords.push(bcryptPassword)
                    await isUser.save()
                    userLogger.log('info', "Password updated successfully .")
                    res.status(201).json({
                        success: true,
                        message: "Password updated successfully .",
                    });
                } else {
                    userLogger.log('error', "New password or confirm password is incorrect .")
                    res.status(403).json({
                        success: false,
                        message: "New password or confirm password is incorrect .",
                    });
                }
            } else {
                userLogger.log('error', "Email Not Found!")
                res.status(403).json({
                    success: false,
                    message: `Email Not Found! .`,
                });
            }
        } catch (error) {
            userLogger.log('error', `Error: ${error.message}`)
            res.status(500).json({
                success: false,
                error: `Error occur : ${error.message}`,
            });
        }
    },

    editProfile: async (req, res) => {
        try {
            const userId = req.params.id;
            const userPhone = req.body.userPhone ? `${req.body.userPhone}` : undefined;
            const userProfilePic = req.file ? `/upload/userProfile${req.file.filename}` : undefined;
            const updateUserData = await userSchema.findByIdAndUpdate(
                userId,
                {
                    userPhone: userPhone,
                    userProfilePic: userProfilePic,
                },
                { new: true }
            );
            if (!updateUserData) {
                userLogger.log('error', "User not found!")
                return req.status(404).send({
                    success: false,
                    message: "User not found!"
                })
            }
            userLogger.log('info', "User profile updated")
            res.status(200).send({
                success: true,
                message: "User profile updated",
                updatedData: updateUserData
            })
        } catch (error) {
            userLogger.log('error', `Error: ${error.message}`)
            res.status(500).json({
                success: false,
                error: `Error occur : ${error.message}`,
            });
        }
    },

    setNewPassword: async (req, res) => {
        try {
            const userId = req.params.id;
            const salt = await bcrypt.genSalt(10)
            const { oldPassword, newPassword, confirmPassword } = req.body;
            let isPasswordExist = false
            const userData = await userSchema.findById(userId);
            const decryptPassword = await bcrypt.compare(oldPassword, userData.userPassword)
            if (newPassword === confirmPassword) {
                if (decryptPassword) {
                    for (const oldPassword of userData.pastPasswords) {
                        if (await bcrypt.compare(newPassword, oldPassword)) {
                            isPasswordExist = true;
                            break;
                        }
                    }
                    if (isPasswordExist) {
                        userLogger.log('error', "This password you already use in past")
                        return res.status(401).json({
                            success: false,
                            message: "This password you already use in past",
                        });
                    }
                    const hashPassword = await bcrypt.hash(req.body.confirmPassword, salt)
                    userData.userPassword = hashPassword
                    userData.pastPasswords.push(hashPassword);
                    await userData.save();
                    await userSchema.findByIdAndUpdate(userData._id, {
                        $set: { empPassword: hashPassword },
                    });
                    userLogger.log('info', 'user password updated')
                    res.status(200).send({
                        success: true,
                        message: "Your Password Updated"
                    })
                }
                else {
                    userLogger.log('error', "old password is incorrect")
                    res.status(401).send({
                        success: false,
                        message: "Old password is incorrect . you can try forget password"
                    })
                }
            }
            else {
                userLogger.log('error', "New password not match with confirm password ")
                res.status(401).send({
                    success: false,
                    message: "New password not match with confirm password ."
                })
            }
        }
        catch (error) {
            userLogger.log(`error', "Error: ${error.message}`)
            res.status(500).json({
                success: false,
                message: `Error occur : ${error.message}`,
            });
        }
    }
}












