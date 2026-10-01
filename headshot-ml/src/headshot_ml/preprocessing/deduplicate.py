"""
Image deduplication using perceptual hashing (pHash) + exact SHA256.
Removes near-duplicates that would inflate training metrics.
"""
from __future__ import annotations

import hashlib
import sqlite3
from pathlib import Path

import imagehash
from PIL import Image
from tqdm import tqdm

from headshot_ml.logging_utils import get_logger

log = get_logger(__name__)


class ImageDeduplicator:
    def __init__(
        self,
        db_path: Path,
        phash_threshold: int = 8,   # Hamming distance — lower = stricter
    ) -> None:
        self.db_path = db_path
        self.phash_threshold = phash_threshold
        self._init_db()

    def _init_db(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS image_hashes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    path TEXT UNIQUE NOT NULL,
                    sha256 TEXT NOT NULL,
                    phash TEXT NOT NULL,
                    dataset TEXT NOT NULL,
                    is_duplicate INTEGER DEFAULT 0,
                    duplicate_of TEXT
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_sha256 ON image_hashes(sha256)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_phash ON image_hashes(phash)")
            conn.commit()

    def sha256(self, path: Path) -> str:
        h = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()

    def phash(self, path: Path) -> str:
        try:
            return str(imagehash.phash(Image.open(path)))
        except Exception:
            return ""

    def process_directory(self, directory: Path, dataset_name: str) -> dict:
        image_paths = sorted(
            p for ext in ("*.jpg", "*.jpeg", "*.png", "*.webp")
            for p in directory.rglob(ext)
        )
        log.info("dedup_start", directory=str(directory), count=len(image_paths))

        stats = {"processed": 0, "duplicates": 0, "errors": 0}

        with sqlite3.connect(self.db_path) as conn:
            for path in tqdm(image_paths, desc=f"Dedup {dataset_name}"):
                try:
                    sha = self.sha256(path)
                    ph = self.phash(path)

                    # Exact duplicate check
                    existing = conn.execute(
                        "SELECT path FROM image_hashes WHERE sha256 = ? AND path != ?",
                        (sha, str(path))
                    ).fetchone()

                    if existing:
                        conn.execute(
                            "INSERT OR REPLACE INTO image_hashes "
                            "(path, sha256, phash, dataset, is_duplicate, duplicate_of) "
                            "VALUES (?, ?, ?, ?, 1, ?)",
                            (str(path), sha, ph, dataset_name, existing[0])
                        )
                        stats["duplicates"] += 1
                        continue

                    # Near-duplicate check via pHash
                    if ph:
                        all_hashes = conn.execute(
                            "SELECT path, phash FROM image_hashes WHERE is_duplicate = 0 AND dataset != 'skip'"
                        ).fetchall()

                        current_hash = imagehash.hex_to_hash(ph)
                        near_dup = None
                        for row_path, row_phash in all_hashes:
                            try:
                                dist = current_hash - imagehash.hex_to_hash(row_phash)
                                if dist <= self.phash_threshold:
                                    near_dup = row_path
                                    break
                            except Exception:
                                continue

                        if near_dup:
                            conn.execute(
                                "INSERT OR REPLACE INTO image_hashes "
                                "(path, sha256, phash, dataset, is_duplicate, duplicate_of) "
                                "VALUES (?, ?, ?, ?, 1, ?)",
                                (str(path), sha, ph, dataset_name, near_dup)
                            )
                            stats["duplicates"] += 1
                            continue

                    conn.execute(
                        "INSERT OR REPLACE INTO image_hashes "
                        "(path, sha256, phash, dataset, is_duplicate) "
                        "VALUES (?, ?, ?, ?, 0)",
                        (str(path), sha, ph, dataset_name)
                    )
                    stats["processed"] += 1

                except Exception as e:
                    log.warning("dedup_error", path=str(path), error=str(e))
                    stats["errors"] += 1

            conn.commit()

        log.info("dedup_complete", **stats)
        return stats

    def get_unique_paths(self, dataset: str | None = None) -> list[Path]:
        with sqlite3.connect(self.db_path) as conn:
            if dataset:
                rows = conn.execute(
                    "SELECT path FROM image_hashes WHERE is_duplicate = 0 AND dataset = ?",
                    (dataset,)
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT path FROM image_hashes WHERE is_duplicate = 0"
                ).fetchall()
        return [Path(r[0]) for r in rows]
