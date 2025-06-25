import requests
import json
import os
import time

MAX_REQUESTS_PER_SECOND = 19  # on prend 19 par précaution
API_KEY = os.getenv("RIOT_API_KEY")
headers = {
    "X-Riot-Token": API_KEY
}
request_count = 0
start_time = time.time()

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

def rate_limited_request(url, headers):
    global request_count, start_time

    while True:
        now = time.time()

        # Reset toutes les 1s
        if now - start_time >= 1:
            request_count = 0
            start_time = now

        # Si trop de requêtes, on attend
        if request_count >= MAX_REQUESTS_PER_SECOND:
            sleep_time = 1 - (now - start_time)
            if sleep_time > 0:
                print(f"[⏳] Limite atteinte, pause {sleep_time:.2f}s")
                time.sleep(sleep_time)
            request_count = 0
            start_time = time.time()

        # Faire la requête
        response = requests.get(url, headers=headers)
        request_count += 1

        # Si tout va bien, retourner la réponse
        if response.status_code == 200:
            return response

        # Si on dépasse les quotas
        elif response.status_code == 429:
            retry_after = int(response.headers.get("Retry-After", 1))
            print(f"[⚠️] Rate limit dépassé. Attente {retry_after} secondes.")
            time.sleep(retry_after)
            continue  # Refaire la requête

        else:
            # Retourner même si ce n’est pas 200 (on laisse ton script gérer)
            return response


def get_last_ranked_solo_game_timestamp(puuid, platform_routing="europe", max_matches=10):
    url_matches = f"https://{platform_routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?count={max_matches}"
    r = rate_limited_request(url_matches, headers=headers)
    if r.status_code != 200:
        print(f"Erreur récupération matchs : {r.status_code}")
        return None
    
    match_ids = r.json()
    last_ranked_time = None

    for match_id in match_ids:
        url_match_detail = f"https://{platform_routing}.api.riotgames.com/lol/match/v5/matches/{match_id}"
        r_match = rate_limited_request(url_match_detail, headers=headers)
        if r_match.status_code != 200:
            print(f"Erreur récupération détail match {match_id}: {r_match.status_code}")
            continue
        match_data = r_match.json()
        queue_id = match_data.get("info", {}).get("queueId", 0)

        # 420 = Ranked Solo queue id
        if queue_id == 420:
            game_start = match_data["info"]["gameStartTimestamp"]  # en ms depuis epoch
            if last_ranked_time is None or game_start > last_ranked_time:
                last_ranked_time = game_start

    if last_ranked_time is None:
        return None
    else:
        return last_ranked_time
    

