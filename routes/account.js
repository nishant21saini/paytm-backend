// backend/routes/account.js
const express = require('express');
const { authMiddleware } = require('../middleware');
const { Account } = require('../db');
const { default: mongoose } = require('mongoose');

const router = express.Router();

router.get("/balance", authMiddleware, async (req, res) => {
  try {
    const account = await Account.findOne({
      userId: req.userId,
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json({
      balance: account.balance
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/transfer", authMiddleware, async (req, res) => {
  let session = null;
  try {
    session = await mongoose.startSession();

    session.startTransaction();
    const { amount, to } = req.body;
    //Don,t allow transfer to oneself
    if (to === req.userId) {
        await session.abortTransaction();
        return res.json({ message: "Cannot Transfer to yourself!" });
      }

    console.log("@@@@@@@@@@@@@@@@");
    console.log("=============================");

    // Fetch the accounts within the transaction
    const fromAccount = await Account.findOne({ userId: req.userId }).session(session);

    if (!fromAccount) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Account not found" });
    }

    if (fromAccount.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const toAccount = await Account.findOne({ userId: to }).session(session);

    if (!toAccount) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Invalid account" });
    }

    // Perform the transfer
    await Account.updateOne({ userId: req.userId }, { $inc: { balance: -amount } }).session(session);
    await Account.updateOne({ userId: to }, { $inc: { balance: amount } }).session(session);

    // Commit the transaction
    await session.commitTransaction();
    res.json({
      message: "Transfer successful"
    });
  } catch (error) {
    console.error("Error during transfer:", error);
    if(session) await session.abortTransaction();
    res.status(500).json({ message: "Transfer failed" });
  } finally {
    if(session) session.endSession();
  }
});

module.exports = router;