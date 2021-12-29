const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const config = require('./config/key');
const { auth} = require("./middleware/auth");
const { User } = require("./models/User");

//application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));

//application/json
app.use(bodyParser.json());

app.use(cookieParser());

const mongoose = require('mongoose')
const res = require('express/lib/response');
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true, useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err))

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/api/hello', (req, res) => {    
    res.send("Hello Hello")
})

app.post('/api/users/register', (req, res) => {
    // when you register, get data from client and add to database
    
    const user = new User(req.body);

    user.save((err, userInfo) => {
        if(err) return res.json({ success: false, err })
        return res.status(200).json({
            success: true
        })
    })
})

app.post('/api/users/login', (req, res) => {
    
    console.log('ping')
    // find email from db
    User.findOne({ email: req.body.email }, (err, user) => {
        
        console.log('user', user)
        if(!user) {
            return res.json({
                loginSuccess: false,
                messge: "No user"
            })
        }
        // if email is in db, check password is correct
        user.comparePassword(req.body.password, (err, isMatch) => {
            console.log('err',err)
            console.log('isMatch',isMatch)
            
            if(!isMatch)
                return res.json({ loginSuccess: false, message: "wrong password"})
            
            // if password is correct, generate token
            user.generateToken((err, user) => {
                if(err) return res.status(400).send(err);

                // save token where cookies
                res.cookie("x_auth", user.token) 
                .status(200)
                .json({ loginSuccess: true, userId: user._id})
            })
        })
    })
})
// role 1 -> admin 
// role 2 -> admin for a department
// role 0 -> normal user  
app.get('/api/users/auth', auth, (req, res) => {
    // 여기까지 미들웨어를 통과해 왔다는 이야기는 Authentication 이 true
    res.status(200).json({
        _id: req.user._id,
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        image: req.user.image
    })
})

app.get('/api/users/logout', auth, (req, res) => {
    User.findOneAndUpdate({ _id: req.user._id}, 
        { token: "" }
        , (err, user) => {
            if (err) return res.json({ success: false, err });
            return res.status(200).send({
                success: true
            })
        })
})
const port = 5000

app.listen(port, () => console.log(`Example app listening on port ${port}!`))