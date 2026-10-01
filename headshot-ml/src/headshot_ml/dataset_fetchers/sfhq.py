"""
SFHQ Fetcher — Synthetic Faces High Quality.
License: CC0 1.0 (Public Domain). Safe for commercial use.
Source: https://huggingface.co/datasets/SelfishMachines/SFHQ
"""
from __future__ import annotations

from pathlib import Path
from tqdm import tqdm

from headshot_ml.config import DatasetConfig
from headshot_ml.dataset_fetchers.base import BaseFetcher
from headshot_ml.logging_utils import get_logger

log = get_logger(__name__)


class SFHQFetcher(BaseFetcher):
    def _download(self) -> Path:
        try:
            from datasets import load_dataset
        except ImportError:
            raise ImportError("Install 'datasets': pip install datasets")

        log.info("sfhq_download_start", repo=self.cfg.hf_repo_id, split=self.cfg.hf_split)

        images_dir = self.target / "images"
        images_dir.mkdir(parents=True, exist_ok=True)

        # Stream to avoid loading 90k images into RAM at once
        ds = load_dataset(
            self.cfg.hf_repo_id,
            split=self.cfg.hf_split,
            streaming=True,
            trust_remote_code=True,
        )

        saved = 0
        for i, sample in enumerate(tqdm(ds, desc="SFHQ", unit="img")):
            img = sample.get("image")
            if img is None:
                continue
            img_path = images_dir / f"sfhq_{i:06d}.png"
            if not img_path.exists():
                img.save(img_path, format="PNG")
            saved += 1

        log.info("sfhq_download_complete", saved=saved, path=str(images_dir))
        return self.target
