// ===============================
// EAZY APPLY TRACKER DASHBOARD
// ===============================

// Initialize Supabase client
const supabase = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

// -------------------------------
// Upload & preview Excel + save to Supabase
// -------------------------------
document.getElementById("upload-btn").addEventListener("click", async () => {
  const fileInput = document.getElementById("excelFile");
  const file = fileInput.files[0];
  if (!file) return alert("Please choose a file first.");

  const reader = new FileReader();
  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length < 2) {
      alert("No data found in file.");
      return;
    }

    // ---- PREVIEW (first 6 rows)
    const table = document.getElementById("excelPreview");
    table.innerHTML = "";
    jsonData.slice(0, 6).forEach((row) => {
      const tr = document.createElement("tr");
      row.forEach((cell) => {
        const td = document.createElement("td");
        td.textContent = cell ?? "";
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    document.getElementById("preview-section").style.display = "block";

    // ---- TRANSFORM rows to match DB columns (A–E → fields)
    const rows = jsonData.slice(1);
    const emailFromLogin = localStorage.getItem("loggedInEmail") || null;

    const toInsert = rows
      .filter(r => r.some(c => c && String(c).trim() !== ""))
      .map((r) => ({
        user_email: emailFromLogin,
        name: (r[0] || "").toString().trim(),
        company: (r[1] || "").toString().trim(),
        role: (r[2] || "").toString().trim(),
        applied_date: (r[3] || "").toString().trim(),
        email: (r[4] || "").toString().trim(),
        follow_up: "",
        response: "",
        interview: "",
        source: "",
        notes: ""
      }));

    if (!toInsert.length) {
      alert("No valid rows to import.");
      return;
    }

    const { data: inserted, error } = await supabase
      .from("applications")
      .insert(toInsert)
      .select("id");

    if (error) {
      console.error(error);
      alert("Error saving to database. Check console.");
      return;
    }

    alert(`Imported ${inserted.length} rows successfully.`);
    await loadStats();
  };

  reader.readAsArrayBuffer(file);
});

// -------------------------------
// Load real metrics from Supabase and update cards
// -------------------------------
async function loadStats() {
  const { data, error } = await supabase
    .from("applications")
    .select("follow_up, response, interview");

  if (error) {
    console.error(error);
    return;
  }

  const totalApps = data.length;
  const followUps = data.filter(r => !r.follow_up || r.follow_up.trim() === "").length;
  const responses = data.filter(r => r.response && r.response.trim() !== "").length;
  const interviews = data.filter(
    r => r.interview && r.interview.toLowerCase().includes("yes")
  ).length;

  const cards = document.querySelectorAll(".card p");
  if (cards.length >= 4) {
    cards[0].textContent = totalApps;
    cards[1].textContent = followUps;
    cards[2].textContent = responses;
    cards[3].textContent = interviews;
  }
}

// -------------------------------
// Search & Filter
// -------------------------------
document.getElementById("search-btn").addEventListener("click", async () => {
  const term = document.getElementById("searchInput").value.trim();
  const status = document.getElementById("statusFilter").value.trim();

  let query = supabase.from("applications").select("*");

  if (term) {
    query = query.or(`company.ilike.%${term}%,role.ilike.%${term}%`);
  }
  if (status) {
    query = query.eq("follow_up", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Search error:", error);
    alert("Search failed. Check console.");
    return;
  }

  const table = document.getElementById("excelPreview");
  table.innerHTML = "";

  if (!data.length) {
    table.innerHTML = "<tr><td>No matching results found.</td></tr>";
    document.getElementById("preview-section").style.display = "block";
    return;
  }

  // Render filtered rows
  data.forEach((row) => {
    const tr = document.createElement("tr");
    [
      row.name,
      row.company,
      row.role,
      row.applied_date,
      row.email,
      row.follow_up,
      row.response,
      row.interview
    ].forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = cell ?? "";
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  document.getElementById("preview-section").style.display = "block";
});

// -------------------------------
// Save login email from index.html
// -------------------------------
(function persistLoginEmail() {
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");
  if (email) localStorage.setItem("loggedInEmail", email.toLowerCase());
})();

// -------------------------------
// Init metrics on page load
// -------------------------------
window.addEventListener("DOMContentLoaded", loadStats);
