import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// Allowed currencies (jitni chaho add kar sakte ho)
const allowedCurrencies = ["USD", "INR", "EUR", "GBP", "CAD", "AUD"];

app.get("/currency", async (req, res) => {
  try {
    const { from, to, amount } = req.query;

    if (!allowedCurrencies.includes(from) || !allowedCurrencies.includes(to)) {
      return res.status(400).json({ error: "Currency not supported" });
    }

    // Free exchange API se rates la rahe hain
    const response = await fetch(
      `https://open.er-api.com/v6/latest/${from}`
    );
    const data = await response.json();

    if (!data.rates[to]) {
      return res.status(400).json({ error: "Rate not available" });
    }

    const rate = data.rates[to];
    const converted = (amount * rate).toFixed(2);

    res.json({
      from,
      to,
      amount,
      rate,
      converted,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
