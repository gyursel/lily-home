#!/usr/bin/env python3
"""
LILY HOME — Локален Сървър с API за Елементарен Админ Панел
Позволява на съпругата Ви да качва снимки директно от телефона или компютъра си,
да избира албум/година и да управлява галерията с 1 клик.
Записва качените снимки в папка uploads/ и ги запазва постоянно в custom_photos.json.
"""

import os
import json
import time
import base64
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = 8090
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
DATA_FILE = os.path.join(BASE_DIR, "custom_photos.json")

os.makedirs(UPLOADS_DIR, exist_ok=True)

if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump({"uploadedPhotos": [], "deletedIds": []}, f, ensure_ascii=False, indent=2)


def load_data():
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if "uploadedPhotos" not in data:
                data["uploadedPhotos"] = []
            if "deletedIds" not in data:
                data["deletedIds"] = []
            return data
    except Exception:
        return {"uploadedPhotos": [], "deletedIds": []}


def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


class LilyHomeHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def _send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/api/photos"):
            data = load_data()
            self._send_json({"ok": True, **data})
            return
        super().do_GET()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"

        try:
            payload = json.loads(raw_body)
        except Exception:
            self._send_json({"ok": False, "error": "Невалиден JSON формат"}, status=400)
            return

        # 1. Качване на една или повече нови снимки
        if self.path == "/api/upload":
            items = payload.get("items", [])
            if not items and payload.get("imageData"):
                items = [payload]

            data = load_data()
            saved_entries = []

            for idx, item in enumerate(items):
                img_data = item.get("imageData", "")
                if not img_data or "," not in img_data:
                    continue

                header, b64_str = img_data.split(",", 1)
                ext = "jpg"
                if "png" in header:
                    ext = "png"
                elif "webp" in header:
                    ext = "webp"
                elif "gif" in header:
                    ext = "gif"

                orig_name = item.get("fileName", f"photo.{ext}")
                safe_stem = re.sub(r"[^a-zA-Z0-9_-]", "", os.path.splitext(orig_name)[0])[:24] or "lily"
                timestamp = int(time.time() * 1000) + idx
                filename = f"{timestamp}_{safe_stem}.{ext}"
                filepath = os.path.join(UPLOADS_DIR, filename)

                try:
                    binary_data = base64.b64decode(b64_str)
                    with open(filepath, "wb") as img_file:
                        img_file.write(binary_data)
                except Exception as e:
                    continue

                year_val = item.get("year", "2026")
                date_label = item.get("dateLabel") or (
                    "Без посочена година" if year_val == "unspecified" else f"{year_val} г."
                )
                categories = item.get("categories", ["special"])
                is_family = "family" in categories or bool(item.get("isFamily", False))
                is_favorite = "favorites" in categories or bool(item.get("isFavorite", False))

                if is_family and "family" not in categories:
                    categories.append("family")
                if is_favorite and "favorites" not in categories:
                    categories.append("favorites")

                photo_entry = {
                    "id": f"custom-{timestamp}",
                    "src": f"uploads/{filename}",
                    "title": item.get("title", "").strip() or "Нов спомен",
                    "caption": item.get("caption", "").strip() or "Споделен красив момент от нашия албум.",
                    "year": year_val,
                    "dateLabel": date_label,
                    "categories": categories,
                    "isFamily": is_family,
                    "isFavorite": is_favorite,
                    "focalPoint": item.get("focalPoint", "50% 35%"),
                    "aspectRatio": "3/4",
                    "gridSpan": item.get("gridSpan", "normal"),
                    "isCustomUpload": True
                }

                data["uploadedPhotos"].insert(0, photo_entry)
                saved_entries.append(photo_entry)

            save_data(data)
            self._send_json({"ok": True, "added": saved_entries, **data})
            return

        # 2. Изтриване / скриване на снимка от админ панела
        if self.path == "/api/delete":
            photo_id = payload.get("id", "")
            if not photo_id:
                self._send_json({"ok": False, "error": "Липсва ID на снимката"}, status=400)
                return

            data = load_data()
            # Ако е качена през админ панела снимка, премахваме я от списъка и диска
            removed_custom = [p for p in data["uploadedPhotos"] if p.get("id") == photo_id]
            data["uploadedPhotos"] = [p for p in data["uploadedPhotos"] if p.get("id") != photo_id]

            for rem in removed_custom:
                rel_src = rem.get("src", "")
                if rel_src.startswith("uploads/"):
                    full_p = os.path.join(BASE_DIR, rel_src)
                    if os.path.exists(full_p):
                        try:
                            os.remove(full_p)
                        except Exception:
                            pass

            # Ако е от първоначалните снимки, добавяме ID-то в deletedIds
            if not removed_custom and photo_id not in data["deletedIds"]:
                data["deletedIds"].append(photo_id)

            save_data(data)
            self._send_json({"ok": True, **data})
            return

        # 3. Обновяване на заглавие, година, албум или фокусна точка на снимка
        if self.path == "/api/update":
            photo_id = payload.get("id", "")
            data = load_data()
            for p in data["uploadedPhotos"]:
                if p.get("id") == photo_id:
                    if "title" in payload:
                        p["title"] = payload["title"]
                    if "caption" in payload:
                        p["caption"] = payload["caption"]
                    if "year" in payload:
                        p["year"] = payload["year"]
                        p["dateLabel"] = (
                            "Без посочена година"
                            if payload["year"] == "unspecified"
                            else f"{payload['year']} г."
                        )
                    if "categories" in payload:
                        p["categories"] = payload["categories"]
                        p["isFamily"] = "family" in payload["categories"]
                        p["isFavorite"] = "favorites" in payload["categories"]
                    if "focalPoint" in payload:
                        p["focalPoint"] = payload["focalPoint"]
                    break

            save_data(data)
            self._send_json({"ok": True, **data})
            return

        self._send_json({"ok": False, "error": "Непознат API адрес"}, status=404)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("", PORT), LilyHomeHandler)
    print(f"Serving LILY HOME with Admin Upload API on port {PORT} (http://localhost:{PORT}/) ...", flush=True)
    server.serve_forever()
