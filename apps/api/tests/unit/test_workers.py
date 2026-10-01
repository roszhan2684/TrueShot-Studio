"""Unit tests for worker task helper functions."""
import pytest
from unittest.mock import patch, MagicMock


class TestPlaceholderPng:
    def test_valid_png_signature(self):
        from app.workers.tasks.generation import _placeholder_png

        data = _placeholder_png("corporate-studio", 0)
        assert data[:8] == b"\x89PNG\r\n\x1a\n", "Must start with valid PNG signature"

    def test_all_packs_produce_bytes(self):
        from app.workers.tasks.generation import _placeholder_png, PACK_COLORS

        for pack_id in PACK_COLORS:
            data = _placeholder_png(pack_id, 0)
            assert len(data) > 10
            assert data[:8] == b"\x89PNG\r\n\x1a\n"

    def test_unknown_pack_fallback(self):
        from app.workers.tasks.generation import _placeholder_png

        data = _placeholder_png("nonexistent-pack", 0)
        assert data[:8] == b"\x89PNG\r\n\x1a\n"


class TestWeightedScore:
    def test_score_within_range(self):
        from app.workers.tasks.evaluation import _weighted_score, SCORE_WEIGHTS

        scores = {dim: 0.8 for dim in SCORE_WEIGHTS}
        result = _weighted_score(scores)
        assert 0.0 <= result <= 1.0

    def test_all_zeros(self):
        from app.workers.tasks.evaluation import _weighted_score, SCORE_WEIGHTS

        scores = {dim: 0.0 for dim in SCORE_WEIGHTS}
        assert _weighted_score(scores) == 0.0

    def test_all_ones(self):
        from app.workers.tasks.evaluation import _weighted_score, SCORE_WEIGHTS

        scores = {dim: 1.0 for dim in SCORE_WEIGHTS}
        result = _weighted_score(scores)
        assert abs(result - 1.0) < 1e-6

    def test_weights_sum_to_one(self):
        from app.workers.tasks.evaluation import SCORE_WEIGHTS

        total = sum(SCORE_WEIGHTS.values())
        assert abs(total - 1.0) < 1e-6, f"Weights sum to {total}, expected 1.0"


class TestScoreHeadshot:
    def test_all_dims_present(self):
        from app.workers.tasks.evaluation import _score_headshot, SCORE_WEIGHTS

        scores = _score_headshot()
        for dim in SCORE_WEIGHTS:
            assert dim in scores, f"Missing dimension: {dim}"

    def test_scores_in_range(self):
        from app.workers.tasks.evaluation import _score_headshot

        for _ in range(20):
            scores = _score_headshot()
            for k, v in scores.items():
                assert 0.0 <= v <= 1.0, f"{k}={v} out of range"


class TestProgressModule:
    def test_set_and_get_progress(self):
        """Test that progress round-trips correctly through mock Redis."""
        mock_redis = MagicMock()
        mock_redis.hgetall.return_value = {
            "total_outputs": "16",
            "completed_outputs": "7",
            "current_step": "Generating Corporate Studio (3/4)",
        }

        with patch("app.core.progress._redis", return_value=mock_redis):
            from app.core.progress import get_progress

            result = get_progress("test-job-id")
            assert result["total_outputs"] == 16
            assert result["completed_outputs"] == 7
            assert result["current_step"] == "Generating Corporate Studio (3/4)"

    def test_set_progress_calls_hset(self):
        mock_redis = MagicMock()

        with patch("app.core.progress._redis", return_value=mock_redis):
            from app.core.progress import set_progress

            set_progress("job-123", total_outputs=16, completed_outputs=0)
            mock_redis.hset.assert_called_once()
            mock_redis.expire.assert_called_once()
