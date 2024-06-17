import googleStrategy from 'passport-google-oauth2' ;
import passport from 'passport';
import localStrategy from 'passport-local';
import dotenv from 'dotenv';
dotenv.config();
const LocalStrategy=localStrategy.Strategy;
const GoogleStrategy=googleStrategy.Strategy;
function redirectLogin(req, res, next) {
    if(req.user)
    {return res.redirect('/login4')}
    next();
    }
    function isLoggedIn(req, res, next) {
    req.user ? next() : res.sendStatus(401);
    }
    passport.use(new LocalStrategy(
    function(username, password, done,res) {
    console.log("HElllo")
    // Replace this with your actual user verification logic
    if (username === 'testuser' && password === 'testpassword') {
    return done(null, { username: 'testuser' });
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
    function(request, accessToken, refreshToken, profile, done) {
    done(null, profile)
    }
    ));
    passport.serializeUser(function(user, done) {
    done(null, user);
    })
    passport.deserializeUser(function(user, done) {
    done(null, user);
    })
      export {redirectLogin,isLoggedIn} 
    export default passport;