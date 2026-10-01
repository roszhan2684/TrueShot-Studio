"""Brightness and contrast quality metrics."""
import cv2
import numpy as np


def mean_brightness(image: np.ndarray) -> float:
    """Mean luminance of the image (0-255 scale)."""
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    return float(np.mean(gray))


def rms_contrast(image: np.ndarray) -> float:
    """Root-mean-square contrast — measures dynamic range."""
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY).astype(np.float32)
    else:
        gray = image.astype(np.float32)
    return float(np.sqrt(np.mean((gray - np.mean(gray)) ** 2)))


def histogram_spread(image: np.ndarray) -> float:
    """
    Normalised histogram spread — measures tonal range.
    Values near 1.0 indicate well-exposed images.
    """
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
    hist = hist.flatten() / hist.sum()
    nonzero = np.count_nonzero(hist)
    return float(nonzero / 256.0)
