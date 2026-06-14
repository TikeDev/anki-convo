#!/bin/bash
set -e

# ─── VARIABLES ───────────────────────────────────────────────────────────────
# Injected by Terraform templatefile() at deploy time
ANKI_SYNC_USER="${anki_sync_user}"
ANKI_SYNC_KEY="${anki_sync_key}"
ANKI_PROFILE_NAME="${anki_profile_name}"
NGROK_AUTH_TOKEN="${ngrok_auth_token}"
ANKI_DATA_DIR="/opt/anki-data"

# ─── SYSTEM SETUP ────────────────────────────────────────────────────────────
apt-get update -y
apt-get install -y docker.io python3 curl unzip jq

systemctl enable docker
systemctl start docker

# ─── PULL BASE IMAGE ─────────────────────────────────────────────────────────
# Use the pre-built x11-vnc image from ghcr.io.
# VOLUME /data in the base image discards writes during child image builds,
# so addons are downloaded to the host and mounted as a volume instead.
docker pull ghcr.io/ankimcp/headless-anki:x11-vnc-v1.0.0

# ─── DOWNLOAD ADDON TO HOST ──────────────────────────────────────────────────
# Download AnkiMCP addon (124672614) to the host and mount it into the
# container at /data/addons21/ to bypass the VOLUME /data limitation.
ADDON_ID="124672614"
ANKI_VER_FMT="250902"
mkdir -p "$ANKI_DATA_DIR/addons21/$ADDON_ID"
curl -sL -o /tmp/addon.zip "https://ankiweb.net/shared/download/$ADDON_ID?v=2.1&p=$ANKI_VER_FMT"
unzip -q /tmp/addon.zip -d "$ANKI_DATA_DIR/addons21/$ADDON_ID/"
echo "Addon downloaded: $ANKI_DATA_DIR/addons21/$ADDON_ID"

# ─── PATCH ADDON CONFIG ──────────────────────────────────────────────────────
# The addon binds to 127.0.0.1 by default. Patch config.json to bind to
# 0.0.0.0 so the MCP server is reachable from outside the container.
sed -i 's/"http_host": "127.0.0.1"/"http_host": "0.0.0.0"/' \
    "$ANKI_DATA_DIR/addons21/$ADDON_ID/config.json"
echo "Addon config patched: http_host set to 0.0.0.0"

# ─── BUILD PREFS21.DB FROM IMAGE DEFAULT ─────────────────────────────────────
# Extract the repo's pre-configured prefs21.db from the image (it has all
# required fields to skip Anki's first-run wizard), then inject our
# AnkiWeb credentials on top of it.
docker run --rm \
  -v "$ANKI_DATA_DIR:/output" \
  --entrypoint cp \
  ghcr.io/ankimcp/headless-anki:x11-vnc-v1.0.0 \
  /data/prefs21.db /output/prefs21.db

python3 << EOF
import sqlite3, pickle

db_path   = "$ANKI_DATA_DIR/prefs21.db"
sync_user = "$ANKI_SYNC_USER"
sync_key  = "$ANKI_SYNC_KEY"
profile   = "$ANKI_PROFILE_NAME"

conn = sqlite3.connect(db_path)
rows = conn.execute("SELECT name, data FROM profiles").fetchall()
for name, data in rows:
    d = pickle.loads(data)
    if name == "User 1":
        d["syncUser"]  = sync_user
        d["syncKey"]   = sync_key
        d["syncMedia"] = True
        d["autoSync"]  = True
        conn.execute(
            "UPDATE profiles SET data=? WHERE name=?",
            (pickle.dumps(d, protocol=4), name)
        )
        print(f"Credentials injected into profile: {name}")

# Rename profile if user chose a different name
if profile != "User 1":
    conn.execute("UPDATE profiles SET name=? WHERE name=?", (profile, "User 1"))
    conn.execute(
        "UPDATE profiles SET data=? WHERE name=?",
        (pickle.dumps({"last_loaded_profile_name": profile}, protocol=4), "_global")
    )
    print(f"Profile renamed to: {profile}")

conn.commit()
conn.close()
EOF

# ─── CREATE PERSISTENT COLLECTION DIRECTORY ───────────────────────────────────
# Mount User 1/ so the collection persists across container restarts.
mkdir -p "$ANKI_DATA_DIR/$ANKI_PROFILE_NAME"

# Set ownership for anki user inside container (uid 1000)
chown -R 1000:1000 "$ANKI_DATA_DIR"

# ─── INSTALL NGROK ───────────────────────────────────────────────────────────
# ngrok provides a trusted HTTPS URL for the MCP server since Claude.ai
# requires HTTPS and rejects self-signed certificates.
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
  | tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" \
  | tee /etc/apt/sources.list.d/ngrok.list
apt-get update -y && apt-get install -y ngrok
HOME=/root ngrok config add-authtoken ${ngrok_auth_token}echo "ngrok installed and configured"

# ─── START HEADLESS ANKI CONTAINER ───────────────────────────────────────────
# Mounts:
#   prefs21.db  — credentials + profile config
#   addons21/   — AnkiMCP addon (separate mount preserves addon files)
#   User 1/     — persistent collection storage
docker run -d \
  --name headless-anki \
  --restart unless-stopped \
  -p 3141:3141 \
  -p 5900:5900 \
  -v "$ANKI_DATA_DIR/prefs21.db:/data/prefs21.db" \
  -v "$ANKI_DATA_DIR/addons21:/data/addons21" \
  -v "$ANKI_DATA_DIR/$ANKI_PROFILE_NAME:/data/$ANKI_PROFILE_NAME" \
  ghcr.io/ankimcp/headless-anki:x11-vnc-v1.0.0

echo "headless-anki container started"

# ─── START NGROK AS SYSTEMD SERVICE ──────────────────────────────────────────
# Runs ngrok as a persistent background service that survives reboots.
# The public HTTPS URL is written to /opt/ngrok-url.txt on startup.
cat > /etc/systemd/system/ngrok.service << 'UNIT'
[Unit]
Description=ngrok tunnel for AnkiMCP
After=network.target

[Service]
ExecStart=/usr/bin/ngrok http 3141 --log=stdout
Restart=always
RestartSec=5
StandardOutput=append:/var/log/ngrok.log
StandardError=append:/var/log/ngrok.log

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable ngrok
systemctl start ngrok

# Wait for ngrok to start and extract the public URL
sleep 5
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c \
  "import sys,json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])" 2>/dev/null || echo "pending")
echo "$NGROK_URL" > /opt/ngrok-url.txt
echo "ngrok URL: $NGROK_URL"
echo "Done! Check /opt/ngrok-url.txt for your MCP endpoint."
