const express = require( 'express' );
const router = express.Router();
const { signUp, verifyEmail, resendVerificationEmail, signIn, signOut, changePasword, resetPassword, forgotPassword } = require( '../controllers/userController' );


router.route( "/users/sign-up" )
    .post( signUp )

router.route( "/users/verify-email/:token" )
    .get( verifyEmail );

router.route( "/users/resend-verification-email" )
    .post( resendVerificationEmail );
    
router.route( "/users/sign-in" )
    .post( signIn )
    
router.route( "/users/sign-out" )
    .post(signOut)

        
router.route( "/changePassword/:id" )
.patch(changePasword)

router.route( "/resetPassword/:id" )
.post(resetPassword)

router.route( "/forgotPassword/:id" )
.post(forgotPassword)
    

module.exports = router;
