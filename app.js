import passport,{redirectLogin,isLoggedIn} from './passport.js';
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import path from "path";
import dotenv from 'dotenv';
import { fileURLToPath } from "url";
import CreateUser from './Mongoose.js';
import mongoose from 'mongoose';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
app.get('/login',redirectLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'))
});
app.get('/signup',redirectLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'))
  });
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));
  
  app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/failure' }),
  function(req, res) {
  // Successful authentication, redirect home.
  res.redirect('/login4');
  });
  app.post('/login', (req, res, next) => {
    console.log(req.body);
    passport.authenticate('local', function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ message: 'Incorrect username or password.' });
        }
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            return res.status(200).json({ message: "Authenticated", user: user.username });
        });
    })(req, res, next);
});
//Registering user
app.post("/register", (req, res) => {
  CreateUser(req.body.username,req.body.password,res);
});
app.listen(3000, async() => {
  await mongoose.connect(process.env.ConnectionPort)
console.log('Server is running on port 3000')
});
