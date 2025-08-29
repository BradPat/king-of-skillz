
// app.js

// Lade Team- und Matchdaten vom Server
async function loadData() {
  const [teamsRes, matchesRes] = await Promise.all([
    fetch('/api/teams'),
    fetch('/api/matches')
  ]);
  const teams = await teamsRes.json();
  const matches = await matchesRes.json();
  return { teams, matches };
}

// Berechne Tabelle: Spiele, Siege, Unentschieden, Niederlagen, Tore, Punkte
function calculateStandings(teams, matches) {
  const standings = teams.map(t => ({
    id: t.id,
    name: t.name,
    logo: t.logo || '',
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0
  }));

	matches.forEach(m => {
	  const isValid = typeof m.scoreHome === 'number' && typeof m.scoreAway === 'number';
	  if (!isValid) return; // Spiel wird nicht gezählt

	  const home = standings.find(t => t.id === m.homeTeam);
	  const away = standings.find(t => t.id === m.awayTeam);

	  home.played++;
	  away.played++;
	  home.goalsFor += m.scoreHome;
	  home.goalsAgainst += m.scoreAway;
	  away.goalsFor += m.scoreAway;
	  away.goalsAgainst += m.scoreHome;

	  if (m.scoreHome > m.scoreAway) {
		home.wins++;
		home.points += 3;
		away.losses++;
	  } else if (m.scoreHome < m.scoreAway) {
		away.wins++;
		away.points += 3;
		home.losses++;
	  } else {
		home.draws++;
		away.draws++;
		home.points++;
		away.points++;
	  }
	});


  // Tordifferenz berechnen
  standings.forEach(row => {
    row.goalDiff = row.goalsFor - row.goalsAgainst;
  });

  // Sortiere nach Punkte > Tordifferenz > geschossene Tore
  standings.sort((a, b) =>
    b.points - a.points ||
    b.goalDiff - a.goalDiff ||
    b.goalsFor - a.goalsFor
  );

  return standings;
}

// Rendere die Gesamttabelle
function renderStandings(standings) {
  const tbody = document.getElementById('standings');
  tbody.innerHTML = standings.map((row, i) => {
    const bgColor =
      i < 8 ? 'bg-green-100' :
      i >= 24 ? 'bg-gray-200' :
      '';
    return `
      <tr class="border-b ${bgColor}">
        <td class="p-1 text-center">${i + 1}</td>
        <td class="p-1 flex items-center gap-2">
          <img src="${row.logo}" alt="" class="w-5 h-5">
          <span>${row.name}</span>
        </td>
        <td class="p-1 text-center">${row.played}</td>
        <td class="p-1 text-center">${row.wins}</td>
        <td class="p-1 text-center">${row.draws}</td>
        <td class="p-1 text-center">${row.losses}</td>
        <td class="p-1 text-center">${row.goalsFor}:${row.goalsAgainst}</td>
        <td class="p-1 text-center">${row.goalDiff}</td>
        <td class="p-1 text-center">${row.points}</td>
      </tr>
    `;
  }).join('');
}

// Erzeuge Dropdown und initiale Anzeige der Spiele
function renderMatchdays(matches, teams) {
  const selector = document.getElementById('matchdaySelector');
  const controlsContainer = selector.parentElement; // z. B. eine umgebende <div>
  selector.innerHTML = '';

  // Alle vorhandenen Spieltage
  const days = [...new Set(matches.map(m => m.matchday))].sort((a, b) => a - b);

  // Buttons erzeugen
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '◀';
  prevBtn.className = 'px-2 py-1 border rounded mr-2';
  
  const nextBtn = document.createElement('button');
  nextBtn.textContent = '▶';
  nextBtn.className = 'px-2 py-1 border rounded ml-2';

  // Buttons zum DOM hinzufügen
  controlsContainer.insertBefore(prevBtn, selector);
  controlsContainer.appendChild(nextBtn);
  
  // Dropdown füllen
  days.forEach(day => {
    selector.innerHTML += `<option value="${day}">Spieltag ${day}</option>`;
  });

  let currentIndex = 0;

  function updateMatchday(index) {
    currentIndex = Math.max(0, Math.min(days.length - 1, index));
    const day = days[currentIndex];
    selector.value = day;
    showMatches(matches, teams, day);
  }

  selector.addEventListener('change', () => {
    const day = parseInt(selector.value, 10);
    const index = days.indexOf(day);
    if (index !== -1) {
      updateMatchday(index);
    }
  });

  prevBtn.addEventListener('click', () => {
    updateMatchday(currentIndex - 1);
  });

  nextBtn.addEventListener('click', () => {
    updateMatchday(currentIndex + 1);
  });

  // Initial anzeigen
  if (days.length > 0) {
    updateMatchday(0);
  }
}


// Zeige alle Spiele eines ausgewählten Spieltags
function showMatches(matches, teams, day) {
  const ul = document.getElementById('matches');
  ul.innerHTML = '';

  const todays = matches.filter(m => m.matchday === day);
  if (todays.length === 0) {
    ul.innerHTML = '<li class="p-2 text-gray-500">Keine Spiele an diesem Spieltag.</li>';
    return;
  }

todays.forEach(m => {
  const home = teams.find(t => t.id === m.homeTeam);
  const away = teams.find(t => t.id === m.awayTeam);

  const hasValidResult = typeof m.scoreHome === 'number' && typeof m.scoreAway === 'number';
  const resultDisplay = hasValidResult
    ? `${m.scoreHome} – ${m.scoreAway}`
    : `${m.date}`;

  ul.innerHTML += `
    <li class="flex items-center justify-between border p-2">
      <div class="flex items-center gap-2 w-60">
        <img src="${home.logo}" alt="" class="w-5 h-5">
        <span>${home.name}</span>
      </div>
      <span class="font-semibold text-center w-40">${resultDisplay}</span>
      <div class="flex items-center gap-2 w-60">
        <span>${away.name}</span>
        <img src="${away.logo}" alt="" class="w-5 h-5">
      </div>
    </li>
  `;
});

}




// Initialisierung nach DOM-Laden
document.addEventListener('DOMContentLoaded', () => {
  loadData().then(({ teams, matches }) => {
	const standings = calculateStandings(teams, matches);
    renderStandings(standings);
	renderMatchdays(matches, teams);
  });
});