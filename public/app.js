const emailInput = document.getElementById("email");
const sendBtn = document.getElementById("send-otp");
const otpSection = document.getElementById("otp-section");
const otpInput = document.getElementById("otp-input");
const verifyBtn = document.getElementById("verify-otp");

// Enter key shortcuts
emailInput.addEventListener("keydown", e => { if (e.key === "Enter") sendOTP(); });
otpInput.addEventListener("keydown", e => { if (e.key === "Enter") verifyOTP(); });

sendBtn.addEventListener("click", sendOTP);
verifyBtn.addEventListener("click", verifyOTP);

// We’ll set this after Step 2 (Make.com)
const MAKE_WEBHOOK_URL = "REPLACE_WITH_MAKE_WEBHOOK_URL";

async function sendOTP() {
  const email = emailInput.value.trim().toLowerCase();
  if (!email) return alert("Enter your email");
  try {
    const res = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    if (!res.ok) throw new Error("Failed");
    const data = await res.json(); // expects { otpToken } or { otp } from Make
    // Store expected OTP client-side for simple verify (single-user)
    window.__expectedOTP = data.otp || data.otpToken;
    otpSection.style.display = "block";
    alert("OTP sent! Check your inbox.");
  } catch (e) {
    alert("Error sending OTP");
  }
}

function verifyOTP() {
  const entered = (otpInput.value || "").trim();
  if (!entered) return alert("Enter the OTP");
  if (String(entered) === String(window.__expectedOTP)) {
    alert("Login successful!");
    // next screen will load in later steps
  } else {
    alert("Invalid or expired OTP");
  }
}
