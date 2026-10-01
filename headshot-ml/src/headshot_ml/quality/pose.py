"""Face pose estimation — flags extreme yaw/pitch that hurt training."""


def is_acceptable_pose(
    pose: dict | None,
    max_yaw_deg: float = 45.0,
    max_pitch_deg: float = 30.0,
) -> tuple[bool, str]:
    """
    Returns (acceptable, reason).
    If pose is None (detection didn't provide it), returns (True, '') — no penalty.
    """
    if pose is None:
        return True, ""

    yaw = abs(pose.get("yaw", 0.0))
    pitch = abs(pose.get("pitch", 0.0))

    if yaw > max_yaw_deg:
        return False, f"extreme_yaw_{yaw:.0f}deg"
    if pitch > max_pitch_deg:
        return False, f"extreme_pitch_{pitch:.0f}deg"
    return True, ""
