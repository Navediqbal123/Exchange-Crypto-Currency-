import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Root check
app.get("/", (req, res) => {
  res.send("Currency Converter Backend is working! Use /currency");
});

// Currency conversion route
app.get("/currency", async (req, res) => {
  try {
    const { from, to, amount } = req.query;

    if (!from || !to || !amount) {
      return res.status(400).json({ error: "Please provide from, to, and amount" });
    }

    const apiUrl = `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amount}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    res.json({
      from,
      to,
      amount,
      rate: data.info.rate,
      result: data.result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching currency data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});