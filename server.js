const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 3000;

// ========================
// MIDDLEWARES
// ========================
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ========================
// CONFIGURACIÓN PAYPHONE
// ========================
const PAYPHONE_TOKEN = "NR79lzZf_Y87SPQYllHAgfRvab6qNL1gIazNi4VAhUmlS50WVz7JgDIbYpgZj6B7vrU7fQPWErn0DFtK3KB-Ka2ZQJ2OTkRf5X8dKi_Hw901uSSw0buwLzVrk1D3MYOY3dA5wyeRWoZXtZMxBTPvSqEZZ0fyf5C7z7Dt44rRkXwCEubNtDLekbpIupCLFKSLilO6ELTs4deixmzPu4m7lHB_dIMvvrf4nD-l40tXn1xpE7PXU5b1rHay11YfxcMfXFuOWHp4L9CsEG7djtV2DHDjXXepNXkuixywcTiXYBcqK3CMLNuBfY9fhQnxsXNb155UXGnV9x6Emh9zQo7Wh83lwIE";

// ========================
// CREAR PAGO (PREPARE)
// ========================
app.post("/crear-pago", async (req, res) => {
    try {
        const response = await axios.post( //request a la API de PayPhone para preparar el pago
            "https://pay.payphonetodoesposible.com/api/button/Prepare",
            {
                amount: req.body.amount,               
                amountWithoutTax: req.body.amount,
                currency: "USD",
                clientTransactionId: "TX-" + Date.now(),
                responseUrl: "http://localhost:3000/response-payphone"
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYPHONE_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );
//response.data contiene la respuesta de PayPhone con los detalles del pago, incluyendo el enlace para redirigir al usuario a la pasarela de pago.
        console.log("✅ PREPARE PAYPHONE OK:");
        console.log(response.data);

        res.json(response.data);

    } catch (error) {
        console.error("❌ ERROR EN PREPARE:");
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: "Error al crear el pago" });
    }
});


// ======================
// CONFIRMACIÓN DEL PAGO
// ======================
app.get("/response-payphone", async (req, res) => {

    const paymentId = req.query.id;
    const clientTxId = req.query.clientTransactionId;

    if (!paymentId || !clientTxId) {
        return res.send("❌ No se recibieron los datos necesarios para confirmar el pago");
    }

    

    try {
        const confirmResponse = await axios.post(
            "https://pay.payphonetodoesposible.com/api/button/V2/Confirm",
            {
                id: paymentId,
                clientTxId: clientTxId
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYPHONE_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = confirmResponse.data;

        console.log("✅ CONFIRMACIÓN PAYPHONE:");
        console.log(data);

        // ========================
        // VISTA FINAL
        // ========================
        
        res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Pago Exitoso</title>

<style>
* {
    box-sizing: border-box;
}
body {
    margin: 0;
    font-family: 'Segoe UI', Tahoma, sans-serif;
    background: linear-gradient(135deg, #eef2f7, #dce3ec);
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}
.card {
    background: white;
    width: 420px;
    border-radius: 18px;
    padding: 30px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    text-align: center;
}
.icon {
    width: 90px;
    height: 90px;
    background: linear-gradient(135deg, #2ecc71, #27ae60);
    border-radius: 22px;
    margin: 0 auto 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 45px;
}
h1 {
    color: #2ecc71;
    margin-bottom: 8px;
}
.subtitle {
    color: #555;
    margin-bottom: 22px;
}
.details {
    background: #ecf9f1;
    border-radius: 12px;
    padding: 18px;
    text-align: left;
    font-size: 15px;
}
.details div {
    margin-bottom: 8px;
}
.details b {
    color: #333;
}
.btn {
    display: block;
    margin-top: 25px;
    background: #e91e63;
    color: white;
    padding: 14px;
    border-radius: 30px;
    text-decoration: none;
    font-weight: bold;
}
</style>
</head>

<body>

<div class="card">
    <div class="icon">✔</div>

    <h1>¡Pago Exitoso!</h1>
    <p class="subtitle">
        Gracias por tu compra en Manta Eventos. La transacción se realizó correctamente.
    </p>

    <div class="details">
        <div><b>Monto:</b> $${(data.amount / 100).toFixed(2)}</div>
        <div><b>ID Transacción:</b> ${data.transactionId}</div>
        <div><b>Estado:</b> ${data.transactionStatus}</div>
        <div><b>Marca Tarjeta:</b> ${data.cardBrand}</div>
        <div><b>Email:</b> ${data.email}</div>
        <div><b>Código Autorización:</b> ${data.authorizationCode}</div>
    </div>

    <a href="/" class="btn">Volver a la tienda</a>
</div>

</body>
</html>
        `);

    } catch (error) {
        console.error("❌ ERROR EN CONFIRM:");
        console.error(error.response?.data || error.message);
        res.send("❌ Error al confirmar el pago");
    }
});

// ======================
// INICIAR SERVIDOR
// ======================
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});


