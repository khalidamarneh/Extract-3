const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdf2table = require("pdf2table");
const pdfLib = require("pdf-lib");
const csv = require("csv-parser");
const app = express();
const port = process.env.PORT || 3000;

// View engine and static files setup
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "src/pages"));
app.use(express.static("public"));
app.use(express.json());

// Multer storage configuration
const storage = multer.diskStorage({
  destination: "public/uploads/",
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const filename = `file-${uniqueSuffix}${extension}`;
    cb(null, filename);
  },
});

const upload = multer({ storage: storage });

let combinedPdfPath = "";
let currentPdfPath = "";

// Routes
app.get("/", (req, res) => {
  res.render("index");
});

// Multiple PDF Upload and Combine
app.post("/upload-multiple", upload.array("files", 50), async (req, res) => {
  const files = req.files;

  if (!files || files.length < 2) {
    return res.json({
      success: false,
      message: "Please upload at least two PDF files",
    });
  }

  try {
    const pdfDoc = await pdfLib.PDFDocument.create();

    for (const file of files) {
      const fileBytes = fs.readFileSync(file.path);
      const pdfBytes = await pdfLib.PDFDocument.load(fileBytes);
      const copiedPages = await pdfDoc.copyPages(
        pdfBytes,
        pdfBytes.getPageIndices()
      );
      copiedPages.forEach((page) => pdfDoc.addPage(page));
    }

    const combinedPdfBytes = await pdfDoc.save();
    combinedPdfPath = path.join(__dirname, "public", "Combinedpdf", "combined.pdf");
    fs.writeFileSync(combinedPdfPath, combinedPdfBytes);

    return res.json({ success: true, message: "PDFs combined successfully" });
  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      message: "An error occurred while combining PDFs",
    });
  }
});

// Single PDF Upload
app.post("/upload-onepdf", upload.single("onepdf"), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.json({ success: false, message: "Please upload a single PDF." });
  }

  currentPdfPath = `public/uploads/${file.filename}`;
  res.json({
    success: true,
    message: "Single PDF uploaded successfully!",
    uploadedFilePath: currentPdfPath,
  });
});

// Extract Tables
app.post("/extract-tables", (req, res) => {
  const pdfPath = currentPdfPath || combinedPdfPath;

  if (!pdfPath) {
    return res.status(404).json({ success: false, message: "No PDF file available" });
  }

  processPdf(pdfPath, (err, csvFileName, csvPath) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: err });
    }

    res.json({ success: true, csvPath });
  });
});

// Download Combined PDF


// Serve the combined PDF for download
app.get("/download-merged", (req, res) => {
  const combinedFilePath = path.join(__dirname, "public", "Combinedpdf", "combined.pdf"); // Correct file name: combined.pdf

  // Check if the combined file exists
  if (fs.existsSync(combinedFilePath)) {
    res.download(combinedFilePath, "combined.pdf", (err) => {
      if (err) {
        console.error("Error sending combined PDF:", err);
        res.status(500).send({ error: "Failed to download combined PDF" });
      }
    });
  } else {
    res.status(404).send({ error: "Combined file not found" });
  }
});

// Serve the CSV for download
app.get("/download/csv", (req, res) => {
  const csvFilePath = path.join(__dirname, "public", "uploads", "extracted.csv");

  // Check if the CSV file exists
  if (fs.existsSync(csvFilePath)) {
    res.download(csvFilePath, "extracted.csv", (err) => {
      if (err) {
        console.error("Error sending CSV:", err);
        res.status(500).send({ error: "Failed to download CSV" });
      }
    });
  } else {
    res.status(404).send({ error: "CSV file not found" });
  }
});

// Restart and Cleanup
app.post("/restart", (req, res) => {
  cleanUpFiles();
  combinedPdfPath = "";
  currentPdfPath = "";
  res.json({ success: true });
  process.exit(0);
});

// Total Calculation
app.get("/getTotal", (req, res) => {
  let sum = 0;
  const csvPath = path.join(__dirname, "public/uploads", "extracted.csv");

  if (!fs.existsSync(csvPath)) {
    return res.status(404).json({ message: "No CSV file available." });
  }

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on("data", (row) => {
      const value = parseFloat(row["Total"].replace(/[^0-9.-]+/g, ""));
      if (!isNaN(value)) {
        sum += value;
      }
    })
    .on("end", () => {
      res.json({ total: sum.toFixed(2) });
    });
});

// Utility Functions
function processPdf(pdfPath, callback) {
  fs.readFile(pdfPath, (err, buffer) => {
    if (err) {
      return callback("Error reading the uploaded file.");
    }

    pdf2table.parse(buffer, (err, rows) => {
      if (err) {
        return callback("Error extracting data from PDF.");
      }

      const filteredTables = rows
        .filter((table) => Array.isArray(table) && table.length > 0)
        .filter((table) => table.length >= 8 && table.length <= 10);

      const adjustedTables = filteredTables.map((table) => {
        // Adjustments for table structure
        return table.map((cell) => cell.trim());
      });

      const csvFileName = "extracted.csv";
      const csvPath = path.join(__dirname, "public/uploads", csvFileName);
      const csvData = adjustedTables.map((row) => row.join(",")).join("\n");

      fs.writeFileSync(csvPath, csvData);

      callback(null, csvFileName, csvPath);
    });
  });
}

function cleanUpFiles() {
  const uploadsDir = path.join(__dirname, "public/uploads");
  fs.readdirSync(uploadsDir).forEach((file) => {
    const filePath = path.join(uploadsDir, file);
    if (file !== "extracted.csv") {
      fs.unlinkSync(filePath);
    }
  });
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
