import fetch from "node-fetch";
import nodemailer from "nodemailer";

// 要監控的商品頁
const url = "https://www.chromehearts.com/scarf/cemetery-cross-silk-scarf/196366O44XXX060.html";

// 讀取環境變數
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;
const LINE_TOKEN = process.env.LINE_TOKEN; // 可選

// --- Email 通知 ---
async function sendEmailNotification() {
  if (!EMAIL_USER || !EMAIL_PASS || !NOTIFY_EMAIL) {
    console.log("⚠️ 未設定 Email 環境變數，略過寄信");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Stock Monitor" <${EMAIL_USER}>`,
    to: NOTIFY_EMAIL,
    subject: "🎉 Chrome Hearts 丝巾補貨啦！",
    text: `商品可能已經重新上架，快檢查：${url}`,
  });

  console.log("📧 Email 通知已發送");
}

// --- Line Notify 通知 ---
async function sendLineNotification() {
  if (!LINE_TOKEN) {
    console.log("⚠️ 未設定 LINE_TOKEN，略過 Line 推播");
    return;
  }

  await fetch("https://notify-api.line.me/api/notify", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LINE_TOKEN}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      message: `🎉 Chrome Hearts 丝巾可能補貨！\n${url}`,
    }),
  });

  console.log("📲 Line 通知已發送");
}

// --- 核心檢查 ---
async function checkStock() {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });
    const text = await res.text();

    if (!text.includes("Sold Out")) {
      console.log("✅ 商品可能上架，發送通知！");
      await sendEmailNotification();
      // await sendLineNotification();
    } else {
      console.log("❌ 目前還是缺貨狀態");
      await sendEmailNotification();
    }
  } catch (err) {
    console.error("🚨 檢查時發生錯誤：", err);
  }
}

// 每 10 分鐘檢查一次
setInterval(checkStock, 10 * 60 * 1000);

// 啟動時先檢查一次
checkStock();
