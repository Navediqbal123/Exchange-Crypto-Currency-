import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Default test route
app.get("/", (req, res) => {
  res.send("✅ Currency API is live! Use /convert?from=USD&to=INR&amount=10 or /currencies to view all supported currencies.");
});

// ✅ Route to fetch all available currencies
app.get("/currencies", async (req, res) => {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await response.json();

    if (data.result !== "success") {
      return res.status(500).json({ error: "Failed to fetch currency list" });
    }

    const currencies = Object.keys(data.rates);
    res.json({ total: currencies.length, currencies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Route to convert currency
app.get("/convert", async (req, res) => {
  try {
    const { from, to, amount } = req.query;

    if (!from || !to || !amount) {
      return res.status(400).json({ error: "Please provide from, to, and amount" });
    }

    const apiUrl = `https://open.er-api.com/v6/latest/${from.toUpperCase()}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.result !== "success") {
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
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
