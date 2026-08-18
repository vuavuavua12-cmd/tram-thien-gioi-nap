# Trảm Thiên Giới - Web nạp payOS (Vercel)

## Cách dùng ngắn nhất

1. Tải ZIP và giải nén.
2. Đưa nguyên thư mục lên GitHub.
3. Vào Vercel -> Add New -> Project -> chọn repository.
4. Trong Settings -> Environment Variables thêm:
   - PAYOS_CLIENT_ID
   - PAYOS_API_KEY
   - PAYOS_CHECKSUM_KEY
   - VND_PER_THAN_THACH = 1000
5. Deploy lại.
6. Mở `https://TEN-WEB-CUA-BAN.vercel.app/api/health`.
   Nếu thấy `"payosConfigured": true` là web đã đọc được key.
7. Webhook payOS sẽ là:
   `https://TEN-WEB-CUA-BAN.vercel.app/api/payos-webhook`

## QUAN TRỌNG

Bản này tạo thanh toán payOS được, nhưng CHƯA tự cộng Thần Thạch.
Lý do: cần lưu bền vững mapping `orderCode -> username` và plugin Minecraft phải
chống cộng trùng theo `orderCode`.

Không nên mở nạp tiền thật cho người chơi trước khi phần này được nối xong.

## Key payOS

Không ghi key vào code và không upload file `.env` lên GitHub.
Nhập key trực tiếp trong Vercel Environment Variables.

## Tỷ lệ

Mặc định:
`VND_PER_THAN_THACH=1000`

Tức:
- 1.000đ = 1 Thần Thạch
- 10.000đ = 10 Thần Thạch
- 100.000đ = 100 Thần Thạch
