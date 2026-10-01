"""Blur detection via Laplacian variance — industry standard for sharpness estimation."""
import cv2
import numpy as np


def laplacian_variance(image: np.ndarray) -> float:
    """
    Compute Laplacian variance as sharpness score.
    Higher = sharper. Threshold ~50 is reasonable for portrait photos.
    """
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def fft_blur_score(image: np.ndarray) -> float:
    """
    FFT-based blur detection — more robust than Laplacian for some cases.
    Returns score 0-1 (higher = sharper).
    """
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()

    h, w = gray.shape
    cx, cy = w // 2, h // 2

    fft = np.fft.fft2(gray.astype(np.float32))
    fft_shift = np.fft.fftshift(fft)

    # Mask out high-frequency center
    size = 60
    fft_shift[cy - size:cy + size, cx - size:cx + size] = 0

    recon = np.fft.ifft2(np.fft.ifftshift(fft_shift))
    magnitude = 20 * np.log(np.abs(recon) + 1e-8)
    return float(np.mean(magnitude))
