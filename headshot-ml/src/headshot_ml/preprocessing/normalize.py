"""
Image normalization — consistent format, size, and color space for training.
"""
from __future__ import annotations

import cv2
import numpy as np
from pathlib import Path

from headshot_ml.logging_utils import get_logger

log = get_logger(__name__)


class ImageNormalizer:
    def __init__(
        self,
        target_size: int = 512,
        output_format: str = "png",
        color_space: str = "rgb",
    ) -> None:
        self.target_size = target_size
        self.output_format = output_format
        self.color_space = color_space

    def normalize(self, image_path: Path, output_path: Path) -> bool:
        try:
            img = cv2.imread(str(image_path))
            if img is None:
                return False

            # Convert to target color space
            if self.color_space == "rgb":
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

            # Resize with Lanczos (best quality downsampling)
            h, w = img.shape[:2]
            if h != self.target_size or w != self.target_size:
                img = cv2.resize(img, (self.target_size, self.target_size), interpolation=cv2.INTER_LANCZOS4)

            # Convert back to BGR for writing
            if self.color_space == "rgb":
                img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

            output_path.parent.mkdir(parents=True, exist_ok=True)

            if self.output_format == "png":
                cv2.imwrite(str(output_path), img, [cv2.IMWRITE_PNG_COMPRESSION, 6])
            elif self.output_format in ("jpg", "jpeg"):
                cv2.imwrite(str(output_path), img, [cv2.IMWRITE_JPEG_QUALITY, 95])
            else:
                cv2.imwrite(str(output_path), img)

            return True
        except Exception as e:
            log.warning("normalize_error", path=str(image_path), error=str(e))
            return False
