import passport from 'passport';
import express from 'express';
import googleStrategy from 'passport-google-oauth2' ;
import session from 'express-session';
import localStrategy from 'passport-local';
import bodyParser from 'body-parser';
import path from "path";
import dotenv from 'dotenv';
import { fileURLToPath } from "url";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LocalStrategy=localStrategy.Strategy;
const GoogleStrategy=googleStrategy.Strategy;
const app = express();
app.use(express.static('./dist'));
app.set('trust proxy', 1) // trust first proxy
app.use(session({
secret: 'keyboard cat',
resave: false,
saveUninitialized: true,
cookie: { secure: false,maxAge: 60000}
}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
function redirectLogin(req, res, next) {
if(req.user)
{return res.redirect('/login4')}
next();
}
function isLoggedIn(req, res, next) {
req.user ? next() : res.sendStatus(401);
}
passport.use(new LocalStrategy(
function(username, password, done) {
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
callbackURL: "http://127.0.0.1:3000/auth/google/callback",
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
app.post('/new',(req,res,next)=>{
  console.log(req.body)
  next();
},
passport.authenticate('local', { failureRedirect: '/failure' }),
function(req, res) {
// Successful authentication, respond with success message.
res.status(200).json({ message: "Authenticated", user: req.user.username });
});
app.get('/auth/google',
passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
passport.authenticate('google', { failureRedirect: '/failure' }),
function(req, res) {
// Successful authentication, redirect home.
res.redirect('/login4');
});
app.get("/login4",isLoggedIn, (req, res) => {
res.status(200).json({ message:"Hello ", user: req.user.displayName})
})
app.get("/logout", (req, res) => {
req.session.destroy();
res.send("Logged out")
})
app.get('/failure', (req, res) => {
res.status(200).json("faailed to authenticate")
});
app.get('/',redirectLogin, (req, res) => {
res.sendFile("vite-project/dist/index.html", {root: __dirname})
});
app.listen(3000, () => {
console.log('Server is running on port 3000')
});
