#!/usr/bin/env python3
"""
Fetch Nova Terra API requests and generate a TODO list grouped by difficulty.
"""

import os
import requests
from collections import defaultdict

API_URL = "https://24h.webcup.fr/wp-json/webcup/v1/requests"
API_KEY = os.getenv("WEBCUP_API_KEY", "NO_API_KEY_FOUND")

CWD = os.getcwd()

if API_KEY == "NO_API_KEY_FOUND":
    raise ValueError("Please set the WEBCUP_API_KEY environment variable.")

HEADERS = {"X-Webcup-Api-Key": API_KEY}

DIFFICULTY_ORDER = {
    "Facile": 1,
    "Moyenne": 2,
    "Difficile": 3,
    "Expert": 4,
}

SUMMARY_KEYWORDS = {
    "D01": "Inscription / création de compte habitant",
    "D03": "Connexion + espace personnel",
    "D04": "Contact administration (formulaire + accusé)",
    "D05": "Présentation des services municipaux",
    "D06": "Publications / annonces municipales",
    "D07": "Page d'accueil claire et hiérarchisée",
    "D08": "Rôles : citoyen / agent / admin",
    "D09": "Permissions / accès différenciés",
    "D19": "Espace agents avec vue sur les données API",
    "F22": "Vue des demandes habitants avec états",
    "F37": "Protection contre les tentatives de connexion répétées",
    "F69": "Protection des données sensibles",
}


def fetch_requests():
    resp = requests.get(API_URL, headers=HEADERS, timeout=10)
    resp.raise_for_status()
    return resp.json()


def summarize_request(req: dict) -> str:
    code = req["request_code"]
    if code in SUMMARY_KEYWORDS:
        return SUMMARY_KEYWORDS[code]
    # Fallback: truncate message
    msg = req.get("message_public", "")
    return (msg[:80] + "…") if len(msg) > 80 else msg


def generate_todo(data: dict) -> str:
    requests_list = data.get("requests", [])
    grouped = defaultdict(list)

    for req in requests_list:
        diff = req["difficulty"]
        grouped[diff].append(req)

    lines = []
    lines.append("# TODO list – Besoins Nova Terra\n")

    total_xp = 0

    for diff in sorted(grouped.keys(), key=lambda d: DIFFICULTY_ORDER.get(d, 99)):
        items = grouped[diff]
        lines.append(f"## {diff}\n")
        for req in sorted(items, key=lambda r: r["request_code"]):
            code = req["request_code"]
            xp = req["xp_available"]
            total_xp += xp
            summary = summarize_request(req)
            lines.append(f"- [ ] **{code}** ({xp} XP) – {summary}")
        lines.append("")

    lines.append(f"**Total XP disponibles :** {total_xp} XP\n")
    return "\n".join(lines)

def is_in_root_project_dir() -> bool:
    """
    Check if the script is being run from the root of the project directory.
    This is determined by checking for the presence of a 'docs' directory.
    """
    return os.path.isdir(os.path.join(CWD, "docs")) and os.path.isdir(os.path.join(CWD, "scripts"))


def main():
    if not is_in_root_project_dir():
        print("Error: This script must be run from the root of the project directory.")
        return

    data = fetch_requests()
    todo_md = generate_todo(data)
    print(todo_md)


    # Optionally save to file
    with open("docs/TODO_terra_nova.md", "w", encoding="utf-8") as f:
        f.write(todo_md)


if __name__ == "__main__":
    main()
