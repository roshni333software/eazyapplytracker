document.getElementById("upload-btn").addEventListener("click", () => {
  const fileInput = document.getElementById("excelFile");
  const file = fileInput.files[0];
  if (!file) return alert("Please choose a file first.");

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // --- Show raw preview (first 6 rows)
    const previewTable = document.getElementById("excelPreview");
    previewTable.innerHTML = "";
    jsonData.slice(0, 6).forEach((row) => {
      const tr = document.createElement("tr");
      row.forEach((cell) => {
        const td = document.createElement("td");
        td.textContent = cell ?? "";
        tr.appendChild(td);
      });
      previewTable.appendChild(tr);
    });
    document.getElementById("preview-section").style.display = "block";

    // --- Convert to CRM structure (A–J)
    const crmData = jsonData.slice(1).map((row, index) => ({
      A: row[0] || `Lead ${index + 1}`,
      B: row[1] || "",
      C: row[2] || "",
      D: row[3] || "",
      E: row[4] || "",
      F: "",
      G: "",
      H: "",
      I: "",
      J: ""
    }));

    localStorage.setItem("crmData", JSON.stringify(crmData));
    renderCRMTable(crmData);
  };
  reader.readAsArrayBuffer(file);
});

// --- Render CRM table
function renderCRMTable(data) {
  const crmSection = document.getElementById("crm-section");
  const crmTable = document.getElementById("crmTable");
  crmTable.innerHTML = "";

  const headers = ["A","B","C","D","E","F","G","H","I","J"];
  const headerRow = document.createElement("tr");
  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    headerRow.appendChild(th);
  });
  crmTable.appendChild(headerRow);

  data.forEach(row => {
    const tr = document.createElement("tr");
    headers.forEach(h => {
      const td = document.createElement("td");
      td.textContent = row[h] ?? "";
      tr.appendChild(td);
    });
    crmTable.appendChild(tr);
  });
  crmSection.style.display = "block";
}

// --- Search filter
const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  const crmData = JSON.parse(localStorage.getItem("crmData") || "[]");
  const filtered = crmData.filter(
     r => r.A.toLowerCase().includes(term) || r.B.toLowerCase().includes(term)
  );
  renderCRMTable(filtered);
});

// --- Auto-load if data exists
window.addEventListener("DOMContentLoaded", () => {
  const stored = JSON.parse(localStorage.getItem("crmData") || "[]");
  if (stored.length) renderCRMTable(stored);
});
