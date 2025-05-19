import requests
import time

api_key = "RGAPI-61923cf2-b746-4891-84a2-fe7604a1aeaa"
riot_id = "Depression"
tag_line = "LIFE"

account_routing = "europe"    # Pour Riot ID (PUUID)
region = "euw1"               # Pour matchs
platform_routing = "europe"  # Pour les endpoints match-v5

headers = {
    "X-Riot-Token": api_key
}

# --- Fonction pour éviter d'exploser la limite de rate (simple sleep) ---
def rate_limited_request(url, headers=None, params=None):
    time.sleep(1.2)  # Petite pause pour éviter un rate limit trop agressif
    response = requests.get(url, headers=headers, params=params)
    return response

# --- Étape 1 : récupérer le PUUID ---
url_puuid = f"https://{account_routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{riot_id}/{tag_line}"
resp = rate_limited_request(url_puuid, headers=headers)

if resp.status_code != 200:
    print(f"Erreur récupération PUUID : {resp.status_code} {resp.text}")
    exit()

puuid = resp.json()["puuid"]
print(f"PUUID de {riot_id}#{tag_line} : {puuid}")

# --- Étape 2 : fonction principale pour récupérer l'historique ranked solo ---
def get_ranked_solo_match_history(puuid, player_name, platform_routing="europe", max_matches=10):
    url_matches = f"https://{platform_routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids"
    params = {"count": max_matches}
    r = rate_limited_request(url_matches, headers=headers, params=params)
    
    if r.status_code != 200:
        print(f"Erreur récupération matchs : {r.status_code}")
        return []

    match_ids = r.json()
    ranked_history = []

    for match_id in match_ids:
        url_match_detail = f"https://{platform_routing}.api.riotgames.com/lol/match/v5/matches/{match_id}"
        r_match = rate_limited_request(url_match_detail, headers=headers)
        if r_match.status_code != 200:
            print(f"Erreur récupération détail match {match_id}: {r_match.status_code}")
            continue

        match_data = r_match.json()
        info = match_data.get("info", {})
        queue_id = info.get("queueId", 0)

        if queue_id != 420:
            continue  # On ne garde que les Ranked Solo

        game_start = info.get("gameStartTimestamp")
        participants = info.get("participants", [])

        for p in participants:
            if p.get("puuid") == puuid:
                ranked_history.append({
                    "match_id": match_id,
                    "timestamp": game_start,
                    "player": player_name,
                    "champion": p.get("championName"),
                    "win": p.get("win"),
                    "kills": p.get("kills"),
                    "deaths": p.get("deaths"),
                    "assists": p.get("assists"),
                    "cs": p.get("totalMinionsKilled", 0) + p.get("neutralMinionsKilled", 0),
                    "gold": p.get("goldEarned"),
                    "damage": p.get("totalDamageDealtToChampions")
                })
                break

    return ranked_history

# --- Étape 3 : Récupérer et afficher les stats ---
ranked_matches = get_ranked_solo_match_history(puuid, f"{riot_id}#{tag_line}")

for i, match in enumerate(ranked_matches):
    print(f"\nMatch {i + 1} :")
    for key, value in match.items():
        print(f"  {key}: {value}")
