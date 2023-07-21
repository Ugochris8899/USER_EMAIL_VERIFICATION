require( 'dotenv' ).config();
const userModel = require( '../models/userModel' );
const bcrypt = require( 'bcrypt' );
const jwt = require( 'jsonwebtoken' );
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");


// create a nodemailer transporter
const transporter = nodemailer.createTransport( {
    service: "gmail",
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD,
    }
});

// const transporter = nodemailer.createTransport({
// host: "sandbox.smtp.mailtrap.io",
//     port: 2525,
//     auth: {
//       user: process.env.MAIL_TRAP_USERNAME,
//       pass: process.env.MAIL_TRAP_PASSWORD
//     }
//   });
  
  // SignUp
  const signUp = async ( req, res ) => {
      try {
          // get all data from the request body
          const { username, email, password } = req.body;
          // check if the entry email exist
          const isEmail = await userModel.findOne( { email } );
          if ( isEmail ) {
              res.status( 400 ).json( {
                  message: `user with this email: ${email} already exist.`
              })
          } else {
              // salt the password using bcrypt
              const saltedRound = await bcrypt.genSalt( 10 );
              // hash the salted password using bcrypt
              const hashedPassword = await bcrypt.hash( password, saltedRound )
  
              // create a token
              const token = await jwt.sign( { email }, process.env.JWT_SECRETE, { expiresIn: "50m" } );
          
              // create a user
              const user = new userModel( {
                  username,
                  email,
                  password: hashedPassword
                  
              } );
              
              // send verification email
              const baseUrl = process.env.BASE_URL
              const mailOptions = {
                  from: process.env.SENDER_EMAIL,
                  to: email,
                  subject: "Verify your account",
                  html: `Please click on the link to verify your email: <a href="${baseUrl}/users/verify-email/${ token }">Verify Email</a>`,
              };
  
              await transporter.sendMail( mailOptions );
  
              // save the user
              const savedUser = await user.save();
  
              // return a response
              res.status( 201 ).json( {
              message: `Check your email: ${savedUser.email} to verify your account.`,
              data: savedUser,
              token
          })
          }
      } catch (error) {
          res.status( 500 ).json( {
              message: error.message
          })
      }
  }
  
  // verify email
  const verifyEmail = async (req, res) => {
      try {
          const { token } = req.params;
  
          // verify the token
          const { email } = jwt.verify( token, process.env.JWT_SECRETE );
  
          const user = await userModel.findOne( { email } );
  
          // update the user verification
          user.isVerified = true;
  
          // save the changes
          await user.save();
  
          // update the user's verification status
          const updatedUser = await userModel.findOneAndUpdate( {email}, user );
  
          res.status( 200 ).json( {
              message: "User verified successfully",
              data: updatedUser,
          })
          // res.status( 200 ).redirect( `${ process.env.BASE_URL }/login` );
  
      } catch ( error ) {
          res.status( 500 ).json( {
              message: error.message
          })
      }
  }
  
  // resend verification
  const resendVerificationEmail = async (req, res) => {
      try {
          // get user email from request body
          const { email } = req.body;
  
          // find user
          const user = await userModel.findOne( { email } );
          if ( !user ) {
              return res.status( 404 ).json( {
                  error: "User not found"
              } );
          }
  
          // create a token
              const token = await jwt.sign( { email }, process.env.JWT_SECRETE, { expiresIn: "50m" } );
              
               // send verification email
              const baseUrl = process.env.BASE_URL
              const mailOptions = {
                  from: process.env.SENDER_EMAIL,
                  to: user.email,
                  subject: "Email Verification",
                  html: `Please click on the link to verify your email: <a href="http://localhost:7000/api/users/verify-email/${ token }">Verify Email</a>`,
              };
  
              await transporter.sendMail( mailOptions );
  
          res.status( 200 ).json( {
              message: `Verification email sent successfully to your email: ${user.email}`
          } );
  
      } catch ( error ) {
          res.status( 500 ).json( {
              message: error.message
          })
      }
  }
  
  // signIn
  const signIn = async ( req, res ) => {
      try {
          // extract the user email and password
          const { email, password } = req.body;
          // find user by their registered email
          const user = await userModel.findOne( { email } );
          
          // check if email exist
          if ( !user ||  !user.isVerified) {
              res.status( 404 ).json( {
                  message: `User with this email: ${email} is not found.`
              })
          } {
              // compare user password with the saved password.
              const isPassword = await bcrypt.compare( password, user.password );
              // check for password error
              if ( !isPassword ) {
                  res.status( 400 ).json( {
                      message: "Incorrect password"
                  })
              } else {
                  // save the generated token to "token" variable
                  const token = await genToken( user )
                  // return a response
                  res.status( 200 ).json( {
                      message: "Sign In successful",
                      token: token,
                      data: user
                  })
              }
          }
      } catch ( error ) {
          res.status( 500 ).json( {
              message: error.message
          })
      }
  }
  
//   const signOut = async (req, res) => {
//       try {
//           // get the token from the authorization head
//           const token = req.headers.authorization;
  
//           // find the user by the token
//           const user = await userModel.find( { token } );
  
//           if ( !user ) {
//               return res.status( 401 ).json( {
//                   message: "Invalid token"
//               })
//           }
  
//           // clear the token
//           user.token = '';
  
//           // save the user with the saved token
//           // await user.save();
  
