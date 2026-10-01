"""
Face detection and landmark-based alignment.
Uses InsightFace (RetinaFace) as primary detector with OpenCV Haar cascade fallback.
"""
from __future__ import annotations

import cv2
import numpy as np
from dataclasses import dataclass, field
from pathlib import Path
from PIL import Image

from headshot_ml.logging_utils import get_logger

log = get_logger(__name__)


@dataclass
class DetectedFace:
    bbox: tuple[int, int, int, int]    # x1, y1, x2, y2
    confidence: float
    landmarks: np.ndarray | None       # 5-point: left_eye, right_eye, nose, mouth_left, mouth_right
    pose: dict[str, float] | None = None  # yaw, pitch, roll in degrees


@dataclass
class DetectionResult:
    image_path: Path
    faces: list[DetectedFace] = field(default_factory=list)
    error: str | None = None

    @property
    def face_count(self) -> int:
        return len(self.faces)

    @property
    def primary_face(self) -> DetectedFace | None:
        if not self.faces:
            return None
        # Return the largest face by area
        return max(self.faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))


class FaceDetector:
    """
    Multi-backend face detector.
    Priority: InsightFace RetinaFace > OpenCV DNN > Haar cascade
    """

    def __init__(
        self,
        backend: str = "auto",
        min_face_size: int = 80,
        confidence_threshold: float = 0.9,
    ) -> None:
        self.backend = backend
        self.min_face_size = min_face_size
        self.confidence_threshold = confidence_threshold
        self._detector = None
        self._init_detector()

    def _init_detector(self) -> None:
        if self.backend in ("auto", "insightface"):
            try:
                import insightface
                from insightface.app import FaceAnalysis
                app = FaceAnalysis(name="buffalo_sc", providers=["CPUExecutionProvider"])
                app.prepare(ctx_id=0, det_size=(640, 640))
                self._detector = app
                self.backend = "insightface"
                log.info("face_detector_ready", backend="insightface")
                return
            except Exception as e:
                log.warning("insightface_unavailable", error=str(e), fallback="opencv")

        if self.backend in ("auto", "opencv"):
            self._detector = cv2.CascadeClassifier(
                cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            )
            self.backend = "opencv_haar"
            log.info("face_detector_ready", backend="opencv_haar")

    def detect(self, image_path: Path) -> DetectionResult:
        result = DetectionResult(image_path=image_path)
        try:
            img_bgr = cv2.imread(str(image_path))
            if img_bgr is None:
                result.error = "cannot_read_image"
                return result
            result.faces = self._run_detection(img_bgr)
        except Exception as e:
            result.error = str(e)
            log.warning("detection_error", path=str(image_path), error=str(e))
        return result

    def _run_detection(self, img_bgr: np.ndarray) -> list[DetectedFace]:
        if self.backend == "insightface":
            return self._detect_insightface(img_bgr)
        return self._detect_opencv(img_bgr)

    def _detect_insightface(self, img_bgr: np.ndarray) -> list[DetectedFace]:
        faces = self._detector.get(img_bgr)
        results = []
        for f in faces:
            if f.det_score < self.confidence_threshold:
                continue
            x1, y1, x2, y2 = f.bbox.astype(int)
            w, h = x2 - x1, y2 - y1
            if min(w, h) < self.min_face_size:
                continue

            landmarks = f.kps if hasattr(f, "kps") and f.kps is not None else None
            pose = None
            if hasattr(f, "pose") and f.pose is not None:
                p = f.pose
                pose = {"pitch": float(p[0]), "yaw": float(p[1]), "roll": float(p[2])}

            results.append(DetectedFace(
                bbox=(x1, y1, x2, y2),
                confidence=float(f.det_score),
                landmarks=landmarks,
                pose=pose,
            ))
        return results

    def _detect_opencv(self, img_bgr: np.ndarray) -> list[DetectedFace]:
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        faces = self._detector.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(self.min_face_size, self.min_face_size)
        )
        results = []
        for (x, y, w, h) in faces:
            results.append(DetectedFace(
                bbox=(x, y, x + w, y + h),
                confidence=0.85,  # Haar classifier doesn't give confidence
                landmarks=None,
                pose=None,
            ))
        return results

    def align(self, image_path: Path, target_size: int = 256) -> np.ndarray | None:
        """
        Align the primary face using landmark-based similarity transform.
        Returns aligned face as BGR numpy array.
        """
        result = self.detect(image_path)
        face = result.primary_face
        if face is None or face.landmarks is None:
            return None

        img_bgr = cv2.imread(str(image_path))
        if img_bgr is None:
            return None

        # Standard reference landmarks (ArcFace target positions for 112x112)
        STANDARD_LANDMARKS_112 = np.array([
            [38.2946, 51.6963],   # left eye
            [73.5318, 51.5014],   # right eye
            [56.0252, 71.7366],   # nose tip
            [41.5493, 92.3655],   # left mouth
            [70.7299, 92.2041],   # right mouth
        ], dtype=np.float32)

        scale = target_size / 112.0
        target_landmarks = STANDARD_LANDMARKS_112 * scale
        src_landmarks = face.landmarks[:5].astype(np.float32)

        transform = cv2.estimateAffinePartial2D(src_landmarks, target_landmarks)[0]
        if transform is None:
            return None

        aligned = cv2.warpAffine(img_bgr, transform, (target_size, target_size))
        return aligned
