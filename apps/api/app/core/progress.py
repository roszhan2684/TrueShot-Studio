"""
Generation progress tracking — Redis when available, in-memory fallback for demo.
"""
import json
from typing import Any

_store: dict[str, dict] = {}
_recent: dict[str, list] = {}
_PROGRESS_TTL = 86400

def _try_redis():
    try:
        import redis as _redis
        import os
        url = os.environ.get("REDIS_URL", "")
        if not url:
            return None
        r = _redis.from_url(url, decode_responses=True, socket_connect_timeout=1)
        r.ping()
        return r
    except Exception:
        return None


def set_progress(job_id: str, **fields: Any) -> None:
    r = _try_redis()
    if r:
        key = f"progress:{job_id}"
        mapping = {k: v if isinstance(v, str) else json.dumps(v) for k, v in fields.items()}
        r.hset(key, mapping=mapping)
        r.expire(key, _PROGRESS_TTL)
    else:
        if job_id not in _store:
            _store[job_id] = {}
        _store[job_id].update(fields)


def get_progress(job_id: str) -> dict[str, Any]:
    r = _try_redis()
    if r:
        raw = r.hgetall(f"progress:{job_id}")
        result: dict[str, Any] = {}
        for k, v in raw.items():
            try:
                result[k] = json.loads(v)
            except (json.JSONDecodeError, ValueError):
                result[k] = v
        return result
    return dict(_store.get(job_id, {}))


def append_recent_headshot(job_id: str, headshot_id: str) -> None:
    r = _try_redis()
    if r:
        key = f"progress:{job_id}:recent"
        r.rpush(key, headshot_id)
        r.ltrim(key, -8, -1)
        r.expire(key, _PROGRESS_TTL)
    else:
        lst = _recent.setdefault(job_id, [])
        lst.append(headshot_id)
        if len(lst) > 8:
            _recent[job_id] = lst[-8:]


def get_recent_headshots(job_id: str) -> list[str]:
    r = _try_redis()
    if r:
        return r.lrange(f"progress:{job_id}:recent", 0, -1)
    return list(_recent.get(job_id, []))
