// Initialize Supabase client
const supabase = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

// Upload & preview Excel + save to Supabase
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

    // Get raw array with header row
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
    // We'll assume columns A..E are: name, company, role, applied_date, email
    const rows = jsonData.slice(1); // drop header row
    const emailFromLogin = localStorage.getItem("loggedInEmail") || null;

    const toInsert = rows
      .filter(r => r.some(c => c !== undefined && c !== null && String(c).trim() !== "")) // skip empty rows
      .map((r) => ({
        user_email: emailFromLogin,
        name: (r[0] || "").toString().trim(),
        company: (r[1] || "").toString().trim(),
        role: (r[2] || "").toString().trim(),
        applied_date: (r[3] || "").toString().trim(), // keep as text
        email: (r[4] || "").toString().trim(),

        follow_up: "",    // empty for now
        response: "",     // empty for now
        interview: "",    // empty for now
        source: "",
        notes: ""
      }));

    if (!toInsert.length) {
      alert("No valid rows to import.");
      return;
    }

    // ---- SAVE to Supabase
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
    await loadStats(); // refresh metric cards
  };

  reader.readAsArrayBuffer(file);
});

// Load real metrics from Supabase and update cards
async function loadStats() {
  // Pull minimal fields to compute metrics on client
  const { data, error } = await supabase
    .from("applications")
    .select("follow_up, response, interview");

  if (error) {
    console.error(error);
    return;
  }

  const totalApps = data.length;
  const followUps = data.filter(
    r => !r.follow_up || String(r.follow_up).trim() === ""
  ).length;
  const responses = data.filter(
    r => r.response && String(r.response).trim() !== ""
  ).length;
  const interviews = data.filter(
    r => r.interview && String(r.interview).toLowerCase().includes("yes")
  ).length;

  // Update the stat cards in order
  document.querySelectorAll(".card p")[0].textContent = totalApps;
  document.querySelectorAll(".card p")[1].textContent = followUps;
  document.querySelectorAll(".card p")[2].textContent = responses;
  document.querySelectorAll(".card p")[3].textContent = interviews;
}

// OPTIONAL: remember the email from the login page (index.html)
(function persistLoginEmail() {
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");
  if (email) localStorage.setItem("loggedInEmail", email.toLowerCase());
})();

// Load metrics at startup
window.addEventListener("DOMContentLoaded", loadStats);
