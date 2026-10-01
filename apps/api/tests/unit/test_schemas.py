"""Unit tests for Pydantic schema validation."""
import pytest
from pydantic import ValidationError


class TestPhotoshootCreate:
    def test_valid_payload(self):
        from app.schemas.photoshoot import PhotoshootCreate

        obj = PhotoshootCreate(style_pack_ids=["corporate-studio", "linkedin-modern"])
        assert obj.style_pack_ids == ["corporate-studio", "linkedin-modern"]

    def test_empty_title_allowed(self):
        from app.schemas.photoshoot import PhotoshootCreate

        obj = PhotoshootCreate(style_pack_ids=["corporate-studio"])
        assert obj.title is None

    def test_missing_pack_ids_rejected(self):
        from app.schemas.photoshoot import PhotoshootCreate

        with pytest.raises(ValidationError):
            PhotoshootCreate()  # style_pack_ids required


class TestExportCreate:
    def test_valid_format(self):
        from app.schemas.export import ExportCreate, VALID_EXPORT_FORMATS

        fmt = next(iter(VALID_EXPORT_FORMATS))
        obj = ExportCreate(headshot_id="abc123", format=fmt)
        assert obj.format == fmt

    def test_invalid_format_rejected(self):
        from app.schemas.export import ExportCreate

        with pytest.raises(ValidationError):
            ExportCreate(headshot_id="abc123", format="not_a_real_format")


class TestWorkspaceCreate:
    def test_slug_auto_generated_from_name(self):
        from app.schemas.workspace import WorkspaceCreate

        obj = WorkspaceCreate(name="My Cool Company")
        assert obj.slug == "my-cool-company"

    def test_slug_provided_as_is(self):
        from app.schemas.workspace import WorkspaceCreate

        obj = WorkspaceCreate(name="Test", slug="custom-slug")
        assert obj.slug == "custom-slug"
