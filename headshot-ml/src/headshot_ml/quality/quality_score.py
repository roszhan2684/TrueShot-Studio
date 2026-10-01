"""
Composite quality scorer — aggregates blur, brightness, face size, and pose
into a single 0-1 score with rejection reasons.
"""
from __future__ import annotations

import cv2
import numpy as np
from dataclasses import dataclass, field
from pathlib import Path

from headshot_ml.quality.blur import laplacian_variance
from headshot_ml.quality.brightness import mean_brightness, rms_contrast, histogram_spread
from headshot_ml.quality.face_size import face_area_ratio, face_size_px
from headshot_ml.quality.pose import is_acceptable_pose
from headshot_ml.preprocessing.detect_align import FaceDetector, DetectedFace
from headshot_ml.logging_utils import get_logger

log = get_logger(__name__)


@dataclass
class QualityResult:
    image_path: Path
    accepted: bool
    rejection_reasons: list[str] = field(default_factory=list)
    overall_score: float = 0.0

    # Raw signals
    blur_score: float = 0.0
    brightness: float = 0.0
    contrast: float = 0.0
    face_count: int = 0
    face_area_ratio: float = 0.0
    face_size_px: int = 0
    pose_yaw: float | None = None
    pose_pitch: float | None = None

    # Image properties
    width: int = 0
    height: int = 0

    def to_dict(self) -> dict:
        return {
            "image_path": str(self.image_path),
            "accepted": self.accepted,
            "rejection_reasons": "|".join(self.rejection_reasons),
            "overall_score": round(self.overall_score, 4),
            "blur_score": round(self.blur_score, 2),
            "brightness": round(self.brightness, 2),
            "contrast": round(self.contrast, 2),
            "face_count": self.face_count,
            "face_area_ratio": round(self.face_area_ratio, 4),
            "face_size_px": self.face_size_px,
            "pose_yaw": self.pose_yaw,
            "pose_pitch": self.pose_pitch,
            "width": self.width,
            "height": self.height,
        }


class QualityScorer:
    """
    Configurable quality scorer.
    All thresholds can be overridden from configs/evaluation.yaml.
    """

    def __init__(
        self,
        blur_threshold: float = 50.0,
        brightness_min: float = 40.0,
        brightness_max: float = 215.0,
        face_area_ratio_min: float = 0.05,
        face_area_ratio_max: float = 0.95,
        max_faces: int = 1,
        min_resolution: int = 128,
        max_pose_yaw_deg: float = 45.0,
        max_pose_pitch_deg: float = 30.0,
        detector: FaceDetector | None = None,
    ) -> None:
        self.blur_threshold = blur_threshold
        self.brightness_min = brightness_min
        self.brightness_max = brightness_max
        self.face_area_ratio_min = face_area_ratio_min
        self.face_area_ratio_max = face_area_ratio_max
        self.max_faces = max_faces
        self.min_resolution = min_resolution
        self.max_pose_yaw_deg = max_pose_yaw_deg
        self.max_pose_pitch_deg = max_pose_pitch_deg
        self._detector = detector or FaceDetector()

    @classmethod
    def from_config(cls, cfg: dict) -> "QualityScorer":
        qf = cfg.get("quality_filters", {})
        return cls(
            blur_threshold=qf.get("blur_threshold", 50.0),
            brightness_min=qf.get("brightness_min", 40.0),
            brightness_max=qf.get("brightness_max", 215.0),
            face_area_ratio_min=qf.get("face_area_ratio_min", 0.05),
            face_area_ratio_max=qf.get("face_area_ratio_max", 0.95),
            max_faces=qf.get("max_faces", 1),
            min_resolution=qf.get("min_resolution", 128),
            max_pose_yaw_deg=qf.get("max_pose_yaw_deg", 45.0),
            max_pose_pitch_deg=qf.get("max_pose_pitch_deg", 30.0),
        )

    def score(self, image_path: Path) -> QualityResult:
        result = QualityResult(image_path=image_path)
        reasons: list[str] = []

        # --- Load image ---
        try:
            img = cv2.imread(str(image_path))
            if img is None:
                return QualityResult(image_path=image_path, accepted=False,
                                     rejection_reasons=["cannot_read_image"])
        except Exception as e:
            return QualityResult(image_path=image_path, accepted=False,
                                 rejection_reasons=[f"read_error:{e}"])

        h, w = img.shape[:2]
        result.width, result.height = w, h

        # --- Resolution ---
        if min(w, h) < self.min_resolution:
            reasons.append(f"too_small_{min(w,h)}px")

        # --- Blur ---
        blur = laplacian_variance(img)
        result.blur_score = blur
        if blur < self.blur_threshold:
            reasons.append(f"too_blurry_{blur:.1f}")

        # --- Brightness ---
        brightness = mean_brightness(img)
        result.brightness = brightness
        if brightness < self.brightness_min:
            reasons.append(f"too_dark_{brightness:.1f}")
        elif brightness > self.brightness_max:
            reasons.append(f"too_bright_{brightness:.1f}")

        result.contrast = rms_contrast(img)

        # --- Face detection ---
        detection = self._detector.detect(image_path)
        if detection.error:
            reasons.append(f"detection_error:{detection.error}")
        result.face_count = detection.face_count

        if detection.face_count == 0:
            reasons.append("no_face_detected")
        elif detection.face_count > self.max_faces:
            reasons.append(f"too_many_faces_{detection.face_count}")

        face = detection.primary_face
        if face is not None:
            ratio = face_area_ratio(face.bbox, w, h)
            size_px = face_size_px(face.bbox)
            result.face_area_ratio = ratio
            result.face_size_px = size_px

            if ratio < self.face_area_ratio_min:
                reasons.append(f"face_too_small_ratio_{ratio:.3f}")
            elif ratio > self.face_area_ratio_max:
                reasons.append(f"face_too_large_ratio_{ratio:.3f}")

            if face.pose:
                result.pose_yaw = face.pose.get("yaw")
                result.pose_pitch = face.pose.get("pitch")
                ok, pose_reason = is_acceptable_pose(
                    face.pose, self.max_pose_yaw_deg, self.max_pose_pitch_deg
                )
                if not ok:
                    reasons.append(pose_reason)

        # --- Overall score (0-1) ---
        result.overall_score = self._compute_score(result)
        result.rejection_reasons = reasons
        result.accepted = len(reasons) == 0

        return result

    def _compute_score(self, r: QualityResult) -> float:
        """Weighted composite score — all components normalised to 0-1."""
        if r.face_count == 0:
            return 0.0

        blur_s = min(1.0, r.blur_score / 200.0)           # 200 = very sharp
        bright_s = 1.0 - abs(r.brightness - 128) / 128    # best at 128
        bright_s = max(0.0, bright_s)
        face_s = 1.0 - abs(r.face_area_ratio - 0.25) / 0.25  # ideal ~25%
        face_s = max(0.0, min(1.0, face_s))

        # Pose penalty
        pose_s = 1.0
        if r.pose_yaw is not None:
            pose_s *= max(0.0, 1.0 - abs(r.pose_yaw) / 90.0)
        if r.pose_pitch is not None:
            pose_s *= max(0.0, 1.0 - abs(r.pose_pitch) / 60.0)

        score = (
            0.35 * blur_s +
            0.25 * bright_s +
            0.25 * face_s +
            0.15 * pose_s
        )
        return round(float(score), 4)