def get_ranked_solo_match_history(puuid, player_name, platform_routing="europe", max_matches=20):
    url_matches = f"https://{platform_routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?count={max_matches}"
    r = rate_limited_request(url_matches, headers=headers)
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

        main_player = next((p for p in participants if p["puuid"] == puuid), None)
        if not main_player:
            continue

        team_id = main_player["teamId"]
        team_kills = sum(p.get("kills", 0) for p in participants if p["teamId"] == team_id)

        players_info = []
        for p in participants:
            players_info.append({
                "name": f"{p['riotIdGameName']}#{p['riotIdTagline']}" if 'riotIdGameName' in p and 'riotIdTagline' in p else "Unknown",
                "champion": p.get("championName"),
                "kills": p.get("kills"),
                "deaths": p.get("deaths"),
                "assists": p.get("assists"),
                "gold": p.get("goldEarned"),
                "cs": p.get("totalMinionsKilled", 0) + p.get("neutralMinionsKilled", 0),
                "damage": p.get("totalDamageDealtToChampions"),
                "role": p.get("teamPosition"),
                "visionScore": p.get("visionScore", 0),
                "items": [p.get(f"item{i}") for i in range(7)],
                "summoners": [p.get("summoner1Id"), p.get("summoner2Id")],
                "runes": {
                    "primary": p.get("perks", {}).get("styles", [{}])[0].get("style"),
                    "keystone": p.get("perks", {}).get("styles", [{}])[0].get("selections", [{}])[0].get("perk"),
                    "secondary": p.get("perks", {}).get("styles", [{}])[1].get("style")
                }
            })

        # Récupération des objectifs par équipe
        teams = match_data.get("info", {}).get("teams", [])
        objectives = {"blue": {}, "red": {}}

        for team in teams:
            team_key = "blue" if team["teamId"] == 100 else "red"
            team_obj = team.get("objectives", {})
            team_feats = team.get("feats", {})

            objectives[team_key] = {
                "towers": team_obj.get("tower", {}).get("kills", 0),
                "dragons": team_obj.get("dragon", {}).get("kills", 0),
                "barons": team_obj.get("baron", {}).get("kills", 0),
                "heralds": team_obj.get("riftHerald", {}).get("kills", 0),
                "grubs": team_obj.get("horde", {}).get("kills", 0),
                "atakhans": team_obj.get("atakhan", {}).get("kills", 0),
                "firstBlood": team_feats.get("FIRST_BLOOD", {}).get("featState", 0),
                "firstTurret": team_feats.get("FIRST_TURRET", {}).get("featState", 0),
                "epicMonsterKill": team_feats.get("EPIC_MONSTER_KILL", {}).get("featState", 0)
            }

        ranked_history.append({
            "match_id": match_id,
            "timestamp": game_start,
            "player": player_name,
            "win": main_player.get("win"),
            "team_kills": team_kills,
            "players": players_info,
            "duration": info.get("gameDuration"),
            "objectives": objectives
        })

    return ranked_history


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
global_history = []
for riot_id in riot_ids:
    try:
        game_name, tag_line = riot_id.split("#")
    except ValueError:
        print(f"[!] Format invalide : {riot_id}")
        continue
    time.sleep(0.5)
    ACCOUNT_ROUTING = "europe"
    PLATFORM_ROUTING = "euw1"

    # Obtenir le PUUID
    url_account = f"https://{ACCOUNT_ROUTING}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"
    r1 = rate_limited_request(url_account, headers=headers)
    if r1.status_code != 200:
        print(f"Erreur pour {riot_id} (account API): {r1.status_code}")
        continue

    puuid = r1.json()["puuid"]
    full_player_name = f"{game_name}#{tag_line}"
    # Obtenir le summonerId
    url_summoner = f"https://{PLATFORM_ROUTING}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{puuid}"
    r2 = rate_limited_request(url_summoner, headers=headers)
    if r2.status_code != 200:
        print(f"Erreur pour {riot_id} (summoner API): {r2.status_code}")
        continue

    summoner_data = r2.json()
    if "id" not in summoner_data:
        print(f"[❌] Données incomplètes pour {riot_id}. Réponse: {json.dumps(summoner_data, indent=2)}")
        continue
    summoner_id = summoner_data["id"]

    # Obtenir les stats classées
    url_ranked = f"https://{PLATFORM_ROUTING}.api.riotgames.com/lol/league/v4/entries/by-summoner/{summoner_id}"
    r3 = rate_limited_request(url_ranked, headers=headers)
    if r3.status_code != 200:
        print(f"Erreur pour {riot_id} (ranked stats): {r3.status_code}")
        continue

    ranked_data = r3.json()
    soloq_data = next((entry for entry in ranked_data if entry["queueType"] == "RANKED_SOLO_5x5"), None)

    #Obtenir détails dernier match
    last_game_timestamp = get_last_ranked_solo_game_timestamp(puuid, ACCOUNT_ROUTING, max_matches=10)
    player_history = get_ranked_solo_match_history(puuid, full_player_name, ACCOUNT_ROUTING, max_matches=20)
    global_history.extend(player_history)

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

# Tri par elo 
players_stats.sort(key=sort_key, reverse=True)


with open("leaderboard.json", "w") as f:
    json.dump({
        "players": players_stats,
        "global_match_history": global_history
    }, f, indent=2)
