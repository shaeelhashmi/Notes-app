import passport,{redirectLogin,redirectHome} from './passport.js';
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import path from "path";
import dotenv from 'dotenv';
import { fileURLToPath } from "url";
import CreateUser,{storage,AddNote,getUserNote} from './Mongoose.js';
import mongoose from 'mongoose';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.static('./dist'));
app.set('trust proxy', 1) // trust first proxy
app.use(session({
secret: process.env.Secret,
resave: false,
saveUninitialized: true,
cookie: { secure: false,maxAge: 6000000},
store: storage
}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

app.get("/",redirectHome, (req, res) => {
return res.sendFile(path.join(__dirname, 'dist/index.html'))
})
app.get("/notes/:id",redirectHome, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'))
})
//api for getting notes
app.post("/notes",async(req,res)=>{
  try{
  const {id}=req.body;
  console.log(req.user.username)
  const notes=await getUserNote(req.user.username);
  console.log(notes,"fahdj")
  const note=notes.filter((note)=>note._id==id);
  console.log(note,"fahdj")
  return res.status(200).json(note);
  }catch(err)
  {
    console.log(err)
    return res.status(500).json({message:"Internal server error"})
  }
})
app.post("/logout", (req, res) => {
req.session.destroy();
res.json({message:"Logged out"});
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
  app.get('/auth/google/callback',
  passport.authenticate('google', { scope: ['profile','email']  }),
  function(req, res) {
  // Successful authentication, redirect home.
  res.redirect('/');
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
    })(req, res, next)
});
app.get("/checklogin",(req,res)=>{
  try
  {
  if(!req.user&&!req.user.username)
    {
      res.status(500).send("Not logged in")
    }
  res.status(200).send(req.user)
  }
  catch(e)
  {
    res.status(500).send("Not logged in")
  }
})
app.post("/addnote",(req,res)=>{
  console.log(req.body);
  const user=req.user;
  const date=new Date();
  AddNote(user.username,req.body.title,req.body.description,date,req.body.category)
  res.status(200).json({message:"Note added"})
})
//Registering user
app.post("/register", (req, res) => {
  CreateUser(req.body.username,req.body.password,res);
});
app.get("/userdata",async (req,res)=>{
  try{
  const data=await getUserNote(req.user.username);
  return res.status(200).json(data);
  }
  catch(e)
  {
    return res.status(500).json({message:"Internal server error"})
  }
})
app.listen(3000, async() => {
  try
  {
  await mongoose.connect(process.env.ConnectionPort)
console.log('Server is running on port 3000')
  }
  catch(e)
  {
   console.log(err)
  }
});