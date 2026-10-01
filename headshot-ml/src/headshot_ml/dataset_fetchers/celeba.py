"""
CelebA Fetcher — MANUAL ONLY.
License: Non-commercial research only.
Source: https://mmlab.ie.cuhk.edu.hk/projects/CelebA.html
"""
from __future__ import annotations

from pathlib import Path

from headshot_ml.dataset_fetchers.base import BaseFetcher
from headshot_ml.logging_utils import get_logger

log = get_logger(__name__)


class CelebAFetcher(BaseFetcher):
    def _download(self) -> Path:
        raise PermissionError(
            "CelebA cannot be auto-downloaded. It requires manual acceptance of the\n"
            "research-use agreement at:\n\n"
            "  https://mmlab.ie.cuhk.edu.hk/projects/CelebA.html\n\n"
            "After downloading img_align_celeba.zip and list_attr_celeba.txt:\n"
            f"  1. Extract images to:  {self.target}/img_align_celeba/\n"
            f"  2. Place attributes at: {self.target}/list_attr_celeba.txt\n"
            "  3. Run: make preprocess-celeba"
        )
