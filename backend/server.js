const express = require("express");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const fs = require("fs/promises");
const path = require("path");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-env";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-me";
const DATA_FILE = path.join(__dirname, "data", "site-data.json");
const ROOT_DIR = path.join(__dirname, "..");

const requiredTopLevelKeys = ["site", "clubs", "fixtures", "results", "leagueTable"];

app.use(express.json({ limit: "1mb" }));
app.use(express.static(ROOT_DIR));

async function readData() {
  const content = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(content);
}

async function writeData(payload) {
  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf8");
}

function validateDataShape(data) {
  if (!data || typeof data !== "object") return false;
  return requiredTopLevelKeys.every((key) => key in data);
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Missing authentication token." });
  }

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired authentication token." });
  }
}

app.post("/api/auth/login", (req, res) => {
  const providedPassword = req.body?.password;
  if (!providedPassword || providedPassword !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Incorrect password." });
  }

  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "12h" });
  return res.json({ token });
});

app.get("/api/data", async (_req, res) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to read site data.", detail: error.message });
  }
});

app.put("/api/data", authMiddleware, async (req, res) => {
  const candidate = req.body;
  if (!validateDataShape(candidate)) {
    return res.status(400).json({
      message: "Invalid payload. Required keys: site, clubs, fixtures, results, leagueTable."
    });
  }

  try {
    await writeData(candidate);
    res.json({ message: "Site data updated." });
  } catch (error) {
    res.status(500).json({ message: "Failed to save site data.", detail: error.message });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Golf site running on http://localhost:${PORT}`);
});
