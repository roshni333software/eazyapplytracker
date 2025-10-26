document.getElementById("upload-btn").addEventListener("click", () => {
  const fileInput = document.getElementById("excelFile");
  const file = fileInput.files[0];

  if (!file) return alert("Please choose a file first.");

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

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
  };

  reader.readAsArrayBuffer(file);
});
