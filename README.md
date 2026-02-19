# 🧧 Bốc Lì Xì Tết 2025

Trò chơi bốc lì xì may mắn với hệ thống mệnh giá ẩn và admin dashboard.

---

## 📁 Cấu trúc thư mục

```
lixì-web/
├── index.html      ← Trang chơi chính
├── style.css       ← CSS trang chính
├── main.js         ← Logic game (phân phối lì xì, mở ô, confetti...)
├── admin.css       ← CSS admin dashboard
├── admin.js        ← Logic admin (đăng nhập, thống kê, quản lý...)
├── admin/
│   └── index.html  ← Trang admin (truy cập qua /admin)
└── README.md
```

---

## 🎮 Cách hoạt động

### Trang người chơi (`/`)
- 20 ô phong bì ngẫu nhiên, mệnh giá hiển thị **1k – 20k**
- Click vào ô để bốc → animation + modal công bố mệnh giá
- Confetti, hoa rơi, nhạc mừng

### Mệnh giá ẩn (Admin only)
- **2 ô ngẫu nhiên** trong 20 ô có mệnh giá thực là **50k** và **100k**
- Người chơi vẫn thấy mệnh giá 1–20k bình thường
- Khi mở ô đặc biệt → hệ thống gợi ý truy cập `/admin`

### Admin Dashboard (`/admin`)
- Bảo vệ bằng đăng nhập
- Xem mệnh giá thực của tất cả ô
- Thống kê, biểu đồ, xuất CSV
- Quản lý trạng thái từng ô

---

## 🔐 Đăng nhập Admin

| Trường | Giá trị |
|--------|---------|
| Username | `admin` |
| Password | `lixì2025` |

> ⚠️ **Đổi mật khẩu** trong file `admin.js`, dòng:
> ```js
> password: 'lixì2025',
> ```

---

## 🚀 Cách chạy

### Option 1: Live Server (VS Code)
```bash
# Cài extension Live Server
# Click "Go Live" ở góc dưới phải VS Code
```

### Option 2: Python HTTP Server
```bash
cd lixì-web
python -m http.server 8000
# Truy cập: http://localhost:8000
# Admin:    http://localhost:8000/admin
```

### Option 3: Node.js
```bash
npx serve .
```

### Option 4: Deploy lên hosting
- Kéo thả toàn bộ thư mục lên **Netlify**, **Vercel**, hoặc **GitHub Pages**
- Route `/admin` sẽ tự động trỏ vào `admin/index.html`

---

## ⚙️ Tùy chỉnh

### Đổi số lượng ô
```js
// main.js
const CONFIG = {
  totalEnvelopes: 20,    // ← Đổi số lượng ô
  ...
}
```

### Đổi mệnh giá đặc biệt
```js
// main.js
specialValues: [50, 100],  // ← Mệnh giá ẩn (đơn vị: nghìn đồng)
```

### Đổi mệnh giá hiển thị
```js
// main.js
displayValues: [1,2,2,3,3,5,5,5,10,10,10,10,15,15,20,20,20,20,20,20],
```

---

## 📦 Công nghệ

- HTML5 + CSS3 + Vanilla JavaScript (ES6+)
- Google Fonts: Ma Shan Zheng, Noto Serif, JetBrains Mono
- localStorage để lưu trạng thái game
- sessionStorage để quản lý phiên admin
- Không cần framework, không cần backend

---

*Chúc mừng năm mới 🧧 · Tấn tài tấn lộc · Vạn sự như ý*
