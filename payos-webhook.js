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

function signMinecraftRequest(timestamp, body, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
}

async function sendToMinecraft(data) {
  const url = process.env.MINECRAFT_CREDIT_URL;
  const secret = process.env.MINECRAFT_SHARED_SECRET;

  // Chưa nối plugin thì chỉ xác minh webhook, chưa cộng Thần Thạch.
  if (!url || !secret) {
    console.log("Webhook hợp lệ, nhưng chưa cấu hình Minecraft credit endpoint.", data);
    return { skipped: true };
  }

  const vndPerThanThach = Math.max(
    1,
    Number(process.env.VND_PER_THAN_THACH || 1000)
  );

  const payload = {
    orderCode: Number(data.orderCode),
    amount: Number(data.amount),
    thanThach: Math.floor(Number(data.amount) / vndPerThanThach),
    reference: String(data.reference || "")
  };

  /*
   * Username không nằm trong webhook payOS mặc định.
   * Khi nối plugin production, backend cần lưu mapping
   * orderCode -> username trong DB bền vững.
   *
   * Vì vậy bản ZIP này KHÔNG tự cộng Thần Thạch thật
   * cho tới khi phần lưu đơn được nối hoàn chỉnh.
   */
  throw new Error(
    "Chưa có DB mapping orderCode -> username. Không cộng tiền để tránh cộng sai tài khoản."
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payOS = getPayOS();
    const data = payOS.webhooks.verify(req.body);

    if (String(data.code) !== "00") {
      return res.status(200).json({ ok: true });
    }

    try {
      await sendToMinecraft(data);
    } catch (creditError) {
      console.error("MINECRAFT CREDIT NOT ENABLED:", creditError.message);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("INVALID PAYOS WEBHOOK", error);
    return res.status(400).json({ error: "Invalid webhook" });
  }
}
