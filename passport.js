import googleStrategy from 'passport-google-oauth2' ;
import passport from 'passport';
import localStrategy from 'passport-local';
import dotenv from 'dotenv';
import { AddGoogleUser,verify,getName } from './Mongoose.js';
dotenv.config();
const LocalStrategy=localStrategy.Strategy;
const GoogleStrategy=googleStrategy.Strategy;
function redirectLogin(req, res, next) {
    if(req.user)
    {return res.redirect('/')}
    next();
    }
    passport.use(new LocalStrategy(
    async function(username, password, done,res,req) {
    const data=await verify(username,password,res);
    if (data) { 
       return done(null, { username: username });
    } else {
    return done(null, false, { message: 'Incorrect username or password.' });
    }
    }
    ));
    passport.use(new GoogleStrategy({
      clientID:    process.env.API_ID,
      clientSecret: process.env.API_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    passReqToCallback   : true
    },
    async function(request, accessToken, refreshToken, profile, done) {
    AddGoogleUser(profile.displayName,profile.email);
    const username=await getName(profile.email);
    console.log({username:username})
    done(null, { username: username })
    }
    ));
    passport.serializeUser(function(user, done) {
    done(null, user);
    })
    passport.deserializeUser(function(user, done) {
    done(null, user);
    })
      export {redirectLogin} 
    export default passport;