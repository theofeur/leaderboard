import { getStreakValue } from "./streak.js";
import { showPlayerModal } from "./modal.js";

function timeSince(timestampMs) {
    if (!timestampMs) return "Aucune partie récente";

    const now = Date.now();
    const diffMs = now - timestampMs;
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `Il y a quelques secondes`;
}

function switchTab(tabId) {
    const container = document.querySelector('.tab-container');
    const tabs = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-btn');

    // Désactiver tous les onglets et boutons
    tabs.forEach(tab => tab.classList.remove('active'));
    buttons.forEach(btn => btn.classList.remove('active'));

    // Activer l’onglet et le bouton correspondant
    const activeTab = document.getElementById(tabId);
    activeTab.classList.add('active');

    const activeBtn = document.querySelector(`[onclick="switchTab('${tabId}')"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Ajuster la hauteur
    container.style.height = activeTab.scrollHeight + 'px';
  }

  function displayLeaderboard(sortedData, allMatches) {
    const tbody = document.querySelector("#leaderboard tbody");
    tbody.innerHTML = "";

    sortedData.forEach((player, index) => {
        const imgTier = `assets/tiers/${player.tier.toLowerCase()}.png`;
        const imgIcon = `https://ddragon.leagueoflegends.com/cdn/14.9.1/img/profileicon/${player.profileIconId}.png`;
        const [playerName, playerTag] = player.name.split("#");
        const lastGame = timeSince(player.lastGameTimestamp);
        const playerMatches = allMatches.filter(m => m.player === player.name)
                               .sort((a,b) => b.timestamp - a.timestamp);

        // Calcul streak avec ta fonction (à ajuster selon ton code)
        const streakValue = getStreakValue(playerMatches);                       
        let streakHtml = '';
        if (streakValue > 0) {
          streakHtml = `
        <span class="streak-badge" style="
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

          <span class="tooltip" style="
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
      `;
        } else if (streakValue < 0) {
          streakHtml = `
        <span class="streak-badge" style="
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

          <span class="tooltip" style="
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
      `;
        } else {
          streakHtml = '';
        }
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${index + 1}</td>
          <td class="highlight">
            <img 
              src="https://ddragon.leagueoflegends.com/cdn/14.9.1/img/profileicon/${player.profileIconId}.png" 
              alt="Icon" 
              style="width: 24px; vertical-align: middle; border-radius: 50%; margin-right: 8px;"
              onerror="this.onerror=null;this.src='https://ddragon.leagueoflegends.com/cdn/14.9.1/img/profileicon/29.png';"
            />
            ${player.name}
            <a href="https://www.op.gg/summoners/euw/${playerName}-${playerTag}" target="_blank" class="opgg-link">
              <img src="assets/opgg-icon.png" alt="OP.GG" class="opgg-icon"/></a>
            ${streakHtml}
          </td>
          <td>
              <img src="${imgTier}" alt="${player.tier}" style="width: 30px; vertical-align: middle; margin-right: 8px;" />
              ${player.tier} ${player.rank}
          </td>
          <td>${player.lp} LP</td>
          <td>${player.winrate.toFixed(1)}%</td>
          <td>${player.wins}W / ${player.losses}L</td>
          <td>${lastGame}</td> 
        `;

        tr.addEventListener("click", () => {
          
        showPlayerModal(player,allMatches); // Appelle ta fonction de popup
        });            
        // Empêche l’ouverture du popup lors du clic sur l'icône OP.GG
        const opggLink = tr.querySelector(".opgg-link");
        if (opggLink) {
          opggLink.addEventListener("click", (event) => {
            event.stopPropagation();
          });

      }
      
      tbody.appendChild(tr);
      });
    
      // Une fois que TOUT le tbody est généré, on ajuste la hauteur
      waitForImagesToLoad(document.getElementById("leaderboard-tab"), () => {
        const container = document.querySelector(".tab-container");
        const activeTab = document.querySelector(".tab-content.active");
        if (container && activeTab) {
          container.style.height = activeTab.scrollHeight + "px";
        }
      });
  }

// Fonction pour attendre que toutes les images soient chargées
    // avant d'ajuster la hauteur du conteneur
    // et d'afficher le tableau
    function waitForImagesToLoad(container, callback) {
        const images = container.querySelectorAll("img");
        let loadedCount = 0;
        const total = images.length;

        if (total === 0) return callback();

        images.forEach((img) => {
          if (img.complete) {
            loadedCount++;
            if (loadedCount === total) callback();
          } else {
            img.addEventListener("load", () => {
              loadedCount++;
              if (loadedCount === total) callback();
            });
            img.addEventListener("error", () => {
              loadedCount++;
              if (loadedCount === total) callback();
            });
          }
        });
      }

export { timeSince, switchTab, displayLeaderboard, waitForImagesToLoad };