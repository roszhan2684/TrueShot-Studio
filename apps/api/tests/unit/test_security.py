"""Unit tests for security utilities."""
import pytest
from app.core.security import generate_token, hash_token


class TestTokenSecurity:
    def test_generate_token_length(self):
        token = generate_token()
        assert len(token) == 64, "Token should be 64 hex chars (32 bytes)"

    def test_generate_token_is_hex(self):
        token = generate_token()
        int(token, 16)  # raises ValueError if not valid hex

    def test_tokens_are_unique(self):
        tokens = {generate_token() for _ in range(100)}
        assert len(tokens) == 100, "All tokens should be unique"

    def test_hash_is_deterministic(self):
        token = generate_token()
        h1 = hash_token(token)
        h2 = hash_token(token)
        assert h1 == h2

    def test_hash_length(self):
        token = generate_token()
        h = hash_token(token)
        assert len(h) == 64, "SHA-256 hex digest is 64 chars"

    def test_different_tokens_different_hashes(self):
        t1 = generate_token()
        t2 = generate_token()
        assert hash_token(t1) != hash_token(t2)
