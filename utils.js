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

      function getSummonerIconUrl(spellId) {
        const summonerSpellMap = {
          1: "SummonerBoost",
          3: "SummonerExhaust",
          4: "SummonerFlash",
          6: "SummonerHaste",
          7: "SummonerHeal",
          11: "SummonerSmite",
          12: "SummonerTeleport",
          13: "SummonerMana",
          14: "SummonerDot",
          21: "SummonerBarrier",
          32: "SummonerSnowball",
          39: "SummonerSnowURFSnowball_Mark"
        };
      
        const spellName = summonerSpellMap[spellId];
        if (!spellName) return null;
      
        return `https://ddragon.leagueoflegends.com/cdn/15.1.1/img/spell/${spellName}.png`;
      }

      function getRuneIconUrl(runeId) {
        const runeIconMap = {
          // Precision
          8000: "perk-images/Styles/7201_Precision.png",
          8005: "perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png",
          8008: "perk-images/Styles/Precision/LethalTempo/LethalTempoTemp.png",
          8021: "perk-images/Styles/Precision/FleetFootwork/FleetFootwork.png",
          8010: "perk-images/Styles/Precision/Conqueror/Conqueror.png",
      
          // Domination
          8100: "perk-images/Styles/7200_Domination.png",
          8112: "perk-images/Styles/Domination/Electrocute/Electrocute.png",
          8124: "perk-images/Styles/Domination/Predator/Predator.png",
          8128: "perk-images/Styles/Domination/DarkHarvest/DarkHarvest.png",
          9923: "perk-images/Styles/Domination/HailOfBlades/HailOfBlades.png",
      
          // Sorcery
          8200: "perk-images/Styles/7202_Sorcery.png",
          8214: "perk-images/Styles/Sorcery/SummonAery/SummonAery.png",
          8229: "perk-images/Styles/Sorcery/ArcaneComet/ArcaneComet.png",
          8230: "perk-images/Styles/Sorcery/PhaseRush/PhaseRush.png",
      
          // Resolve
          8400: "perk-images/Styles/7204_Resolve.png",
          8437: "perk-images/Styles/Resolve/GraspOfTheUndying/GraspOfTheUndying.png",
          8439: "perk-images/Styles/Resolve/VeteranAftershock/VeteranAftershock.png",
          8465: "perk-images/Styles/Resolve/Guardian/Guardian.png",
      
          // Inspiration
          8300: "perk-images/Styles/7203_Whimsy.png",
          8351: "perk-images/Styles/Inspiration/GlacialAugment/GlacialAugment.png",
          8360: "perk-images/Styles/Inspiration/UnsealedSpellbook/UnsealedSpellbook.png",
          8369: "perk-images/Styles/Inspiration/FirstStrike/FirstStrike.png",
        };
      
        const path = runeIconMap[runeId];
        if (!path) return null;
      
        return `https://ddragon.leagueoflegends.com/cdn/img/${path}`;
      }

      function getItemIconUrl(itemId) {
        if (itemId === 0) return ""; // Aucun item
        return `https://ddragon.leagueoflegends.com/cdn/15.1.1/img/item/${itemId}.png`;
      }

      
      function generateTeamObjectivesHTML(obj, color) {
        const icon = (src, label, count) => `
          <div class="objective-item" title="${label}">
            <img src="${src}" alt="${label}" class="objective-icon">
            <span>${count}</span>
          </div>
        `;
      
        return `
          <div class="team-objectives">
            ${icon(`assets/objectives/grub-${color}.png`, 'Grubs tués', obj.grubs)}
            ${icon(`assets/objectives/dragon-${color}.png`, 'Dragons tués', obj.dragons)}
            ${icon(`assets/objectives/tower-${color}.png`, 'Tourelles détruites', obj.towers)}
            ${icon(`assets/objectives/herald-${color}.png`, 'Herald tué', obj.heralds)}
            ${icon(`assets/objectives/atakhan-${color}.png`, 'Atakhan tué', obj.atakhans)}
            ${icon(`assets/objectives/baron-${color}.png`, 'Barons tués', obj.barons)}
          </div>
        `;
      }

export { timeSince, switchTab, displayLeaderboard, waitForImagesToLoad, getSummonerIconUrl ,getRuneIconUrl, getItemIconUrl, generateTeamObjectivesHTML};