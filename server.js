// ✅ Import dependencies
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Default route
app.get("/", (req, res) => {
  res.send("🚀 Backend Live! Routes: /currencies | /convert | /chat");
});

// ✅ Fetch all available currencies
app.get("/currencies", async (req, res) => {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await response.json();

    if (!data || data.result !== "success") {
      return res.status(500).json({ error: "Failed to fetch currency list" });
    }

    const currencies = Object.keys(data.rates);
    res.json({ total: currencies.length, currencies });
  } catch (error) {
    console.error("❌ Currency Error:", error);
    res.status(500).json({ error: "Server error while fetching currencies" });
  }
});

// ✅ Currency Conversion Route
app.get("/convert", async (req, res) => {
  try {
    const { from, to, amount } = req.query;

    if (!from || !to || !amount) {
      return res.status(400).json({ error: "Please provide from, to, and amount" });
    }

    const apiUrl = `https://open.er-api.com/v6/latest/${from.toUpperCase()}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || data.result !== "success") {
      return res.status(500).json({ error: "Failed to fetch currency data" });
    }

    const rate = data.rates[to.toUpperCase()];
    if (!rate) {
      return res.status(400).json({ error: `Currency code ${to} not found` });
    }

    const convertedAmount = (amount * rate).toFixed(2);

    res.json({
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      amount,
      rate,
      convertedAmount,
      last_update: data.time_last_update_utc,
    });
  } catch (error) {
    console.error("❌ Conversion Error:", error);
    res.status(500).json({ error: "Server error while converting currency" });
  }
});

// ✅ Chatbot Route (Gemini AI)
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(message);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error("❌ Chatbot Error:", error);
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
