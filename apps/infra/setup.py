#!/usr/bin/env python3
"""
setup.py — Anki MCP Cloud setup script

Extracts AnkiWeb credentials from your local Anki profile, prompts for
your ngrok auth token, and writes everything into terraform.tfvars so
you can run `terraform apply` without manually touching any files.

Usage: python3 setup.py
"""

import os
import sys
import sqlite3
import pickle
import platform
import re

# ─── COLORS ──────────────────────────────────────────────────────────────────

class c:
    RESET  = "\033[0m"
    BOLD   = "\033[1m"
    GREEN  = "\033[32m"
    YELLOW = "\033[33m"
    CYAN   = "\033[36m"
    RED    = "\033[31m"
    DIM    = "\033[2m"

def ok(msg):     print(f"{c.GREEN}✓{c.RESET} {msg}", flush=True)
def info(msg):   print(f"{c.CYAN}→{c.RESET} {msg}", flush=True)
def warn(msg):   print(f"{c.YELLOW}⚠{c.RESET}  {msg}", flush=True)
def err(msg):    print(f"{c.RED}✗{c.RESET} {msg}", flush=True); sys.exit(1)
def header(msg): print(f"\n{c.BOLD}{msg}{c.RESET}\n", flush=True)

# ─── LOCATE ANKI PROFILE ─────────────────────────────────────────────────────

def default_anki_paths():
    system = platform.system()
    if system == "Darwin":
        return [os.path.expanduser("~/Library/Application Support/Anki2")]
    elif system == "Linux":
        return [
            os.path.expanduser("~/.local/share/Anki2"),
            os.path.expanduser("~/.anki2"),
        ]
    elif system == "Windows":
        appdata = os.environ.get("APPDATA", "")
        return [os.path.join(appdata, "Anki2")]
    return []

def find_anki_base():
    for path in default_anki_paths():
        if os.path.isdir(path):
            return path
    return None

def pick_profile(anki_base):
    profiles = [
        d for d in os.listdir(anki_base)
        if os.path.isdir(os.path.join(anki_base, d))
        and not d.startswith(".")
        and d not in ("addons21", "logs", "temp", "backup")
    ]
    return profiles

# ─── EXTRACT CREDENTIALS ─────────────────────────────────────────────────────

def extract_credentials(anki_base, profile_name):
    db_path = os.path.join(anki_base, "prefs21.db")
    if not os.path.exists(db_path):
        db_path = os.path.join(anki_base, "prefs.db")
    if not os.path.exists(db_path):
        err(f"Could not find prefs21.db or prefs.db in {anki_base}")

    conn = sqlite3.connect(db_path)
    rows = conn.execute("SELECT name, data FROM profiles").fetchall()
    conn.close()

    for name, data in rows:
        if name == profile_name:
            profile = pickle.loads(data)
            return profile.get("syncUser", ""), profile.get("syncKey", "")

    err(f"Profile '{profile_name}' not found in prefs21.db")

# ─── WRITE TERRAFORM.TFVARS ───────────────────────────────────────────────────

def write_tfvars(sync_user, sync_key, profile_name, ngrok_token):
    tfvars_path = os.path.join(os.path.dirname(__file__), "terraform.tfvars")

    if os.path.exists(tfvars_path):
        with open(tfvars_path, "r") as f:
            content = f.read()

        def upsert(content, key, value):
            pattern = rf'{key}\s*=\s*".*?"'
            replacement = f'{key} = "{value}"'
            if re.search(pattern, content):
                return re.sub(pattern, replacement, content)
            return content + f'\n{key} = "{value}"'

        content = upsert(content, "anki_sync_user",    sync_user)
        content = upsert(content, "anki_sync_key",     sync_key)
        content = upsert(content, "anki_profile_name", profile_name)
        content = upsert(content, "ngrok_auth_token",  ngrok_token)

        with open(tfvars_path, "w") as f:
            f.write(content)
    else:
        with open(tfvars_path, "w") as f:
            f.write(f'aws_region        = "us-east-1"\n')
            f.write(f'instance_type     = "t3.micro"\n')
            f.write(f'anki_profile_name = "{profile_name}"\n')
            f.write(f'anki_sync_user    = "{sync_user}"\n')
            f.write(f'anki_sync_key     = "{sync_key}"\n')
            f.write(f'ngrok_auth_token  = "{ngrok_token}"\n')

    ok(f"terraform.tfvars written")

# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    sys.stdout.flush()
    header("=== Anki MCP Cloud — Setup ===")

    # 1. Find Anki base directory
    anki_base = find_anki_base()

    if anki_base:
        print(f"{c.CYAN}→{c.RESET} {anki_base}")
        answer = input(f"{c.CYAN}→{c.RESET} Use this profile directory? (y/n): ").strip().lower()
        if answer != "y":
            anki_base = None

    if not anki_base:
        anki_base = input(f"{c.CYAN}→{c.RESET} Paste your Anki2 directory path: ").strip().strip("'\"")
        if not os.path.isdir(anki_base):
            err(f"Directory not found: {anki_base}")

    # 2. Pick profile
    profiles = pick_profile(anki_base)

    if not profiles:
        err("No profiles found in Anki directory.")
    elif len(profiles) == 1:
        profile_name = profiles[0]
        ok(f"Using profile: {c.BOLD}{profile_name}{c.RESET}")
    else:
        print(f"\n{c.YELLOW}Multiple profiles found:{c.RESET}")
        for i, p in enumerate(profiles):
            print(f"  {c.DIM}{i+1}.{c.RESET} {p}")
        choice = input(f"{c.CYAN}→{c.RESET} Enter number: ").strip()
        try:
            profile_name = profiles[int(choice) - 1]
        except (ValueError, IndexError):
            err("Invalid choice.")

    # 3. Extract credentials
    info(f"Extracting credentials from profile '{profile_name}'...")
    sync_user, sync_key = extract_credentials(anki_base, profile_name)

    if not sync_key:
        err("No syncKey found. Make sure you've logged into AnkiWeb and synced at least once in Anki Desktop.")

    ok(f"Found credentials for: {c.BOLD}{sync_user}{c.RESET}")

    # 4. Prompt for ngrok auth token
    import getpass
    print()
    info("Get your ngrok auth token from: https://dashboard.ngrok.com/get-started/your-authtoken")
    ngrok_token = getpass.getpass(f"{c.CYAN}→{c.RESET} Enter ngrok auth token: ").strip()
    if not ngrok_token:
        err("ngrok auth token is required.")
    ok("ngrok auth token received")

    # 5. Write terraform.tfvars
    write_tfvars(sync_user, sync_key, profile_name, ngrok_token)

    print(f"\n{c.GREEN}{c.BOLD}All done!{c.RESET} Next steps:")
    print(f"  {c.DIM}1.{c.RESET} terraform init")
    print(f"  {c.DIM}2.{c.RESET} terraform plan")
    print(f"  {c.DIM}3.{c.RESET} terraform apply")
    print(f"\n{c.DIM}After deploy, get your MCP URL:{c.RESET}")
    print(f"  ssh -i anki-mcp-key.pem ubuntu@<ip> cat /opt/ngrok-url.txt")

if __name__ == "__main__":
    main()