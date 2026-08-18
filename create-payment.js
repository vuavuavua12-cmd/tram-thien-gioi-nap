import { PayOS } from "@payos/node";
import crypto from "node:crypto";

function getPayOS() {
  const { PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY } = process.env;

  if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
    throw new Error("Thiếu biến môi trường payOS");
  }

  return new PayOS({
    clientId: PAYOS_CLIENT_ID,
    apiKey: PAYOS_API_KEY,
    checksumKey: PAYOS_CHECKSUM_KEY,
  });
}

function validMinecraftName(name) {
  return /^[A-Za-z0-9_]{3,16}$/.test(name);
}

function makeOrderCode() {
  const seconds = Math.floor(Date.now() / 1000);
  const random = crypto.randomInt(100, 999);
  return Number(`${seconds}${random}`);
}

function getOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const username = String(req.body?.username || "").trim();
    const amount = Number(req.body?.amount);

    if (!validMinecraftName(username)) {
      return res.status(400).json({
        error: "Tên Minecraft phải dài 3-16 ký tự và chỉ gồm chữ, số hoặc dấu _."
      });
    }

    if (!Number.isInteger(amount) || amount < 1000 || amount > 10000000) {
      return res.status(400).json({
        error: "Số tiền phải từ 1.000đ đến 10.000.000đ."
      });
    }

    const vndPerThanThach = Math.max(
      1,
      Number(process.env.VND_PER_THAN_THACH || 1000)
    );

    const thanThach = Math.floor(amount / vndPerThanThach);

    if (thanThach < 1) {
      return res.status(400).json({ error: "Số tiền chưa đủ để nhận Thần Thạch." });
    }

    const orderCode = makeOrderCode();
    const origin = getOrigin(req);
    const payOS = getPayOS();

    const payment = await payOS.paymentRequests.create({
      orderCode,
      amount,
      description: `NAP ${username}`.slice(0, 25),
      items: [
        {
          name: `Than Thach ${username}`.slice(0, 50),
          quantity: 1,
          price: amount
        }
      ],
      cancelUrl: `${origin}/?cancel=1&orderCode=${orderCode}`,
      returnUrl: `${origin}/?success=1&orderCode=${orderCode}`
    });

    return res.status(200).json({
      orderCode,
      username,
      amount,
      thanThach,
      checkoutUrl: payment.checkoutUrl,
      qrCode: payment.qrCode || null
    });
  } catch (error) {
    console.error("CREATE PAYMENT ERROR", error);
    return res.status(500).json({
      error: "Không tạo được thanh toán. Kiểm tra lại cấu hình payOS."
    });
  }
}
