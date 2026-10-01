"""
FFHQ Fetcher — MANUAL ONLY.
License: CC-BY-NC-SA-4.0. Non-commercial only.
Source: https://github.com/NVlabs/ffhq-dataset
"""
from __future__ import annotations

from pathlib import Path

from headshot_ml.config import DatasetConfig
from headshot_ml.dataset_fetchers.base import BaseFetcher
from headshot_ml.logging_utils import get_logger

log = get_logger(__name__)


class FFHQFetcher(BaseFetcher):
    def _download(self) -> Path:
        # This path is only reached if allowed_for_download=true (requires manual sign-off)
        # The actual FFHQ download requires the official NVlabs script.

        script_path = self.target / "download_ffhq.py"
        if not script_path.exists():
            log.info("ffhq_downloading_fetch_script")
            import urllib.request
            urllib.request.urlretrieve(
                "https://raw.githubusercontent.com/NVlabs/ffhq-dataset/master/download_ffhq.py",
                str(script_path),
            )

        log.info(
            "ffhq_manual_step_required",
            message=(
                "FFHQ requires running the official download script.\n"
                f"  cd {self.target}\n"
                "  python download_ffhq.py --images\n\n"
                "This will download ~2.6GB for the 256x256 thumbnails.\n"
                "For full 1024x1024: python download_ffhq.py --images --json\n"
                "Ensure you have accepted the NVIDIA terms of use."
            ),
        )
        return self.target
