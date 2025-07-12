document.addEventListener("DOMContentLoaded", function () {
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

  // Single PDF Upload Handlers
  onePdfButton.addEventListener("click", () => {
    onePdfInput.click();
  });

  onePdfInput.addEventListener("change", () => {
    const file = onePdfInput.files[0];
    if (file) {
      uploadOnepdf(file);
    }
  });

  function uploadOnepdf(file) {
    const formData = new FormData();
    formData.append("onepdf", file);

    spinnerOnepdf.style.display = "block";
    resetPageState();

    fetch("/upload-onepdf", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
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
        messageOnepdf.textContent =
          "An error occurred. Please try again later.";
      });
  }

  // Restart Process Handler
  // Restart Process Handler
restartButton.addEventListener("click", () => {
  fetch("/restart", { method: "POST" })
    .then((response) => response.json())
    .then(() => {
      resetPageState();
      searchResultsContainer.innerHTML = "";
      downloadMergedButton.style.display = "none";
      
      // Clear the success message from single PDF upload
      messageOnepdf.textContent = "";
    })
    .catch((error) => {
      console.error(error);
    });
});

 
  
  // Upload Multiple Files
  mergeFilesButton.addEventListener("click", () => {
    mergeFilesInput.click();
  });

  mergeFilesInput.addEventListener("change", () => {
    const files = mergeFilesInput.files;
    if (files.length > 0) {
      uploadMultipleFiles(files);
    }
  });

  function uploadMultipleFiles(files) {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    spinnerMerge.style.display = "block";
    resetPageState();

    fetch("/upload-multiple", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
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

  ///////////////////////////////

  downloadMergedButton.addEventListener("click", () => {
    fetch("/download-merged")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to download the combined PDF.");
        }
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "combined.pdf"; // Set the correct download filename
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error("Error during combined PDF download:", error);
        alert(
          "Could not download the combined PDF. Please check the server or file availability."
        );
      });
  });

  // CSV Download Handler
  downloadCsvButton.addEventListener("click", () => {
    fetch("/download/csv")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to download the CSV file.");
        }
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "extracted.csv"; // Set the desired download filename
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error("Error during CSV download:", error);
        alert(
          "Could not download the CSV. Please check the server or file availability."
        );
      });
  });

  ////////////////////////////
  // Extract Tables Handler
  extractButton.addEventListener("click", () => {
    const pdfUrl = extractButton.dataset.pdfUrl || "/download/combined-pdf";
    extractTables(pdfUrl);
  });

  function extractTables(pdfUrl) {
    spinnerSingle.classList.remove("hidden");
    resetPageState();

    fetch("/extract-tables", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pdfUrl }),
    })
      .then((response) => response.json())
      .then((data) => {
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
        messageSingle.textContent =
          "An error occurred. Please try again later.";
      });
  }

  // CSV Search and Display
  searchButton.addEventListener("click", performSearch);
  clearSearchButton.addEventListener("click", clearSearch);
  searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      performSearch();
    }
  });

  function performSearch() {
    const searchText = searchInput.value.trim();
    if (searchText) {
      searchResultsContainer.innerHTML =
        "Searching<span class='dots'>...</span>";

      fetch("/download/csv")
        .then((response) => response.text())
        .then((csvData) => {
          Papa.parse(csvData, {
            header: false,
            skipEmptyLines: true,
            complete: function (results) {
              const filteredRows = results.data.filter((row) =>
                row.some((col) =>
                  col
                    .toString()
                    .toLowerCase()
                    .includes(searchText.toLowerCase())
                )
              );
              displaySearchResults(filteredRows);
            },
          });
        })
        .catch(() => {
          searchResultsContainer.textContent = "Error occurred during search.";
        });
    } else {
      searchResultsContainer.innerHTML = "Please enter a search query.";
    }
  }

  /////////////////////////////////////////////////////////

  function displaySearchResults(results) {
    searchResultsContainer.innerHTML = "";

    if (results.length > 0) {
      const table = document.createElement("table");
      table.classList.add("search-table");

      results.forEach(function (row) {
        const tr = document.createElement("tr");
        tr.classList.add("search-row");

        // Add a checkbox for each row
        const checkboxCell = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.classList.add("row-checkbox");
        checkboxCell.appendChild(checkbox);
        tr.appendChild(checkboxCell);

        // Loop through columns
        for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
          // Skip specific columns by index (1st, 9th, and 10th columns)
          if (columnIndex === 0 || columnIndex === 8 || columnIndex === 9) {
            continue;
          }

          const td = document.createElement("td");

          // Check if the current column index corresponds to "(Price)" and apply red color
          if (columnIndex === 6) {
            td.style.color = "red";
          }

          // Check if the cell is empty and handle accordingly
          if (row[columnIndex] !== undefined && row[columnIndex] !== null) {
            td.textContent = row[columnIndex];
          } else {
            // Set empty content for undefined/null values
            td.style.display = "none";
          }

          tr.appendChild(td);
        }

        table.appendChild(tr);
      });

      searchResultsContainer.appendChild(table);
    } else {
      searchResultsContainer.textContent = "No results found.";
    }
  }

  //////////////////////////////////////////////////////////////
  function clearSearch() {
    searchInput.value = "";
    searchResultsContainer.innerHTML = "";
  }

  // Total Calculation
  getTotalButton.addEventListener("click", () => {
    fetch("/getTotal")
      .then((response) => response.json())
      .then((data) => {
        totalResultBox.textContent =
          "Total sum: " + data.total.toLocaleString();
        totalResultBox.style.display = "block";
      })
      .catch(() => {
        alert("Error occurred while fetching total.");
      });
  });

  // Reset Page State
  function resetPageState() {
    messageSingle.textContent = "";
    messageMerge.textContent = "";
    downloadCsvButton.style.display = "none";
    totalResultBox.style.display = "none";
    getTotalButton.style.display = "none";
  }
});

function formatNumberWithCommas(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
