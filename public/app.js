const emailInput = document.getElementById("email");
const loginBtn = document.getElementById("login-btn");

emailInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleLogin();
});
loginBtn.addEventListener("click", handleLogin);

function handleLogin() {
  const email = emailInput.value.trim().toLowerCase();
  if (!email) return alert("Please enter your email.");

  // In future: redirect to CRM dashboard or Excel upload page
  alert(`Welcome, ${email}! Login successful.`);
}
