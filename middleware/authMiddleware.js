// const jwt = require( 'jsonwebtoken' );

// // auth middleware
// const userAuth = ( req, res, next ) => {
//     const hasAuthorization = req.headers.authorization;
//     if ( !hasAuthorization ) {
//         res.status( 404 ).json( {
//             message: 'No authorization found.'
//         })
//     } 
//     const token = hasAuthorization.split( ' ' )[ 1 ];
//     try {
//         const decodedToken = jwt.verify( token, process.env.JWT_SECRETE )
//         req.user = JSON.stringify(decodedToken);
//         req.userId = decodedToken.userId;
//         req.userEmail = decodedToken.email;
//         req.username = decodedToken.username;
//         next();
//     } catch (error) {
//         res.status(500).json({ message: error.message})
//     }
// }

// module.exports = {
//     userAuth,
// };



const jwt = require('jsonwebtoken');

const userAuth = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({
            message: 'No authorization token found.'
        });
    }

    jwt.verify(token, process.env.JWT_SECRETE, (err, decodedToken) => {
        if (err) {
            return res.status(500).json({
                message: 'Failed to authenticate token.'
            });
        }

        req.user = {
            userId: decodedToken.userId,
            userEmail: decodedToken.email,
            username: decodedToken.username
        };

        next();
    });
};

 module.exports = {
        userAuth,
    };
