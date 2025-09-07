import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Default route for testing
app.get("/", (req, res) => {
  res.send("✅ Backend is working! Use /convert?from=USD&to=INR&amount=10");
});

// Currency conversion route
app.get("/convert", async (req, res) => {
  try {
    const { from, to, amount } = req.query;

    if (!from || !to || !amount) {
      return res.status(400).json({ error: "Please provide from, to and amount" });
    }

    // Real-time currency API
    const apiUrl = `https://open.er-api.com/v6/latest/${from}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.result !== "success") {
      return res.status(500).json({ error: "Failed to fetch currency data" });
    }

    const rate = data.rates[to];
    if (!rate) {
      return res.status(400).json({ error: `Currency code ${to} not found` });
    }

    const convertedAmount = (amount * rate).toFixed(2);

    res.json({
      from,
      to,
      amount,
      rate,
      convertedAmount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
