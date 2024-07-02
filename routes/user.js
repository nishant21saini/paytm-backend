// backend/routes/user.js
const express = require('express');

const router = express.Router();
const zod = require("zod");
const { User, Account } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { authMiddleware } = require("../middleware");

const signupBody = zod.object({
    username: zod.string().email(),
    firstName: zod.string(),
    lastName: zod.string(),
    password: zod.string()
})

router.post("/signup", async (req, res) => {
    const { success } = signupBody.safeParse(req.body)
    if (!success) {
        return res.status(411).json({
            message: "Incorrect inputs"
        })
    }

    const existingUser = await User.findOne({
        username: req.body.username
    })

    if (existingUser) {
        return res.status(411).json({
            message: "Email already taken/user Exist"
        })
    }

    const user = await User.create({
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
    })
    const userId = user._id;

    const userbalance = 1 + Math.random() * 10000;
    console.log(userbalance);
    // console.log(userBalance);
    
    try {
        const account = await Account.create({
            userId: userId,
            balance: userbalance,
        });
        console.log('Account created successfully:', account);
    } catch (error) {
        console.error('Error creating account:', error);
    }
    

    const token = jwt.sign({
        userId,
        userbalance,
    }, JWT_SECRET);
    console.log("!!!!!!!!!!!!!!!!!!");

    console.log(req.body.username);

    console.log(userbalance);

    res.json({
        message: "User created successfully",
        token: token,
        firstName: req.body.firstName,
        userbalance:userbalance,

    })
})


const signinBody = zod.object({
    username: zod.string().email(),
    password: zod.string()
})

router.post("/signin", async (req, res) => {

    console.log("hello1");
    const { success } = signinBody.safeParse(req.body)
    if (!success) {
        return res.status(411).json({
            message: "Incorrect inputs"
        })
    }
    console.log("hello2");

    const user = await User.findOne({
        username: req.body.username,
        password: req.body.password
    });
    console.log("hello3");
    // console.log(user.username)
    if (user) {
        console.log("hello wertgyhgfdfgh");
        const account = await Account.findOne({
            userId: user._id,

        }); 
        console.log(user.username);
        console.log(account.balance);


        const token = jwt.sign({
            userId: user._id,
            username: user.username,
            // password: user.password,
            userbalance: account.balance,
            firstName: user.firstName

        }, JWT_SECRET);



        res.json({
            token,
            username: user.username,
            firstName: user.firstName,
            userbalance: account.balance,
        });
        return;

    }


    res.status(411).json({
        message: "Error while logging in"
    })
})

const updateBody = zod.object({
    password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
})

router.put("/", authMiddleware, async (req, res) => {
    const { success } = updateBody.safeParse(req.body)
    if (!success) {
        res.status(411).json({
            message: "Error while updating information"
        })
    }

    await User.updateOne(req.body, {
        id: req.userId
    })

    res.json({
        message: "Updated successfully"
    })
})

router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})

module.exports = router;