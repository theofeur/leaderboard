import requests
import json
import os

API_KEY = os.getenv("RIOT_API_KEY")
headers = {"X-Riot-Token": API_KEY}

TIER_ORDER = {
    "UNRANKED": 0,
    "IRON": 1,
    "BRONZE": 2,
    "SILVER": 3,
    "GOLD": 4,
    "PLATINUM": 5,
    "EMERALD": 6,
    "DIAMOND": 7,
    "MASTER": 8,
    "GRANDMASTER": 8,
    "CHALLENGER": 8
}

RANK_ORDER = {
    "IV": 1,
    "III": 2,
    "II": 3,
    "I": 4
}

def sort_key(player):
    tier_value = TIER_ORDER.get(player["tier"], -1)
    rank_value = RANK_ORDER.get(player["rank"], 0)

    # Pour Master/GM/Challenger, seul le LP compte
    if tier_value == 8:
        return (tier_value, player["lp"])
    else:
        return (tier_value, rank_value)

with open("list.json", "r") as f:
    riot_ids = json.load(f)

players_stats = []

for riot_id in riot_ids:
    try:
        game_name, tag_line = riot_id.split("#")
    except ValueError:
        print(f"[!] Format invalide : {riot_id}")
        continue

    ACCOUNT_ROUTING = "europe"
    PLATFORM_ROUTING = "euw1"

    # Obtenir le PUUID
    url_account = f"https://{ACCOUNT_ROUTING}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"
    r1 = requests.get(url_account, headers=headers)
    if r1.status_code != 200:
        print(f"Erreur pour {riot_id} (account API): {r1.status_code}")
        continue

    puuid = r1.json()["puuid"]

    # Obtenir le summonerId
    url_summoner = f"https://{PLATFORM_ROUTING}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{puuid}"
    r2 = requests.get(url_summoner, headers=headers)
    if r2.status_code != 200:
        print(f"Erreur pour {riot_id} (summoner API): {r2.status_code}")
        continue

    summoner_data = r2.json()
    summoner_id = summoner_data["id"]

    # Obtenir les stats classées
    url_ranked = f"https://{PLATFORM_ROUTING}.api.riotgames.com/lol/league/v4/entries/by-summoner/{summoner_id}"
    r3 = requests.get(url_ranked, headers=headers)
    if r3.status_code != 200:
        print(f"Erreur pour {riot_id} (ranked stats): {r3.status_code}")
        continue

    ranked_data = r3.json()
    soloq_data = next((entry for entry in ranked_data if entry["queueType"] == "RANKED_SOLO_5x5"), None)

    #Obtenir détails dernier match
    url_matches = f"https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?start=0&count=1"
    r_matches = requests.get(url_matches, headers=headers)
    if r_matches.status_code != 200:
        print(f"Erreur pour {riot_id} (match list): {r_matches.status_code}")
        last_game_timestamp = None
    else:
        match_ids = r_matches.json()
        if len(match_ids) == 0:
            last_game_timestamp = None
        else:
            last_match_id = match_ids[0]
            # Récupérer les détails du dernier match
            url_match_detail = f"https://europe.api.riotgames.com/lol/match/v5/matches/{last_match_id}"
            r_match_detail = requests.get(url_match_detail, headers=headers)
            if r_match_detail.status_code != 200:
                print(f"Erreur pour {riot_id} (match detail): {r_match_detail.status_code}")
                last_game_timestamp = None
            else:
                match_info = r_match_detail.json()["info"]
                last_game_timestamp = match_info.get("gameStartTimestamp", None)  # en ms

    if soloq_data:
        wins = soloq_data["wins"]
        losses = soloq_data["losses"]
        total = wins + losses
        if total == 0:
            continue

        winrate = 100 * wins / total
        tier = soloq_data["tier"]
        rank = soloq_data["rank"]
        lp = soloq_data["leaguePoints"]
    else:
        # Unranked
        tier = "UNRANKED"
        rank = "-"
        lp = 0
        winrate = 0
        wins = 0
        losses = 0
    players_stats.append({
            "name": f"{game_name}#{tag_line}",
            "winrate": winrate,
            "wins": wins,
            "losses": losses,
            "tier": tier,
            "rank": rank,
            "lp": lp,
            "profileIconId": summoner_data["profileIconId"],
            "lastGameTimestamp": last_game_timestamp
        })


# Trier par winrate décroissant
players_stats.sort(key=lambda x: x["winrate"], reverse=True)

# Affichage classement
print("\n🎯 Classement par Winrate :")
for i, player in enumerate(players_stats, 1):
    print(f"{i}. {player['name']} - {player['winrate']:.2f}% ({player['wins']}W/{player['losses']}L) - {player['tier']} {player['rank']} {player['lp']} LP")

# 🔢 Tri personnalisé


players_stats.sort(key=sort_key, reverse=True)

# 🖨️ Affichage du leaderboard
print("\n🎯 Leaderboard par Tier personnalisé :")
for i, p in enumerate(players_stats, 1):
    print(f"{i}. {p['name']} - {p['tier']} {p['rank']} ({p['lp']} LP) - {p['winrate']:.1f}% WR ({p['wins']}W/{p['losses']}L)")    


with open("leaderboard.json", "w") as f:
    json.dump(players_stats, f, indent=2)    
