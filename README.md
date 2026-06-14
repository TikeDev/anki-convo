# anki-convo
An AI voice agent client that lets you review and interact with you Anki cards through natural conversation from on any device.

Google Doc - https://docs.google.com/document/d/15ioZQSvzYLgLluTZ2r7t8R10qRf5JL60VoKm6BEfUHY/edit?usp=sharing

Add this to your Managed Settings in Claude Code for session scoped usage:
 "statusLine": {
    "command": "/usr/bin/python3 -c '\nimport sys, json, os\nd = json.load(sys.stdin)\nm = d.get(\"model\", {}) or {}\ncwd = (d.get(\"workspace\", {}) or {}).get(\"current_dir\", \"\") or os.getcwd()\nnm = (m.get(\"display_name\", \"unknown\") or \"unknown\").replace(\" (1M context)\", \"\")\nmid = m.get(\"id\", \"\") or \"\"\ncw = 1000000 if (\"[1m]\" in mid or \"-1m\" in mid) else 200000\ncs = \"1M\" if cw == 1000000 else \"200k\"\npct = (d.get(\"context_window\", {}) or {}).get(\"used_percentage\", 0)\nE = chr(27)\ncc = f\"{E}[1;31m\" if pct > 60 else (f\"{E}[33m\" if pct >= 40 else f\"{E}[32m\")\nR = f\"{E}[0m\"\nsys.stdout.write(f\"{os.path.basename(cwd)} | {nm} | {cc}{pct}% / {cs}{R}\")\n'",
    "padding": 0,
    "type": "command"
  }
