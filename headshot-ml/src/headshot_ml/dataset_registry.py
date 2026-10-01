"""Dataset registry — single source of truth for which datasets are available."""
from __future__ import annotations

from pathlib import Path
from typing import Any

from headshot_ml.config import DatasetConfig, load_dataset_configs
from headshot_ml.logging_utils import get_logger

log = get_logger(__name__)


class DatasetRegistry:
    def __init__(self) -> None:
        self._configs = load_dataset_configs()

    def all(self) -> list[DatasetConfig]:
        return list(self._configs.values())

    def get(self, name: str) -> DatasetConfig:
        if name not in self._configs:
            raise KeyError(f"Dataset '{name}' not in registry. Known: {list(self._configs)}")
        return self._configs[name]

    def approved_for_download(self) -> list[DatasetConfig]:
        return [d for d in self.all() if d.allowed_for_download]

    def requires_manual(self) -> list[DatasetConfig]:
        return [d for d in self.all() if not d.allowed_for_download]

    def commercial_safe(self) -> list[DatasetConfig]:
        return [d for d in self.all() if d.commercial_use_allowed]

    def check_local_presence(self, name: str) -> dict[str, Any]:
        cfg = self.get(name)
        local = cfg.local_path
        exists = local.exists()
        file_count = sum(1 for _ in local.rglob("*.jpg")) + sum(1 for _ in local.rglob("*.png")) if exists else 0
        return {
            "name": name,
            "path": str(local),
            "exists": exists,
            "file_count": file_count,
            "expected_count": cfg.expected_count,
            "complete": file_count >= cfg.expected_count * 0.95 if cfg.expected_count else file_count > 0,
        }

    def print_summary(self) -> None:
        from rich.console import Console
        from rich.table import Table

        console = Console()
        table = Table(title="Dataset Registry", show_lines=True)
        table.add_column("Name", style="cyan")
        table.add_column("License", style="yellow")
        table.add_column("Commercial", style="green")
        table.add_column("Auto-download", style="blue")
        table.add_column("Expected count", style="magenta")
        table.add_column("Local", style="white")

        for cfg in self.all():
            presence = self.check_local_presence(cfg.name)
            table.add_row(
                cfg.name,
                cfg.license[:30],
                "✅" if cfg.commercial_use_allowed else "❌",
                "✅" if cfg.allowed_for_download else "🔒 Manual",
                str(cfg.expected_count),
                f"✅ {presence['file_count']:,}" if presence["exists"] else "❌ Missing",
            )
        console.print(table)


registry = DatasetRegistry()
