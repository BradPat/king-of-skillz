const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require('multer');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

const teamsFile = path.join(__dirname, "public/data/teams.json");
const matchesFile = path.join(__dirname, "public/data/matches.json");

app.get("/api/teams", async (req, res) => {
  const teams = await fs.readJSON(teamsFile);
  res.json(teams);
});

app.get("/api/matches", async (req, res) => {
  const matches = await fs.readJSON(matchesFile);
  res.json(matches);
});

app.post("/api/matches", async (req, res) => {
  const updatedMatches = req.body;
  await fs.writeJSON(matchesFile, updatedMatches, { spaces: 2 });
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server läuft unter http://localhost:${PORT}`);
});

const upload = multer({ dest: path.join(__dirname, 'public/logos') });

app.post('/api/upload-logo/:teamId', upload.single('logo'), async (req, res) => {
  const teamId = parseInt(req.params.teamId);
  const logoPath = `/logos/${req.file.filename}`;

  let teams = await fs.readJSON(teamsFile);
  const team = teams.find(t => t.id === teamId);
  if (team) {
    team.logo = logoPath;
    await fs.writeJSON(teamsFile, teams, { spaces: 2 });
    res.json({ success: true, logo: logoPath });
  } else {
    res.status(404).json({ success: false, message: "Team nicht gefunden" });
  }
});
