const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const {nanoid} = require('nanoid');
const verifyToken = require('./verifyToken');

const app = express();
dotenv.config();

// Middlewares
app.use(express.json());
app.use(cors());

/**
 * Firestore Configuration
 */
console.log("Connecting to Database...");
const serviceAccount = require('./short-me-65f93-firebase-adminsdk-md8ke-8fc91ad414.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://short-me-65f93.firebaseio.com"
});

// Firestore Database
var db = admin.database();
var ref = db.ref("short-me");
ref.once("value", (snapshot) => {
    console.log("Connected");
});

// Login as admin
app.use('/login', async (req, res) => {
    const {user, pass} = req.query;
    await ref.once("value", (snapshot) => {
        const userData = snapshot.val().admins[user];
        if(!userData){
            res.json({
                error: 'User doesnt exist'
            });
        }

        bcrypt.compare(pass, userData.password, (err,bres) => {
            if(!bres){
                res.json({error:"wrong username or password"});
            }
        });

        const token = jwt.sign(
            {_id:userData._id},
            process.env.TOKEN_SECRET
        );
        res.header('auth-token', token).send();

    });

});


// Register as admin
app.use('/asdfghjkl/zxcvbnm/reg/admin',async (req, res) => {
    const {user, pass, email} = req.query;
    const salt =  bcrypt.genSaltSync(10);
    const password = bcrypt.hashSync(pass, salt);
    const _id = nanoid();

    // Add to database
    await ref.child('admins').child(user).set({
        _id,
        user,
        password,
        email
    })

    await ref.once("value", (snapshot) => {
        res.json(snapshot.val().admins);
    });
    
});


// View URLS
app.use('/urls', verifyToken, (req,res) => {
    ref.once("value", (snapshot) => {
        res.json(snapshot.val().urls);
    });
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Listening at "+PORT);
});