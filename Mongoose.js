import mongoose from "mongoose";
import MongoDBStore from "connect-mongodb-session";
import bcrypt from "bcryptjs";
import session from 'express-session';
import dotenv from "dotenv";
dotenv.config();
const NoteSchema = new mongoose.Schema({
    title: String,
    content: String,
    timeOfCompletion: Date
});
const Category=new mongoose.Schema({
    category:
    {type:String},
    Notes:[NoteSchema]

});
const store = MongoDBStore(session);
const storage = new store({
    uri: process.env.ConnectionPort,
    collection: "sessions"
});

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: false
    },
    email: {
        type: String || null,
        required: false
    },
    Notes: {
       type: [Category],
        
    }
});
const UserData = mongoose.model("UserData", UserSchema);

const CreateUser = async (username, password, res) => {
    if (await UserData.findOne({ username: username })) {
        return res.status(200).json({ message: "Username already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    const User = new UserData({
        username: username,
        password: password,
        email: null
    });
    await User.save();
    return res.status(200).json({ message: "User Created" });
};

const verify = async (username, password, res) => {
    const data = await UserData.findOne({ username: username });
    if (data) {
        if (data.password == null) {
            return false;
        }
        const a = await bcrypt.compare(password, data.password);
        if (a) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

const CreateUniqueName = async (username) => {
    let data = await UserData.findOne({ username: username });
    let i = 0;
    while (data) {
        username = username + toString(i);
        data = await UserData.findOne({ username: username });
        i++;
    }
    return username;
};

const AddGoogleUser = async (username, email) => {
    username = username.split(" ").join("");
    username = username.toLowerCase();
    console.log(username);
    const Email = await UserData.findOne({ email: email });
    if (!Email) {
        username = await CreateUniqueName(username);
        const User = new UserData({
            username: username,
            password: null,
            email: email
        });
        await User.save();
    }
};const AddNote = async (username, title, content, timeOfCompletion, category) => {
    try {
        const newNote = {
            title: title,
            content: content,
            timeOfCompletion: timeOfCompletion
        };

        const user = await UserData.findOne({ username: username });
        if (!user) {
            console.log(`User with username ${username} not found.`);
            return;
        }

        const categoryIndex = user.Notes.findIndex(cat => cat.category === category);
        if (categoryIndex !== -1) {
            // Category exists, add the note to the existing category
            user.Notes[categoryIndex].Notes.push(newNote);
        } else {
            // Category does not exist, create a new category with the note
            user.Notes.push({
                category: category,
                Notes: [newNote]
            });
        }

        await user.save();
        console.log(`Note added to user ${username} in category ${category}.`);
    } catch (error) {
        console.error(`Error adding note: ${error.message}`);
    }
};

const getName= async (email) => {
    const data = await UserData.findOne({email:email});
    return data.username;
}
const getUserNote=async (username)=>{
    const data=await UserData.findOne({username:username});
    return data.Notes;
}
export default CreateUser;
export { verify, AddGoogleUser, storage, getName,AddNote,getUserNote};
