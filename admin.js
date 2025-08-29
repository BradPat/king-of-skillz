const ADMIN_PASSWORD = 'geheim123';
async function loadData() {
  const [teamsRes, matchesRes] = await Promise.all([
    fetch('/api/teams'),
    fetch('/api/matches')
  ]);
  const teams = await teamsRes.json();
  const matches = await matchesRes.json();
  return { teams, matches };
}
function renderAdminMatchdays(matches, teams) {
  const selector = document.getElementById('adminMatchdaySelector');
  selector.innerHTML = '';
  const days = [...new Set(matches.map(m => m.matchday))].sort((a,b) => a-b);
  days.forEach(d => selector.innerHTML += `<option value="${d}">Spieltag ${d}</option>`);
  selector.addEventListener('change', () => showAdminMatches(matches, teams, selector.value));
  showAdminMatches(matches, teams, days[0]);
}
function showAdminMatches(matches, teams, day) {
  const container = document.getElementById('adminMatches');
  container.innerHTML = '';
  matches.filter(m => m.matchday == day).forEach((m, idx) => {
    const home = teams.find(t => t.id === m.homeTeam).name;
    const away = teams.find(t => t.id === m.awayTeam).name;
    container.innerHTML += `<div class="flex items-center gap-2">
      <span class="w-32">${home}</span>
      <input type="number" min="0" value="${m.scoreHome}" class="border p-1 w-12" data-idx="${idx}" data-type="home">
      <span> - </span>
      <input type="number" min="0" value="${m.scoreAway}" class="border p-1 w-12" data-idx="${idx}" data-type="away">
      <span class="w-32">${away}</span>
    </div>`;
  });
}
document.getElementById('loginBtn').addEventListener('click', () => {
  const pw = document.getElementById('adminPassword').value;
  if (pw === ADMIN_PASSWORD) {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('adminSection').classList.remove('hidden');
    initAdmin();
  } else {
    alert('Falsches Passwort!');
  }
});
async function initAdmin() {
  const {teams, matches} = await loadData();
  renderAdminMatchdays(matches, teams);
  document.getElementById('saveBtn').addEventListener('click', async () => {
    document.querySelectorAll('#adminMatches input').forEach(input => {
      const idx = parseInt(input.dataset.idx);
      const type = input.dataset.type;
      if (type === 'home') matches[idx].scoreHome = parseInt(input.value);
      else matches[idx].scoreAway = parseInt(input.value);
    });
    await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matches)
    });
    alert('Ergebnisse gespeichert!');
  });
}

// Upload-Sektion initialisieren
async function initLogoUpload(teams) {
  const selector = document.getElementById('teamSelector');
  teams.forEach(team => {
    selector.innerHTML += `<option value="\${team.id}">\${team.name}</option>`;
  });

  const form = document.getElementById('logoUploadForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const teamId = selector.value;
    const fileInput = document.getElementById('logoFile');
    const formData = new FormData();
    formData.append('logo', fileInput.files[0]);
    const res = await fetch('/api/upload-logo/' + teamId, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      alert('Logo erfolgreich hochgeladen!');
    } else {
      alert('Fehler beim Upload');
    }
  });
}

initAdmin = async function() {
  const {teams, matches} = await loadData();
  renderAdminMatchdays(matches, teams);
  initLogoUpload(teams);
  document.getElementById('uploadLogoSection').classList.remove('hidden');
  document.getElementById('saveBtn').addEventListener('click', async () => {
    document.querySelectorAll('#adminMatches input').forEach(input => {
      const idx = parseInt(input.dataset.idx);
      const type = input.dataset.type;
      if (type === 'home') matches[idx].scoreHome = parseInt(input.value);
      else matches[idx].scoreAway = parseInt(input.value);
    });
    await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matches)
    });
    alert('Ergebnisse gespeichert!');
  });
};
