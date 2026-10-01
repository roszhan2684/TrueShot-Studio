"""
Portrait dataset PyTorch datamodule.
Reads from the train/val/test manifests produced by split_dataset.py.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd
import torch
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms

from headshot_ml.logging_utils import get_logger

log = get_logger(__name__)

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


class PortraitDataset(Dataset):
    """
    Loads (image, quality_score) pairs from a manifest JSONL file.
    Optionally loads attribute labels for multi-task training.
    """

    def __init__(
        self,
        manifest_path: Path,
        transform: transforms.Compose | None = None,
        image_size: int = 224,
        return_attributes: bool = False,
    ) -> None:
        self.records = self._load_manifest(manifest_path)
        self.transform = transform or self._default_transform(image_size)
        self.return_attributes = return_attributes

        log.info("dataset_loaded", manifest=str(manifest_path), size=len(self.records))

    @staticmethod
    def _load_manifest(path: Path) -> list[dict]:
        records = []
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line:
                    records.append(json.loads(line))
        return records

    @staticmethod
    def _default_transform(image_size: int) -> transforms.Compose:
        return transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ])

    @staticmethod
    def train_transform(image_size: int) -> transforms.Compose:
        return transforms.Compose([
            transforms.Resize((image_size + 32, image_size + 32)),
            transforms.RandomCrop(image_size),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1, hue=0.05),
            transforms.RandomGrayscale(p=0.05),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ])

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, idx: int) -> dict[str, Any]:
        rec = self.records[idx]
        img_path = Path(rec["processed_path"])

        try:
            img = Image.open(img_path).convert("RGB")
        except Exception:
            # Return black image on error — logged but doesn't crash training
            img = Image.new("RGB", (224, 224), color=0)

        tensor = self.transform(img)
        quality = torch.tensor(float(rec.get("overall_score", 0.5)), dtype=torch.float32)

        sample: dict[str, Any] = {
            "image": tensor,
            "quality_score": quality,
            "path": str(img_path),
            "dataset": rec.get("dataset_source", "unknown"),
        }

        if self.return_attributes and "attributes" in rec:
            attrs = rec["attributes"]
            if isinstance(attrs, dict):
                attrs = list(attrs.values())
            sample["attributes"] = torch.tensor(attrs, dtype=torch.float32)

        return sample


def build_dataloaders(
    manifests_dir: Path,
    batch_size: int = 32,
    num_workers: int = 4,
    image_size: int = 224,
    pin_memory: bool = True,
) -> dict[str, DataLoader]:
    loaders: dict[str, DataLoader] = {}

    for split in ("train", "val", "test"):
        manifest = manifests_dir / f"{split}.jsonl"
        if not manifest.exists():
            log.warning("manifest_missing", split=split, path=str(manifest))
            continue

        is_train = split == "train"
        transform = PortraitDataset.train_transform(image_size) if is_train else None
        ds = PortraitDataset(manifest, transform=transform, image_size=image_size)

        loaders[split] = DataLoader(
            ds,
            batch_size=batch_size,
            shuffle=is_train,
            num_workers=num_workers,
            pin_memory=pin_memory,
            drop_last=is_train,
            persistent_workers=num_workers > 0,
        )
        log.info("dataloader_ready", split=split, batches=len(loaders[split]))

    return loaders
