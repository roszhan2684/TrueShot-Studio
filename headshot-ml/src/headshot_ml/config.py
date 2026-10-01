"""Centralised config loading — wraps YAML + .env + CLI overrides."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml
from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parents[2]   # headshot-ml/
load_dotenv(_ROOT / ".env")


# ─── Paths ────────────────────────────────────────────────────────────────────

@dataclass
class Paths:
    root: Path = _ROOT
    data: Path = _ROOT / "data"
    raw: Path = _ROOT / "data" / "raw"
    interim: Path = _ROOT / "data" / "interim"
    processed: Path = _ROOT / "data" / "processed"
    manifests: Path = _ROOT / "data" / "manifests"
    artifacts: Path = _ROOT / "artifacts"
    checkpoints: Path = _ROOT / "artifacts" / "checkpoints"
    logs: Path = _ROOT / "artifacts" / "runs"
    reports: Path = _ROOT / "artifacts" / "reports"
    configs: Path = _ROOT / "configs"

    def ensure_all(self) -> None:
        for f in self.__dataclass_fields__:
            getattr(self, f).mkdir(parents=True, exist_ok=True)


PATHS = Paths()


# ─── Dataset entry ────────────────────────────────────────────────────────────

@dataclass
class DatasetConfig:
    name: str
    display_name: str
    source_url: str
    license: str
    commercial_use_allowed: bool
    redistribution_allowed: bool
    allowed_for_download: bool
    downloader_type: str
    expected_format: str
    local_target_dir: str
    expected_count: int = 0
    usage_notes: str = ""
    manual_instructions: str = ""
    hf_repo_id: str = ""
    hf_split: str = "train"
    attribute_file: str = ""
    filename_metadata: str = ""
    image_size: int = 256
    extra: dict[str, Any] = field(default_factory=dict)

    @property
    def local_path(self) -> Path:
        return PATHS.root / self.local_target_dir


# ─── Config loader ────────────────────────────────────────────────────────────

@lru_cache
def load_dataset_configs() -> dict[str, DatasetConfig]:
    cfg_path = PATHS.configs / "datasets.yaml"
    with open(cfg_path) as f:
        raw = yaml.safe_load(f)

    result: dict[str, DatasetConfig] = {}
    for entry in raw.get("datasets", []):
        known_fields = {f for f in DatasetConfig.__dataclass_fields__}
        known = {k: v for k, v in entry.items() if k in known_fields}
        extra = {k: v for k, v in entry.items() if k not in known_fields}
        cfg = DatasetConfig(**known, extra=extra)
        result[cfg.name] = cfg
    return result


@lru_cache
def load_training_config() -> dict[str, Any]:
    with open(PATHS.configs / "training.yaml") as f:
        return yaml.safe_load(f)


@lru_cache
def load_eval_config() -> dict[str, Any]:
    with open(PATHS.configs / "evaluation.yaml") as f:
        return yaml.safe_load(f)
