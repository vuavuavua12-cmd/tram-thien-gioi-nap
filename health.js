export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    payosConfigured: Boolean(
      process.env.PAYOS_CLIENT_ID &&
      process.env.PAYOS_API_KEY &&
      process.env.PAYOS_CHECKSUM_KEY
    )
  });
}
