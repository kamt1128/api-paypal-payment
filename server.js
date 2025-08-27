import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const PAYPAL_API = process.env.PAYPAL_API;

// ✅ Obtener token de acceso
async function generateAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString("base64");

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const data = await response.json();
  console.log("Access Token:", data);
  return data.access_token;
}

// ✅ Crear orden
app.post("/api/paypal/create-order", async (req, res) => {
  try {
    const { amount } = req.body;
    const accessToken = await generateAccessToken();

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: "USD", value: amount }
          }
        ]
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error al crear orden:", err);
    res.status(500).json({ error: "Error creando la orden" });
  }
});

// ✅ Capturar orden
app.post("/api/paypal/capture-order", async (req, res) => {
  try {
    const { orderId } = req.body;
    const accessToken = await generateAccessToken();

    const response = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        }
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error al capturar orden:", err);
    res.status(500).json({ error: "Error capturando la orden" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server PayPal corriendo en http://localhost:${PORT}`);
});
