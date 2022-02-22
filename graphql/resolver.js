const User = require("../models/user");
const Post = require("../models/post");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const {throwError} = require("../helpers/error");
const {validationError} = require("../helpers/error");

module.exports = {
  signup: async function ({userInput}) {
    const firstName = userInput.firstName;
    const email = userInput.email;
    const password = userInput.password;

    const errors = [];
    if (!validator.isEmail(email)) {
      errors.push({message: "Invalid email."});
    }
    if (validator.isEmpty(password) || !validator.isLength(password, {min: 5})) {
      errors.push({message: "Password too short. Make sure it is at least 5 characters long."});
    }
    validationError(errors);

    const existingUser = await User.findOne({email: email});
    if (existingUser) {
      throwError("Email already being used. Please, pick another one.", 401);
    }

    const hashedPw = await bcrypt.hash(password, 12);
    const user = new User({
      firstName: firstName,
      email: email,
      password: hashedPw,
    });
    const createdUser = await user.save();
    return {...createdUser._doc, _id: createdUser._id.toString()};
  },

  login: async function ({email, password}) {
    const user = await User.findOne({email: email});
    if (!user) {
      throwError("No user found.", 404);
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      throwError("Password is incorrect.", 422);
    }

    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      `${process.env.JWT_SECRET}`,
      {expiresIn: "1h"}
    );

    return {token: token, userId: user._id.toString()};
  },

  posts: async function (_, req) {
    if (!req.isAuth) {
      throwError("Not authenticated.", 401);
    }

    const posts = await Post.find().sort({createdAt: -1}).populate("creator");

    return {
      posts: posts.map((post) => {
        return {
          ...post._doc,
          _id: post._id.toString(),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        };
      }),
    };
  },

  post: async function ({id}, req) {
    if (!req.isAuth) {
      throwError("Not authenticated.", 401);
    }

    const post = await Post.findById(id).populate("creator");
    if (!post) {
      throwError("No post found.", 404);
    }

    return {...post._doc, _id: post._id.toString(), createdAt: post.createdAt.toISOString(), updatedAt: post.updatedAt.toISOString()};
  },

  addPost: async function ({content}, req) {
    if (!req.isAuth) {
      throwError("Not authenticated.", 401);
    }

    const errors = [];
    if (validator.isEmpty(content)) {
      errors.push({message: "Enter a valid post."});
    }
    validationError(errors);

    const user = await User.findById(req.userId);
    if (!user) {
      throwError("User not found", 404);
    }

    const post = new Post({
      content: content,
      creator: user,
    });
    const savedPost = await post.save();
    user.posts.push(savedPost);
    await user.save();

    return {
      ...savedPost._doc,
      _id: savedPost._id.toString(),
      createdAt: savedPost.createdAt.toISOString(),
      updatedAt: savedPost.updatedAt.toISOString(),
    };
  },

  updatePost: async function ({id, content}, req) {
    if (!req.isAuth) {
      throwError("Not authenticated.", 401);
    }

    const errors = [];
    if (validator.isEmpty(content)) {
      errors.push({message: "Enter a valid post."});
    }
    validationError(errors);

    const post = await Post.findById(id);
    if (!post) {
      throwError("No post found.", 404);
    }
    if (post.creator.toString() !== req.userId.toString()) {
      throwError("Cannot edit post.", 403);
    }

    post.content = content;
    const updatedPost = await post.save();
    return {...updatedPost._doc, _id: updatedPost._id.toString(), createdAt: updatedPost.createdAt.toISOString(), updatedAt: updatedPost.updatedAt.toISOString()};
  },

  deletePost: async function ({id}, req) {
    if (!req.isAuth) {
      throwError("Not authenticated", 401);
    }

    const user = await User.findById(req.userId);
    const post = await Post.findById(id);

    if (!user) {
      throwError("No user found.", 404);
    }

    if (!post) {
      throwError("No post found.", 404);
    }

    if (post.creator.toString() !== req.userId.toString()) {
      throwError("Cannot delete post.", 403);
    }

    await Post.findByIdAndRemove(id);
    user.posts.pull(id);
    await user.save();

    return true;
  },
};
