import express from "express";
const router = express.Router();

router.post("/report", (req, res) => {
  const { userEmail, reason } = req.body;
  console.log(`🚨 Report received for ${userEmail}: ${reason}`);
  res.json({ message: "User reported successfully" });
});

router.post("/end", (req, res) => {
  res.json({ message: "Chat ended" });
});

export default router;
