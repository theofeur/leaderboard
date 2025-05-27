import { getStreakValue } from './streak.js';
import { getRoleIcon } from './roleIcon.js';
import { getKdaClass } from './kdaClass.js';
import { timeSince, getRuneIconUrl, getSummonerIconUrl, getItemIconUrl } from './utils.js';

function showPlayerModal(player,allMatches) {
    const playerMatches = [];

    allMatches.forEach(match => {
      const playerData = match.players.find(p => p.name === player.name);
      if (playerData) {
        playerMatches.push({
          ...playerData,
          match_id: match.match_id,
          timestamp: match.timestamp,
          duration: match.duration,
          team_kills: match.team_kills,
          win: match.player === player.name ? match.win : null // fallback si win pas dispo dans chaque joueur
        });
      }
    });
    const modal = document.querySelector("#playerModal");
    const modalStats = document.querySelector("#modalStats");
     // Calcul streak et affichage
    const streakValue = getStreakValue(playerMatches);
    let streakHtml = '';
    if (streakValue > 0) {
      streakHtml = `
        <span style="
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: #4caf50;
          color: white;
          font-weight: 700;
          font-size: 13px;
          padding: 3px 8px;
          border-radius: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          margin-left: 12px;
          user-select: none;
          cursor: default;
          animation: pop-in 0.6s ease forwards;
        ">
          🔥 ${streakValue} Win Streak

          <span style="
            visibility: hidden;
            opacity: 0;
            width: max-content;
            max-width: 180px;
            background-color: #222;
            color: #fff;
            text-align: center;
            border-radius: 6px;
            padding: 5px 8px;
            position: absolute;
            z-index: 10;
            bottom: 125%; /* au dessus du badge */
            left: 50%;
            transform: translateX(-50%);
            transition: opacity 0.3s;
            font-size: 11px;
            pointer-events: none;
            box-shadow: 0 0 6px rgba(0,0,0,0.3);
          ">
            Victoires consécutives : ${streakValue}
            <span style="
              position: absolute;
              top: 100%;
              left: 50%;
              margin-left: -5px;
              border-width: 5px;
              border-style: solid;
              border-color: #222 transparent transparent transparent;
            "></span>
          </span>
        </span>

        <style>
          span:hover > span {
            visibility: visible !important;
            opacity: 1 !important;
          }
        </style>
      `;
    } else if (streakValue < 0) {
      streakHtml = `
        <span style="
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: #f44336;
          color: white;
          font-weight: 700;
          font-size: 13px;
          padding: 3px 8px;
          border-radius: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          margin-left: 12px;
          user-select: none;
          cursor: default;
          animation: pop-in 0.6s ease forwards;
        ">
          ❄️ ${-streakValue} Lose Streak

          <span style="
            visibility: hidden;
            opacity: 0;
            width: max-content;
            max-width: 180px;
            background-color: #222;
            color: #fff;
            text-align: center;
            border-radius: 6px;
            padding: 5px 8px;
            position: absolute;
            z-index: 10;
            bottom: 125%;
            left: 50%;
            transform: translateX(-50%);
            transition: opacity 0.3s;
            font-size: 11px;
            pointer-events: none;
            box-shadow: 0 0 6px rgba(0,0,0,0.3);
          ">
            Défaites consécutives : ${-streakValue}
            <span style="
              position: absolute;
              top: 100%;
              left: 50%;
              margin-left: -5px;
              border-width: 5px;
              border-style: solid;
              border-color: #222 transparent transparent transparent;
            "></span>
          </span>
        </span>

        <style>
          span:hover > span {
            visibility: visible !important;
            opacity: 1 !important;
          }
        </style>
      `;
    }

    // Calcul des moyennes globales
    let totalGold = 0, totalCs = 0, totalKills = 0, totalDeaths = 0, totalAssists = 0, totalDuration = 0, totalTeamKills = 0;
    playerMatches.forEach(m => {
      totalGold += m.gold || 0;
      totalCs += m.cs || 0;
      totalKills += m.kills || 0;
      totalDeaths += m.deaths || 0;
      totalAssists += m.assists || 0;
      totalDuration += m.duration || 1;
      totalTeamKills += m.team_kills || 0;
    });

    const nbMatches = playerMatches.length || 1;
    const goldPerMinAvg = (totalGold / totalDuration) * 60;
    const csPerMinAvg = (totalCs / totalDuration) * 60;
    const kdaAvg = (totalKills + totalAssists) / Math.max(totalDeaths, 1);
    const kpAvg = totalTeamKills > 0 ? (((totalKills + totalAssists) / totalTeamKills) * 100).toFixed(0) : "0";

    modalStats.innerHTML = `
<div class="modal-header">
  <div class="player-info">
    <img 
      src="https://ddragon.leagueoflegends.com/cdn/14.9.1/img/profileicon/${player.profileIconId}.png"
      alt="Avatar"
      class="modal-avatar"
      onerror="this.onerror=null;this.src='https://ddragon.leagueoflegends.com/cdn/14.9.1/img/profileicon/29.png';"
    />
    <span class="modal-name">${player.name}</span>
    ${streakHtml}
  </div>
  <div class="rank-info" style="color: #aaa;">
    <img 
      src="assets/tiers/${player.tier.toLowerCase()}.png"
      alt="${player.tier}"
      class="rank-icon"
    />
    <div class="rank-text">${player.tier} ${player.rank} (${player.lp} LP)</div>
    <div class="rank-winrate">${player.winrate.toFixed(2)}% Winrate</div>
    <div class="rank-winrate">${player.wins}W / ${player.losses}L</div>

    <!-- Winrate par rôle -->
    <div class="role-averages" style="margin-top: 8px; font-size: 13px; font-weight: 600; color: inherit; ">
      <div style="margin-bottom: 6px; font-weight: 700;">Winrate par rôle :</div>
      ${(() => {
        const rolesMap = { TOP: [], JUNGLE: [], MIDDLE: [], BOTTOM: [], UTILITY: [] };
        playerMatches.forEach(match => {
          if (rolesMap[match.role]) rolesMap[match.role].push(match);
        });
        return Object.entries(rolesMap).map(([role, matches]) => {
          if (matches.length === 0) return '';
          const wins = matches.filter(m => m.win).length;
          const losses = matches.length - wins;
          const winrate = ((wins / matches.length) * 100).toFixed(0);
          return `
            <div style="display: flex; align-items: middle; text-align:middle; gap: 6px; margin-bottom: 2px; margin-left: 22px;">
              <img src="${getRoleIcon(role)}" alt="${role}" class="role-icon" style="width: 16px; height: 16px;" />
              <span>${winrate}% (${wins}W ${losses}L)</span>
            </div>
          `;
        }).join('');
      })()}
    </div>
  </div>
</div>

<div class="modal-details-flex">
  
  <!-- Section Champions joués reste à sa place -->
  <div class="champion-stats-section"></div>

  <!-- Section historique avec moyennes globales juste au-dessus -->
  <div class="match-history-section">

    <div style="margin: 10px 0 15px 0; display: flex; flex-direction: column; gap: 10px;">
      <div class="player-averages" style="font-weight: 600;">
        <div style="margin-bottom: 6px; font-weight: 700;">Moyennes globales :</div>
        KP : ${kpAvg}% &nbsp;&nbsp;
        <img src="assets/COIN.png" alt="Gold/min" title="Gold/min" class="header-icon"/><span>/min</span> : ${goldPerMinAvg.toFixed(1)} &nbsp;&nbsp;
        <img src="assets/MINION.png" alt="CS/min" title="CS/min" class="header-icon"/><span>/min</span> : ${csPerMinAvg.toFixed(1)} &nbsp;&nbsp;
        KDA : ${kdaAvg.toFixed(2)}
      </div>

      <div class="last-games-title">Historique des matchs récents</div>
    </div>

    <table class="player-history-table">
      <thead>
        <tr>
          <th>Champion</th>
          <th>Rôle</th>
          <th>Score</th>
          <th>KP</th>
          <th>
            <img src="assets/MINION.png" alt="CS/min" title="CS/min" class="header-icon"/><span>/min</span>
          </th>
          <th>Résultat</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody id="playerHistoryBody"></tbody>
    </table>
  </div>

</div>
`;


    // === Stats par champion ===
    const championStatsMap = {};
    playerMatches.forEach(match => {
      const champ = match.champion;
      if (!championStatsMap[champ]) {
        championStatsMap[champ] = {
          games: 0,
          wins: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          cs: 0,
          duration: 0
        };
      }
      const stats = championStatsMap[champ];
      stats.games += 1;
      if (match.win) stats.wins += 1;
      stats.kills += match.kills || 0;
      stats.deaths += match.deaths || 0;
      stats.assists += match.assists || 0;
      stats.cs += match.cs || 0;
      stats.duration += match.duration || 1;
    });

    const statsContainer = modalStats.querySelector(".champion-stats-section");
    const sortedChamps = Object.entries(championStatsMap)
      .sort((a, b) => b[1].games - a[1].games);

    statsContainer.innerHTML = `<div class="champion-title">Champions joués</div>`;
    sortedChamps.forEach(([champion, data]) => {
      const winrate = ((data.wins / data.games) * 100).toFixed(0);
      const kda = ((data.kills + data.assists) / Math.max(data.deaths, 1)).toFixed(2);
      const csPerMin = ((data.cs / data.duration) * 60).toFixed(1);
      const kdaClass = getKdaClass(parseFloat(kda));
      const losses = data.games - data.wins;

      statsContainer.innerHTML += `
        <div class="champion-row">
          <img src="https://ddragon.leagueoflegends.com/cdn/15.1.1/img/champion/${champion}.png" class="champion-icon" alt="${champion}">
          <div class="champion-info">
            <div><strong>${champion}</strong> (${data.games} game${data.games > 1 ? 's' : ''})</div>
            <div>Winrate: ${winrate}% (${data.wins}W ${losses}L)</div>
            <div class="kda-value">KDA: <span class="${kdaClass}">${kda}</span></div>
            <div>
              <img src="assets/MINION.png" alt="CS par minute" title="CS/min" class="header-icon cs-icon-right" />
              <span>/min : ${csPerMin}</span>
            </div>
          </div>
        </div>
      `;
    });

    // === Historique des matchs ===
    const tbody = modalStats.querySelector("#playerHistoryBody");
    const EMPTY_ITEM_ICON_URL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/items/icons2d/gp_ui_placeholder.png";

    if (playerMatches.length > 0) {
      playerMatches
        .sort((a, b) => b.timestamp - a.timestamp)
        .forEach(match => {
          const row = document.createElement("tr");
          row.className = match.win ? "win-row" : "lose-row";
    
          const date = timeSince(match.timestamp);
          const duration = match.duration || 1;
          const csPerMin = ((match.cs || 0) / duration * 60).toFixed(1);
          const teamKills = match.team_kills || 0;
          const kp = teamKills > 0 ? (((match.kills + match.assists) / teamKills) * 100).toFixed(0) : "0";
          const kpClass = kp > 60 ? 'high-kp' : '';
          const kda = `${match.kills}/${match.deaths}/${match.assists}`;
          const kdaRatio = (match.kills + match.assists) / Math.max(match.deaths, 1);
          const excellentBadge = kdaRatio > 4 && kp > 60 ? `<span class="badge-excellent">Excellent</span>` : '';
          const resultBadge = match.win
            ? `<span class="badge win">Victoire</span>`
            : `<span class="badge lose">Défaite</span>`;
    
          // Génération des 6 slots d'items (avec image grise si 0)
          const sortedItems = match.items
          .slice(0, 6)
          .sort((a, b) => (a === 0) - (b === 0)); // Les 0 à la fin
        
        const itemIcons = sortedItems
          .map(id => {
            const src = id !== 0 ? getItemIconUrl(id) : EMPTY_ITEM_ICON_URL;
            const alt = id !== 0 ? `Item ${id}` : "";
            return `<img src="${src}" class="item-icon" alt="${alt}">`;
          })
          .join('');

        const trinketId = match.items[6];
        const trinketIcon = trinketId !== 0
          ? `<img src="${getItemIconUrl(trinketId)}" class="item-icon trinket-icon" alt="Trinket ${trinketId}">`
          : `<img src="${EMPTY_ITEM_ICON_URL}" class="item-icon trinket-icon" alt="">`;
    
          row.innerHTML = `
            <td>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center;">
                  <img 
                    src="https://ddragon.leagueoflegends.com/cdn/15.1.1/img/champion/${match.champion}.png" 
                    class="champion-icon" 
                    alt="${match.champion}">
                  
                  <div class="champion-spell-wrapper">
                    <img src="${getSummonerIconUrl(match.summoners[0])}" alt="Spell 1">
                    <img src="${getSummonerIconUrl(match.summoners[1])}" alt="Spell 2">
                  </div>
          
                  <div class="champion-rune-wrapper">
                    <img src="${getRuneIconUrl(match.runes.keystone)}" class="keystone-rune" alt="Keystone">
                    <img src="${getRuneIconUrl(match.runes.secondary)}" class="secondary-rune" alt="Secondary Rune">
                  </div>
          
                  <div class="item-list">${itemIcons}${trinketIcon}</div>
                </div>
                ${excellentBadge}
              </div>
            </td>
            <td><img src="${getRoleIcon(match.role)}" alt="${match.role}" class="role-icon" /></td>
            <td>${kda}</td>
            <td class="kp ${kpClass}">${kp}%</td>
            <td class="cs-per-min">${csPerMin}</td>
            <td>${resultBadge}</td>
            <td>${date}</td>
          `;
          tbody.appendChild(row);
        });
    } else {
      tbody.innerHTML = `<tr><td colspan="7">Aucune partie récente.</td></tr>`;
    }
    modal.classList.remove("hidden");
    modal.classList.remove("modal-zoom-in", "modal-slide-right", "modal-bounce", "modal-fade-out");
    modal.classList.add("modal-fade-up");
    
        // Ajout de la fermeture via la croix native HTML
        const closeModalBtn = document.getElementById("closeModal");
        if (closeModalBtn) {
        closeModalBtn.onclick = () => {
            modal.classList.remove("modal-zoom-in", "modal-slide-right", "modal-bounce", "modal-fade-up");
            modal.classList.add("modal-fade-out");

            modal.addEventListener("animationend", function handler() {
            modal.classList.add("hidden");
            modal.classList.remove("modal-fade-out");
            modal.removeEventListener("animationend", handler);
            });
        };
        }

 
   // ✅ Gestion fermeture en cliquant en dehors de la box
   function outsideClickHandler(e) {
     if (e.target === modal) {
       modal.classList.remove("modal-zoom-in", "modal-slide-right", "modal-bounce", "modal-fade-up");
       modal.classList.add("modal-fade-out");
 
       modal.addEventListener("animationend", function handler() {
         modal.classList.add("hidden");
         modal.classList.remove("modal-fade-out");
         modal.removeEventListener("animationend", handler);
       });
 
       window.removeEventListener("click", outsideClickHandler); // nettoyage
     }
   }
   window.addEventListener("click", outsideClickHandler);
 }
  


  export { showPlayerModal };
