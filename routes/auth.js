const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");

const router = express.Router();

// signup
router.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully!" });

    } catch (err) {
        res.status(500).json({ message: "error creating user", error: err });
    }
});

// login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // generate JWT
        const token = jwt.sign(
            { id: user._id, username: user.username },
            "secret123",
            { expiresIn: "7d" }
        );
        res.json({ message: "login successful", token });
    } catch (err) {
        res.status(500).json({ message: "Error logging in", error: err });
    }
});

// Profile route
router.get("/profile", async (req, res) => {
  const token = req.header("auth-token");
  if (!token) {
    return res.status(401).json({ error: "Access denied" });
  }

  try {
    const decoded = jwt.verify(token, "secret123");
    const user = await User.findById(decoded.id).select("-password");

    // count total post
    const postCount = await Post.countDocuments({ author: decoded.id });

    // count total likes
    const posts = await Post.find({author:decoded.id});
    const totalLikes = posts.reduce((sum,post) => sum + (post.likes?.length || 0),0);

    res.json({
      user,
      postCount,
      totalLikes
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired, please login again" });
    }
    res.status(400).json({ error: "Invalid token" });
  }
});
module.exports = router;