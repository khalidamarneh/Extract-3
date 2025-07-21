document.addEventListener("DOMContentLoaded", function () {
  // --- Variables ---
  const mergeFilesInput = document.getElementById("mergeFilesInput");
  const mergeFilesButton = document.getElementById("mergeFilesButton");
  const spinnerMerge = document.getElementById("spinnerMerge");
  const messageMerge = document.getElementById("messageMerge");
  const extractButton = document.getElementById("extractButton");
  const spinnerSingle = document.getElementById("spinnerSingle");
  const messageSingle = document.getElementById("messageSingle");
  const downloadCsvButton = document.getElementById("downloadCsvButton");
  const getTotalButton = document.getElementById("getTotalButton");
  const totalResultBox = document.getElementById("totalResultBox");
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const searchResultsContainer = document.getElementById("searchResults");
  const clearSearchButton = document.getElementById("clearSearchButton");
  const restartButton = document.getElementById("restartButton");
  const downloadMergedButton = document.getElementById("downloadMergedButton");
  const onePdfInput = document.getElementById("onePdfInput");
  const onePdfButton = document.getElementById("onePdfButton");
  const spinnerOnepdf = document.getElementById("spinnerOnepdf");
  const messageOnepdf = document.getElementById("messageOnepdf");
  const displayCurrentInvoiceButton = document.getElementById("displayCurrentInvoiceButton");
  const showAllEmbeddedButton = document.getElementById("showAllEmbeddedButton");
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  const csvUploadInput = document.getElementById("csvUploadInput");
  const csvUploadButton = document.getElementById("csvUploadButton");
  const csvMergeInput = document.getElementById("csvMergeInput");
  const csvMergeButton = document.getElementById("csvMergeButton");

  // --- CSV Upload (Single) ---
  if (csvUploadButton && csvUploadInput) {
    csvUploadButton.addEventListener("click", () => csvUploadInput.click());
    csvUploadInput.addEventListener("change", () => {
      const file = csvUploadInput.files[0];
      if (file) uploadCsvSingle(file);
    });
  }
  function uploadCsvSingle(file) {
    const formData = new FormData();
    formData.append("csv", file);
    resetPageState();
    fetch("/upload-csv-single", { method: "POST", body: formData })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          messageSingle.textContent = "CSV uploaded and processed successfully!";
          downloadCsvButton.style.display = "block";
          getTotalButton.style.display = "block";
          performSearch();
        } else {
          messageSingle.textContent = "CSV upload failed. Please try again.";
        }
      })
      .catch(() => { messageSingle.textContent = "An error occurred. Please try again later."; });
  }

  // --- CSV Upload (Multiple/Merge) ---
  if (csvMergeButton && csvMergeInput) {
    csvMergeButton.addEventListener("click", () => csvMergeInput.click());
    csvMergeInput.addEventListener("change", () => {
      const files = csvMergeInput.files;
      if (files.length > 0) uploadCsvMultiple(files);
    });
  }
  function uploadCsvMultiple(files) {
    const formData = new FormData();
    for (const file of files) formData.append("csvs", file);
    resetPageState();
    fetch("/upload-csv-multiple", { method: "POST", body: formData })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          messageSingle.textContent = "CSVs uploaded and merged successfully!";
          downloadCsvButton.style.display = "block";
          getTotalButton.style.display = "block";
          performSearch();
        } else {
          messageSingle.textContent = "CSV merge failed. Please try again.";
        }
      })
      .catch(() => { messageSingle.textContent = "An error occurred. Please try again later."; });
  }

  // --- Single PDF Upload ---
  if (onePdfButton && onePdfInput) {
    onePdfButton.addEventListener("click", () => onePdfInput.click());
    onePdfInput.addEventListener("change", () => {
      const file = onePdfInput.files[0];
      if (file) uploadOnepdf(file);
    });
  }
  function uploadOnepdf(file) {
    const formData = new FormData();
    formData.append("onepdf", file);
    spinnerOnepdf.style.display = "block";
    resetPageState();
    fetch("/upload-onepdf", { method: "POST", body: formData })
      .then(response => response.json())
      .then(data => {
        spinnerOnepdf.style.display = "none";
        if (data.success) {
          messageOnepdf.textContent = "Single PDF uploaded successfully!";
          extractButton.dataset.pdfUrl = `/uploads/${file.name}`;
        } else {
          messageOnepdf.textContent = "Upload failed. Please try again.";
        }
      })
      .catch(() => {
        spinnerOnepdf.style.display = "none";
        messageOnepdf.textContent = "An error occurred. Please try again later.";
      });
  }

  // --- Restart ---
  if (restartButton) {
    restartButton.addEventListener("click", () => {
      fetch("/restart", { method: "POST" })
        .then(response => response.json())
        .then(() => {
          resetPageState();
          searchResultsContainer.innerHTML = "";
          downloadMergedButton.style.display = "none";
          messageOnepdf.textContent = "";
        })
        .catch(error => { console.error(error); });
    });
  }

  // --- Upload Multiple Files (PDF merge) ---
  if (mergeFilesButton && mergeFilesInput) {
    mergeFilesButton.addEventListener("click", () => mergeFilesInput.click());
    mergeFilesInput.addEventListener("change", () => {
      const files = mergeFilesInput.files;
      if (files.length > 0) uploadMultipleFiles(files);
    });
  }
  function uploadMultipleFiles(files) {
    const formData = new FormData();
    for (const file of files) formData.append("files", file);
    spinnerMerge.style.display = "block";
    resetPageState();
    fetch("/upload-multiple", { method: "POST", body: formData })
      .then(response => response.json())
      .then(data => {
        spinnerMerge.style.display = "none";
        if (data.success) {
          messageMerge.textContent = "PDFs uploaded & successfully merged!";
          downloadMergedButton.style.display = "block";
        } else {
          messageMerge.textContent = "Upload failed. Please try again.";
        }
      })
      .catch(() => {
        spinnerMerge.style.display = "none";
        messageMerge.textContent = "An error occurred. Please try again later.";
      });
  }

  // --- Download merged PDF ---
  if (downloadMergedButton) {
    downloadMergedButton.addEventListener("click", () => {
      fetch("/download-merged")
        .then(response => {
          if (!response.ok) throw new Error("Failed to download the combined PDF.");
          return response.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = "combined.pdf";
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
        })
        .catch(error => {
          console.error("Error during combined PDF download:", error);
          alert("Could not download the combined PDF. Please check the server or file availability.");
        });
    });
  }

  // --- CSV Download Handler ---
  if (downloadCsvButton) {
    downloadCsvButton.addEventListener("click", () => {
      fetch("/download/csv")
        .then(response => {
          if (!response.ok) throw new Error("Failed to download the CSV file.");
          return response.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = "extracted.csv";
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
        })
        .catch(error => {
          console.error("Error during CSV download:", error);
          alert("Could not download the CSV. Please check the server or file availability.");
        });
    });
  }

  // --- Extract Tables Handler ---
  if (extractButton) {
    extractButton.addEventListener("click", () => {
      const pdfUrl = extractButton.dataset.pdfUrl || "/download/combined-pdf";
      extractTables(pdfUrl);
    });
  }
  function extractTables(pdfUrl) {
    spinnerSingle.classList.remove("hidden");
    resetPageState();
    fetch("/extract-tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdfUrl }),
    })
      .then(response => response.json())
      .then(data => {
        spinnerSingle.classList.add("hidden");
        if (data.success) {
          messageSingle.textContent = "Tables extracted successfully!";
          downloadCsvButton.style.display = "block";
          getTotalButton.style.display = "block";
        } else {
          messageSingle.textContent = "Extraction failed. Please try again.";
        }
      })
      .catch(() => {
        spinnerSingle.classList.add("hidden");
        messageSingle.textContent = "An error occurred. Please try again later.";
      });
  }

  // --- Display Current Invoice Modal ---
  if (displayCurrentInvoiceButton) {
    displayCurrentInvoiceButton.addEventListener("click", function () {
      fetch("/download/csv")
        .then(response => response.text())
        .then(csvText => {
          showInvoiceModal(csvText);
        })
        .catch(() => {
          alert("Could not fetch the current invoice (CSV).");
        });
    });
  }
  function showInvoiceModal(csvText) {
    let modal = document.getElementById("currentInvoiceModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "currentInvoiceModal";
      modal.style.position = "fixed";
      modal.style.top = "10%";
      modal.style.left = "10%";
      modal.style.width = "80%";
      modal.style.height = "80%";
      modal.style.background = "#fff";
      modal.style.overflow = "auto";
      modal.style.zIndex = "9999";
      modal.style.border = "2px solid #333";
      modal.style.padding = "20px";
      modal.innerHTML = `<button id="closeInvoiceModal" style="float:right;">Close</button><div id="invoiceTableContainer"></div>`;
      document.body.appendChild(modal);

      document.getElementById("closeInvoiceModal").onclick = function () {
        modal.style.display = "none";
      };
    } else {
      modal.style.display = "block";
    }

    // Render CSV as table, formatting last two columns
    const container = document.getElementById("invoiceTableContainer");
    container.innerHTML = "";
    const rows = csvText.trim().split("\n").map(r => r.split(","));
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    const lastTwoIdx = [rows[0].length - 2, rows[0].length - 1];
    rows.forEach((row, rowIdx) => {
      const tr = document.createElement("tr");
      row.forEach((cell, colIdx) => {
        const cellElem = document.createElement(rowIdx === 0 ? "th" : "td");
        cellElem.textContent = cell;
        cellElem.style.border = "1px solid #aaa";
        cellElem.style.padding = "4px";
        if (lastTwoIdx.includes(colIdx)) {
          cellElem.style.textAlign = "center";
          if (rowIdx !== 0) {
            let num = parseFloat(cell.replace(/,/g, ""));
            cellElem.textContent = !isNaN(num) ? formatNumberWithCommas(num.toFixed(2)) : cell;
          }
        }
        tr.appendChild(cellElem);
      });
      table.appendChild(tr);
    });
    container.appendChild(table);
  }

  // --- Show All Embedded CSV in Search Container with Select All ---
  if (showAllEmbeddedButton) {
    showAllEmbeddedButton.addEventListener("click", function () {
      fetch("/download/csv")
        .then(response => response.text())
        .then(csvText => {
          renderCSVInSearchContainer(csvText);
        })
        .catch(() => {
          alert("Could not fetch the current CSV.");
        });
    });
  }
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", function () {
      const checkboxes = document.querySelectorAll("#searchResults .row-checkbox");
      checkboxes.forEach(cb => {
        cb.checked = selectAllCheckbox.checked;
      });
    });
  }
  function renderCSVInSearchContainer(csvText) {
    searchResultsContainer.innerHTML = "";
    let rows = csvText.trim().split("\n")
      .map(line => line.split(","))
      .filter(row => row.some(cell => cell && cell.trim() !== ""));
    if (rows.length === 0) {
      searchResultsContainer.textContent = "No results found.";
      return;
    }
    const table = document.createElement("table");
    table.classList.add("search-table");
    const lastTwoIdx = [rows[0].length - 2, rows[0].length - 1];
    rows.forEach((row, rowIdx) => {
      const tr = document.createElement("tr");
      tr.classList.add("search-row");
      // Checkbox column
      const checkboxCell = document.createElement(rowIdx === 0 ? "th" : "td");
      if (rowIdx === 0) {
        checkboxCell.innerHTML = "";
      } else {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.classList.add("row-checkbox");
        checkboxCell.appendChild(checkbox);
      }
      tr.appendChild(checkboxCell);
      row.forEach((cell, colIdx) => {
        const isLastTwo = lastTwoIdx.includes(colIdx);
        const td = document.createElement(rowIdx === 0 ? "th" : "td");
        td.textContent = cell;
        if (isLastTwo) {
          td.style.textAlign = "center";
          if (rowIdx !== 0) {
            let num = parseFloat(cell.replace(/,/g, ""));
            td.textContent = !isNaN(num) ? formatNumberWithCommas(num.toFixed(2)) : cell;
          }
        }
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    searchResultsContainer.appendChild(table);
  }

  // --- SEARCH SECTION: FIXED ROBUST HEADER/SEARCH LOGIC ---
  if (searchButton) searchButton.addEventListener("click", performSearch);
  if (clearSearchButton) clearSearchButton.addEventListener("click", clearSearch);
  if (searchInput) searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") performSearch();
  });

  function performSearch() {
    fetch("/download/csv")
      .then((response) => response.text())
      .then((csvData) => {
        Papa.parse(csvData, {
          header: false,
          skipEmptyLines: true,
          complete: function (results) {
            displaySearchResults(results.data, searchInput.value.trim());
          },
        });
      })
      .catch(() => {
        searchResultsContainer.textContent = "Error occurred during search.";
      });
  }

  function displaySearchResults(allRows, searchText) {
    searchResultsContainer.innerHTML = "";

    if (!Array.isArray(allRows) || allRows.length === 0) {
      searchResultsContainer.textContent = "No results found.";
      return;
    }

    const header = allRows[0];
    let dataRows = allRows.slice(1);

    if (!Array.isArray(header)) {
      searchResultsContainer.textContent = "No results found.";
      return;
    }

    let filteredRows = dataRows;
    if (searchText) {
      filteredRows = dataRows.filter(row =>
        row.some(col =>
          (col || "")
            .toString()
            .toLowerCase()
            .includes(searchText.toLowerCase())
        )
      );
    }

    if (filteredRows.length > 0 && !Array.isArray(filteredRows[0])) {
      filteredRows = [filteredRows];
    }

    const table = document.createElement("table");
    table.classList.add("search-table");
    const lastTwoIdx = [header.length - 2, header.length - 1];

    const headerRow = document.createElement("tr");
    const checkboxHeader = document.createElement("th");
    checkboxHeader.textContent = "";
    headerRow.appendChild(checkboxHeader);
    header.forEach((cell, colIdx) => {
      const th = document.createElement("th");
      th.textContent = cell;
      if (lastTwoIdx.includes(colIdx)) th.style.textAlign = "center";
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    let anyRow = false;
    filteredRows.forEach((row) => {
      if (!row || !Array.isArray(row) || !row.some(cell => cell && cell.toString().trim() !== "")) return;
      anyRow = true;
      const tr = document.createElement("tr");
      tr.classList.add("search-row");

      const checkboxCell = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.classList.add("row-checkbox");
      checkboxCell.appendChild(checkbox);
      tr.appendChild(checkboxCell);

      row.forEach((cell, colIdx) => {
        const isLastTwo = lastTwoIdx.includes(colIdx);
        const td = document.createElement("td");
        if (isLastTwo) {
          td.style.textAlign = "center";
          let num = parseFloat((cell || "").replace(/,/g, ""));
          td.textContent = !isNaN(num) ? formatNumberWithCommas(num.toFixed(2)) : (cell || "");
        } else {
          td.textContent = cell !== undefined ? cell : "";
        }
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });

    searchResultsContainer.appendChild(table);

    if (!anyRow) {
      const noResultsMsg = document.createElement("div");
      noResultsMsg.textContent = "No results found.";
      searchResultsContainer.appendChild(noResultsMsg);
    }
  }

  function clearSearch() {
    searchInput.value = "";
    searchResultsContainer.innerHTML = "";
  }

  // --- Total Calculation ---
  if (getTotalButton) {
    getTotalButton.addEventListener("click", () => {
      fetch("/getTotal")
        .then(response => response.json())
        .then(data => {
          totalResultBox.textContent =
            "Total sum: " + formatNumberWithCommas(data.total);
          totalResultBox.style.display = "block";
        })
        .catch(() => {
          alert("Error occurred while fetching total.");
        });
    });
  }

  // --- MODAL LOGIC FOR PROFIT PERCENTAGE (Add Item with Modal) ---
  window.addItemToInvoice = function () {
    const tableBody = document.querySelector("#invoiceTable tbody");
    const selectedItems = document.querySelectorAll(".row-checkbox:checked");
    if (selectedItems.length > 0) {
      let selectedRowsArr = Array.from(selectedItems).map(cb => cb.closest("tr"));
      processRowsWithModal(selectedRowsArr, tableBody, 0);
    } else {
      const row = document.createElement("tr");
      const rowCount = tableBody.children.length;
      row.innerHTML =
        `<td>${rowCount + 1}</td>
        <td><input type="text" class="item-description"></td>
        <td><input type="number" class="item-quantity" oninput="calculateTotal(this)"></td>
        <td><input type="number" class="item-price" oninput="calculateTotal(this)" step="0.01"></td>
        <td><input type="text" class="item-total" readonly></td>
        <td><button onclick="deleteItem(this)">Delete</button></td>`;
      tableBody.appendChild(row);
      updateSequenceNumbers();
      updateGrandTotal();
    }
  };

  function processRowsWithModal(rows, tableBody, idx) {
    if (idx >= rows.length) return;
    const tr = rows[idx];
    const cells = tr.querySelectorAll("td, th");
    const desc = cells[2] ? cells[2].textContent : "";
    const price = cells[cells.length - 2] ? parseFloat(cells[cells.length - 2].textContent.replace(/,/g, "")) || 0 : 0;
    showCustomModal(
      `<p>Description: ${desc}</p><p>Cost $: ${formatNumberWithCommas(price.toFixed(2))}</p><p>Enter profit percentage %:</p>`,
      function (profitPercentage) {
        if (!isNaN(profitPercentage) && !isNaN(price)) {
          const newPrice = price + (price * profitPercentage / 100);
          const row = document.createElement("tr");
          row.innerHTML =
            `<td></td>
            <td><input type="text" class="item-description" value="${desc}"></td>
            <td><input type="number" class="item-quantity" oninput="calculateTotal(this)"></td>
            <td><input type="number" class="item-price" oninput="calculateTotal(this)" value="${formatNumberWithCommas(newPrice.toFixed(2))}" step="0.01"></td>
            <td><input type="text" class="item-total" readonly></td>
            <td><button onclick="deleteItem(this)">Delete</button></td>`;
          tableBody.appendChild(row);
          updateSequenceNumbers();
          updateGrandTotal();
        }
        // Show modal for the next item automatically
        if (idx + 1 < rows.length) {
          setTimeout(function () {
            processRowsWithModal(rows, tableBody, idx + 1);
          }, 200);
        }
      },
      idx === rows.length - 1
    );
  }

  window.showCustomModal = function (message, callback, isLast) {
    const modal = document.getElementById("customModal");
    const modalMessage = document.getElementById("modalMessage");
    const profitInput = document.getElementById("profitInput");
    const okButton = modal.querySelector("button");
    const closeButton = modal.querySelector(".close");
    modalMessage.innerHTML = message;
    profitInput.value = "";
    modal.style.display = "block";
    closeButton.onclick = function () { modal.style.display = "none"; };
    okButton.onclick = function () {
      const profitPercentage = parseFloat(profitInput.value);
      callback(profitPercentage);
      if (isLast) modal.style.display = "none";
    };
    profitInput.onkeypress = function (event) {
      if (event.key === "Enter") okButton.click();
    };
    setTimeout(() => { profitInput.focus(); }, 350);
  };

  window.calculateTotal = function (input) {
    const row = input.closest("tr");
    const quantity = parseFloat(row.querySelector(".item-quantity")?.value) || 0;
    const price = parseFloat(row.querySelector(".item-price")?.value) || 0;
    const total = quantity * price;
    const totalInput = row.querySelector(".item-total");
    if (totalInput) {
      totalInput.value = formatNumberWithCommas(total.toFixed(2));
    }
    updateGrandTotal();
  };

  window.deleteItem = function (button) {
    const row = button.closest("tr");
    row.remove();
    updateSequenceNumbers();
    updateGrandTotal();
  };

  window.printInvoice = function () {
    window.print();
  };

  window.saveInvoice = function () {
    alert("Save Invoice functionality is not yet implemented.");
  };

  window.loadSavedInvoiceByNumber = function () {
    alert("Load Invoice functionality is not yet implemented.");
  };

  function updateSequenceNumbers() {
    const tableBody = document.querySelector("#invoiceTable tbody");
    Array.from(tableBody.children).forEach((tr, idx) => {
      const td = tr.querySelector("td");
      if (td) td.textContent = idx + 1;
    });
  }

  function updateGrandTotal() {
    const tableBody = document.querySelector("#invoiceTable tbody");
    let totalSum = 0;
    Array.from(tableBody.children).forEach(tr => {
      const totalInput = tr.querySelector(".item-total");
      if (totalInput) {
        const totalValue = parseFloat(totalInput.value.replace(/,/g, "")) || 0;
        totalSum += totalValue;
      }
    });
    let grandTotalRow = document.querySelector("#invoiceTable tfoot .grand-total-row");
    if (!grandTotalRow) {
      let tfoot = document.querySelector("#invoiceTable tfoot");
      if (!tfoot) {
        tfoot = document.createElement("tfoot");
        document.getElementById("invoiceTable").appendChild(tfoot);
      }
      grandTotalRow = document.createElement("tr");
      grandTotalRow.className = "grand-total-row";
      tfoot.appendChild(grandTotalRow);
    }
    if (grandTotalRow) {
      grandTotalRow.innerHTML = `<td colspan="1"></td><td colspan="4" style="font-weight:bold">Grand Total: ${formatNumberWithCommas(totalSum.toFixed(2))}</td>`;
    }
  }

  // --- Reset Page State ---
  function resetPageState() {
    messageSingle.textContent = "";
    messageMerge.textContent = "";
    if (downloadCsvButton) downloadCsvButton.style.display = "none";
    if (totalResultBox) totalResultBox.style.display = "none";
    if (getTotalButton) getTotalButton.style.display = "none";
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
  }

  // --- Helper for number formatting ---
  window.formatNumberWithCommas = function (number) {
    return Number(number).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // --- Prevent accidental unload ---
  if (typeof $ !== "undefined") {
    $(document).ready(function () {
      window.addEventListener('beforeunload', function (event) {
        event.preventDefault();
        event.returnValue = '';
        return '';
      });
      $(window).on('unload', function () {
        window.removeEventListener('beforeunload', function (event) {
          event.preventDefault();
          event.returnValue = '';
        });
      });
    });
  }
});