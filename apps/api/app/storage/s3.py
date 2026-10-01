"""
Storage — returns SVG data-URL placeholders in demo mode (no S3 needed).
"""
import os
import base64
from datetime import datetime, timedelta, timezone
from typing import Any

_DEMO = not os.environ.get("AWS_ACCESS_KEY_ID", "").startswith("AKIA")

# Colour palette per style pack
_PACK_COLORS = {
    "corporate-studio": "#e6e6e6",
    "linkedin-modern": "#c8dcf0",
    "founder-casual": "#dcc8bc",
    "executive-dark": "#1e1e32",
    "creative-pro": "#c8b4a0",
    "team-page": "#d2d2e1",
}

_PACK_TEXT_COLOR = {
    "executive-dark": "#ffffff",
}


def _demo_svg(pack_id: str, label: str = "") -> str:
    """Return a base64-encoded SVG data URL as a stand-in for a real headshot."""
    bg = _PACK_COLORS.get(pack_id, "#d0d0d0")
    fg = _PACK_TEXT_COLOR.get(pack_id, "#333333")
    name = pack_id.replace("-", " ").title()
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500">'
        f'<rect width="400" height="500" fill="{bg}"/>'
        f'<circle cx="200" cy="160" r="70" fill="{fg}" opacity="0.15"/>'
        f'<rect x="120" y="260" width="160" height="180" rx="16" fill="{fg}" opacity="0.1"/>'
        f'<text x="200" y="470" text-anchor="middle" font-family="system-ui" '
        f'font-size="14" fill="{fg}" opacity="0.6">{name}</text>'
        f'</svg>'
    )
    b64 = base64.b64encode(svg.encode()).decode()
    return f"data:image/svg+xml;base64,{b64}"


def generate_presigned_upload(
    bucket: str,
    key: str,
    mime_type: str,
    expiry_seconds: int = 3600,
) -> dict[str, Any]:
    if _DEMO:
        # Return a mock presigned POST that points to our own demo-upload endpoint
        expires_at = (datetime.now(timezone.utc) + timedelta(seconds=expiry_seconds)).isoformat()
        return {
            "upload_url": f"{os.environ.get('API_BASE_URL', 'http://localhost:8000')}/api/v1/demo-upload",
            "fields": {"key": key, "Content-Type": mime_type},
            "expires_at": expires_at,
        }

    from functools import lru_cache
    import boto3
    from botocore.config import Config
    from app.core.config import get_settings
    settings = get_settings()

    kwargs: dict[str, Any] = {
        "aws_access_key_id": settings.aws_access_key_id,
        "aws_secret_access_key": settings.aws_secret_access_key,
        "region_name": settings.aws_region,
        "config": Config(signature_version="s3v4"),
    }
    if settings.s3_endpoint_url:
        kwargs["endpoint_url"] = settings.s3_endpoint_url
    client = boto3.client("s3", **kwargs)
    response = client.generate_presigned_post(
        Bucket=bucket, Key=key,
        Fields={"Content-Type": mime_type},
        Conditions=[{"Content-Type": mime_type}],
        ExpiresIn=expiry_seconds,
    )
    expires_at = (datetime.now(timezone.utc) + timedelta(seconds=expiry_seconds)).isoformat()
    return {"upload_url": response["url"], "fields": response["fields"], "expires_at": expires_at}


def generate_presigned_get(bucket: str, key: str, expiry_seconds: int = 3600) -> str:
    """Return the key itself if it's already a data URL, else generate a presigned GET."""
    if key.startswith("data:"):
        return key

    if _DEMO:
        # Derive pack id from key path: outputs/{job_id}/{pack_id}/...
        parts = key.split("/")
        pack_id = parts[2] if len(parts) >= 3 else "corporate-studio"
        return _demo_svg(pack_id)

    import boto3
    from botocore.config import Config
    from app.core.config import get_settings
    settings = get_settings()
    kwargs: dict[str, Any] = {
        "aws_access_key_id": settings.aws_access_key_id,
        "aws_secret_access_key": settings.aws_secret_access_key,
        "region_name": settings.aws_region,
        "config": Config(signature_version="s3v4"),
    }
    if settings.s3_endpoint_url:
        kwargs["endpoint_url"] = settings.s3_endpoint_url
    client = boto3.client("s3", **kwargs)
    return client.generate_presigned_url(
        "get_object", Params={"Bucket": bucket, "Key": key}, ExpiresIn=expiry_seconds
    )


def delete_object(bucket: str, key: str) -> None:
    if _DEMO:
        return
    try:
        import boto3
        from botocore.config import Config
        from app.core.config import get_settings
        settings = get_settings()
        kwargs: dict[str, Any] = {
            "aws_access_key_id": settings.aws_access_key_id,
            "aws_secret_access_key": settings.aws_secret_access_key,
            "region_name": settings.aws_region,
            "config": Config(signature_version="s3v4"),
        }
        if settings.s3_endpoint_url:
            kwargs["endpoint_url"] = settings.s3_endpoint_url
        boto3.client("s3", **kwargs).delete_object(Bucket=bucket, Key=key)
    except Exception as exc:
        import structlog
        structlog.get_logger().warning("s3_delete_failed", key=key, error=str(exc))