//           return res.status( 200 ).json( {
//               message: "User signed out successfully"
//           })
//       } catch ( error ) {
//           console.error( "Something went wrong", error.message );
//           res.status( 500 ).json( {
//               message: error.message
//           })
//       }
//   }

const signOut = async(req, res) =>{
    try {
        const {email} = req.body;
        // find the user by the email
        const findUser = await userModel.findOne({email})

        if (!findUser) {
            return res.status(401).json({
                message: "Invalid Email"
            })
        } else {
            // clear the token 
            findUser.token = ''

            // save the data
            await findUser.save()
            return res.status(201).json({
                message: "User signout successfully"
            })

        }

    } catch (error) {
       res.status(500).json({
        message: error.message
       })
    }
}
  
  const genToken = async ( user ) => {
      const token = await jwt.sign( {
          userId: user._id,
          username: user.username,
          email: user.email,
      }, process.env.JWT_SECRETE, {expiresIn: "50m"} )
      
      return token;
  }

  
// Change password
const changePasword = async(req, res) =>{
    try {
        const {oldPassword, password} = req.body;
        const id = req.params.id;
        const user = await userModel.findById(id);
        // check if email exist
        if ( !user ||  !user.isVerified) {
            res.status( 404 ).json( {
                message: `User with this email: ${email} is not found.`
            })
        } {
            // compare user password with the saved password.
            const isPassword = await bcrypt.compare( oldPassword, user.password );
            // check for password error
            if ( !isPassword ) {
                res.status( 400 ).json( {
                    message: "Incorrect password"
                })
            } else {
                // save the generated token to "token" variable
                const token = await genToken( user )
                
                // salt the password using bcrypt
        const saltedRound = await bcrypt.genSalt( 10 );
        // hash the salted password using bcrypt
        const hashedPassword = await bcrypt.hash( password, saltedRound );
        const bodyData = {
            password: hashedPassword
        } 
         const changedPassword = await userModel.findByIdAndUpdate(id, bodyData, {new: true})
         return res.status(201).json({
            message: "Password changed Successfully"
        
         })
            }
        }
    } catch (error) {
        res.status(500).json({message:error.message})
    }
}

   

const resetPassword = async(req, res) =>{
    try {
        const {email} = req.body;

        // check if the email exists in the database
        const user = await userModel.findOne({email});
        if(!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        //Generate a random password
        const newPassword = Math.random().toString(36).slice(-8);

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        // Send the new password to the user's email
        const transporter = nodemailer.createTransport( {
            service: "Gmail",
            auth: {
                user: process.env.USER_EMAIL,
                pass: process.env.USER_PASSWORD,
            }
        });

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Password Reset",
            text: `Your new password is: ${newPassword}`, 
        };

        transporter.sendMail(mailOptions, (error) =>{
            if (error) {
                console.log('Error sending email:', error);
                return res.status(500).json({
                    error: 'failed to send email'
                });
                    
                
            }
            return res.status(200).json({
                message: 'Password reset successfully'
            });
        });


    } catch (error) {
        console.log("Error resetting password:", error);
        res.status(500).json({
            error:'An internal server error occurred'
        })
    }

}


const forgotPassword = async(req, res) =>{
    try {
        const {email} = req.body;

        // check if the email exists in the database
        const user = await userModel.findOne({email});
        if(!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        //Generate a temporary token for password reset
        const resetToken = await jwt.sign( { email }, process.env.JWT_SECRETE, { expiresIn: "30m" });

        // send an email with the reset token
        const transporter = nodemailer.createTransport( {
            service: "Gmail",
            auth: {
                user: process.env.USER_EMAIL,
                pass: process.env.USER_PASSWORD,
            }
        });

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Password Reset",
            text: `Please click on the link to reset your password: <a href="http://localhost:7000/api/users/verify-email/${ resetToken }">Forgot Password</a>`,
             
        };
          
            transporter.sendMail(mailOptions, (error,info) =>{
            if (error) {
                // console.log('Error sending email:', error);
                return res.status(500).json({
                    error: 'failed to send reset email.'
                });
                    } else {
                        // console.log('Email sent:', info.response);
                        res.json({message: 'Reset password sent successfully.'})
                    }
            })
         } catch (error) {
        // console.log("Error resetting password:", error);
        res.status(500).json({
            error:'An internal server error occurred'
        })
    }

}

// get one user
const getOne = async(req,res) =>{
    try {
        const oneUser = await userModel.findById(req.params.id)
        if(!oneUser) {res.status(400).json("This user doesn't exist")}
        else{
            res.status(200).json({data:oneUser})
        }
    } catch (error) {
        res.status(400).json({message: error.message})
    }
}

// get all users
const getAllUsers = async ( req, res ) => {
    try {
        const users = await userModel.find();
        if ( users === null ) {
            res.status( 200 ).json( {
                message: "No user found.",
                data: []
            })
        } else {
            res.status( 200 ).json( {
                message: "The number of users are: "+  users.length,
                data: users
            })
        }
    } catch ( e ) {
        res.status( 500 ).json( {
            message: e.message
        })
    }
}
  
  module.exports = {
      signUp,
      signIn,
      signOut,
      verifyEmail,
      resendVerificationEmail,
      changePasword,
      resetPassword,
      forgotPassword,
      getOne,
      getAllUsers
      
  }