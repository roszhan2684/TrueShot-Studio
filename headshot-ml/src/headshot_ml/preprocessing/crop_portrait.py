"""
Portrait cropping — expands face bbox to a headshot-style crop.
Target framing: head + shoulders, ~3:4 aspect ratio.
"""
from __future__ import annotations

import cv2
import numpy as np
from pathlib import Path
from PIL import Image

from headshot_ml.preprocessing.detect_align import DetectedFace
from headshot_ml.logging_utils import get_logger

log = get_logger(__name__)


class PortraitCropper:
    def __init__(
        self,
        output_size: tuple[int, int] = (512, 512),
        padding_factor: float = 1.8,
        aspect_ratio: tuple[int, int] = (3, 4),
    ) -> None:
        self.output_size = output_size
        self.padding_factor = padding_factor
        self.aspect_ratio = aspect_ratio

    def crop(
        self,
        image_path: Path,
        face: DetectedFace,
        output_path: Path | None = None,
    ) -> np.ndarray | None:
        img = cv2.imread(str(image_path))
        if img is None:
            return None

        h_img, w_img = img.shape[:2]
        x1, y1, x2, y2 = face.bbox
        face_w = x2 - x1
        face_h = y2 - y1
        face_cx = (x1 + x2) / 2
        face_cy = (y1 + y2) / 2

        # Expand crop region around the face
        crop_size = max(face_w, face_h) * self.padding_factor

        # Adjust for 3:4 portrait ratio
        ar_w, ar_h = self.aspect_ratio
        if ar_h / ar_w > 1:
            crop_h = crop_size
            crop_w = crop_size * (ar_w / ar_h)
        else:
            crop_w = crop_size
            crop_h = crop_size * (ar_h / ar_w)

        # Face should be positioned ~35% from top for portrait framing
        vert_offset = crop_h * 0.1  # shift crop up slightly so head is in upper third

        x1_crop = int(face_cx - crop_w / 2)
        y1_crop = int(face_cy - crop_h / 2 - vert_offset)
        x2_crop = int(x1_crop + crop_w)
        y2_crop = int(y1_crop + crop_h)

        # Pad image if crop extends beyond boundaries
        pad_top = max(0, -y1_crop)
        pad_bottom = max(0, y2_crop - h_img)
        pad_left = max(0, -x1_crop)
        pad_right = max(0, x2_crop - w_img)

        if any([pad_top, pad_bottom, pad_left, pad_right]):
            img = cv2.copyMakeBorder(
                img, pad_top, pad_bottom, pad_left, pad_right,
                cv2.BORDER_REPLICATE,
            )
            y1_crop += pad_top
            y2_crop += pad_top
            x1_crop += pad_left
            x2_crop += pad_left

        cropped = img[y1_crop:y2_crop, x1_crop:x2_crop]
        if cropped.size == 0:
            return None

        resized = cv2.resize(cropped, self.output_size, interpolation=cv2.INTER_LANCZOS4)

        if output_path is not None:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            cv2.imwrite(str(output_path), resized)

        return resized
