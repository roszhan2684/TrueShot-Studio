"""
UTKFace Fetcher — MANUAL ONLY.
License: Research use only.
Source: https://susanqq.github.io/UTKFace/
"""
from __future__ import annotations

from pathlib import Path

from headshot_ml.dataset_fetchers.base import BaseFetcher
from headshot_ml.logging_utils import get_logger

log = get_logger(__name__)


class UTKFaceFetcher(BaseFetcher):
    def _download(self) -> Path:
        raise PermissionError(
            "UTKFace cannot be auto-downloaded. Manual steps:\n\n"
            "  1. Visit: https://susanqq.github.io/UTKFace/\n"
            "  2. Download the aligned & cropped images\n"
            f"  3. Extract to: {self.target}/\n"
            "  4. Filename format: age_gender_race_datetime.jpg\n"
            "  5. Run: make preprocess-utkface"
        )

    @staticmethod
    def parse_filename_metadata(filename: str) -> dict | None:
        """UTKFace filenames encode: age_gender_race_datetime.jpg"""
        stem = Path(filename).stem
        parts = stem.split("_")
        if len(parts) < 3:
            return None
        try:
            return {
                "age": int(parts[0]),
                "gender": int(parts[1]),          # 0=male, 1=female
                "race": int(parts[2]),             # 0=white,1=black,2=asian,3=indian,4=other
            }
        except (ValueError, IndexError):
            return None
