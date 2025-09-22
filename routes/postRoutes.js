const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");


// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.header("auth-token");
    if (!token) {
        return res.status(401).json({ error: "Access denied" });
    }

    try {
        const verified = jwt.verify(token, "secret123");
        req.user = verified;
        next();

    } catch (err) {
        return res.status(400).json({ error: "Invaid token" });
    }
};

// create a new post
router.post("/createpost", verifyToken, async (req, res) => {
    try {
        const newPost = new Post({
            title: req.body.title,
            content: req.body.content,
            author: req.user.id,   // comes from token
        });

        const savedPost = await newPost.save();
        res.json(savedPost);

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
});

// get all posts
router.get("/getallpost", async (req, res) => {
    try {
        const posts = await Post.find().populate("author", "username email");
        res.json(posts);

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
});

// get single post
router.get("/getpost/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate("author", "username email");
        res.json(post);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// update a post
router.put("/updatepost/:id", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ error: "page not found" });
        }

        // check if the logged-in user is the author
        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ error: "you can only update your own posts" });
        }

        // update fields
        post.title = req.body.title || post.title;
        post.content = req.body.content || post.content;

        const updatedPost = await post.save();
        res.json({ message: "Post updated successfully", updatedPost });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// delete post
router.delete("/deletepost/:id", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ error: "post not found" });
        }

        // check if the logged-in user is the author
        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ error: "you can only delete your own posts" });
        }

        await post.deleteOne();
        res.json({ message: "post deleed successfully" })

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// get posts of logged-in user
router.get("/myposts", verifyToken, async (req, res) => {
    try {
        console.log("Headers received:", req.headers);   // 👈 log headers
        console.log("User from token:", req.user);       // 👈 log decoded user

        const post = await Post.find({ author: req.user.id }).populate("author", "username email");
        res.json(post)

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
});

// Like / Unlike a post
router.post("/like/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user.id;

    if (post.likes.includes(userId)) {
      // Unlike
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();
    res.json({ message: "Updated successfully", likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
// module.exports = verifyToken;