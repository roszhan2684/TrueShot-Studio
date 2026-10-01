"""Face size / area ratio metrics."""
import numpy as np


def face_area_ratio(
    bbox: tuple[int, int, int, int],
    image_width: int,
    image_height: int,
) -> float:
    """What fraction of the image area the face occupies."""
    x1, y1, x2, y2 = bbox
    face_area = (x2 - x1) * (y2 - y1)
    image_area = image_width * image_height
    if image_area == 0:
        return 0.0
    return float(face_area / image_area)


def face_size_px(bbox: tuple[int, int, int, int]) -> int:
    """Minimum dimension of the face bounding box."""
    x1, y1, x2, y2 = bbox
    return min(x2 - x1, y2 - y1)
