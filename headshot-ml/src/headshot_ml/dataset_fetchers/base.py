"""Abstract base fetcher — all dataset fetchers implement this interface."""
from __future__ import annotations

import abc
from pathlib import Path

from headshot_ml.config import DatasetConfig
from headshot_ml.logging_utils import get_logger

log = get_logger(__name__)


class BaseFetcher(abc.ABC):
    def __init__(self, config: DatasetConfig) -> None:
        self.cfg = config
        self.target = config.local_path

    @property
    def name(self) -> str:
        return self.cfg.name

    def check_license(self) -> None:
        if not self.cfg.allowed_for_download:
            raise PermissionError(
                f"\n{'='*60}\n"
                f"Dataset '{self.name}' requires manual download.\n"
                f"License: {self.cfg.license}\n"
                f"Commercial use: {'YES' if self.cfg.commercial_use_allowed else 'NO'}\n\n"
                f"Instructions:\n{self.cfg.manual_instructions}\n"
                f"{'='*60}\n"
                "Set allowed_for_download: true in configs/datasets.yaml only after\n"
                "reviewing LICENSE_REVIEW.md and confirming your use case."
            )
        log.info("license_check_passed", dataset=self.name, license=self.cfg.license)

    def is_already_downloaded(self) -> bool:
        if not self.target.exists():
            return False
        count = sum(1 for _ in self.target.rglob("*.jpg")) + sum(1 for _ in self.target.rglob("*.png"))
        if self.cfg.expected_count and count < self.cfg.expected_count * 0.90:
            log.warning("dataset_incomplete", dataset=self.name, found=count, expected=self.cfg.expected_count)
            return False
        return count > 0

    def fetch(self, force: bool = False) -> Path:
        self.check_license()
        if self.is_already_downloaded() and not force:
            log.info("dataset_already_present", dataset=self.name, path=str(self.target))
            return self.target
        self.target.mkdir(parents=True, exist_ok=True)
        log.info("fetching_dataset", dataset=self.name, target=str(self.target))
        return self._download()

    @abc.abstractmethod
    def _download(self) -> Path:
        """Implement the actual download logic."""
        ...
