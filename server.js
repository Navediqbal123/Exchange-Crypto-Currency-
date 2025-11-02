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
  res.send("🚀 Backend Live! Routes: /currencies | /convert | /chat | /weather | /distance | /map");
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

// ✅ Weather Route (OpenWeather API)
app.get("/weather", async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ error: "City name is required" });
    }

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.cod !== 200) {
      return res.status(500).json({ error: data.message });
    }

    res.json({
      city: data.name,
      temperature: data.main.temp,
      condition: data.weather[0].description,
      humidity: data.main.humidity,
      wind_speed: data.wind.speed,
    });
  } catch (error) {
    console.error("❌ Weather Error:", error);
    res.status(500).json({ error: "Server error while fetching weather data" });
  }
});

// ✅ Route Distance (ORS API)
app.get("/distance", async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: "Start and end locations are required" });
    }

    const apiUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${process.env.ORS_API_KEY}&start=${start}&end=${end}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || !data.features) {
      return res.status(500).json({ error: "Failed to fetch route data" });
    }

    const distanceKm = (data.features[0].properties.summary.distance / 1000).toFixed(2);
    const durationMin = (data.features[0].properties.summary.duration / 60).toFixed(2);

    res.json({
      start,
      end,
      distance_km: distanceKm,
      duration_minutes: durationMin,
      geometry: data.features[0].geometry,
    });
  } catch (error) {
    console.error("❌ ORS Distance Error:", error);
    res.status(500).json({ error: "Error fetching distance data" });
  }
});

// ✅ Global Map Data Route (Leaflet + ORS)
app.get("/map", async (req, res) => {
  try {
    res.json({
      message: "Use this endpoint with Leaflet.js on frontend to render global map data using ORS routes.",
      example_usage: "https://api.openrouteservice.org/v2/directions/driving-car?api_key=YOUR_KEY&start=77.5946,12.9716&end=72.8777,19.0760"
    });
  } catch (error) {
    res.status(500).json({ error: "Map endpoint error" });
  }
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
