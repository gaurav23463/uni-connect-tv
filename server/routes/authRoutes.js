import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Register/Login
router.post("/auth", async (req, res) => {
  const { email, password, department } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, password, department });
    } else {
      const isMatch = await user.matchPassword(password);
      if (!isMatch) return res.status(401).json({ message: "Invalid Password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, email: user.email, department: user.department });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
