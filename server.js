require('./config/userDB')
const express = require( 'express' );
const userRouter = require( './routes/userRoute' );
const recordRouter = require( './routes/recordRoutes' );
const mongoose= require("mongoose")
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = 5556;
app.use( express.json() )

app.get( "/test", ( req, res) => {
    res.send("User Authentication and Authorization")
})

app.use( '/api', userRouter );
app.use( '/api', recordRouter );
app.listen( PORT, () => {
    console.log( `Server is listening to port: ${ PORT }` );
} );

