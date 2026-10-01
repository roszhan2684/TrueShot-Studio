"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-04-22
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # workspaces (no FK deps)
    op.create_table(
        "workspaces",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False, unique=True),
        sa.Column("owner_id", sa.String(26), nullable=False),
        sa.Column("plan", sa.String(32), nullable=False, server_default="free"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_workspaces_slug", "workspaces", ["slug"])

    # users
    op.create_table(
        "users",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("clerk_id", sa.String(128), nullable=False, unique=True),
        sa.Column("email", sa.String(320), nullable=False, unique=True),
        sa.Column("name", sa.String(200)),
        sa.Column("avatar_url", sa.String(2048)),
        sa.Column("workspace_id", sa.String(26), sa.ForeignKey("workspaces.id", ondelete="SET NULL")),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("data_deletion_requested_at", sa.String(32)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_clerk_id", "users", ["clerk_id"])
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_workspace_id", "users", ["workspace_id"])

    # team_invites
    op.create_table(
        "team_invites",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("workspace_id", sa.String(26), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("role", sa.String(32), nullable=False, server_default="member"),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("expires_at", sa.String(32), nullable=False),
        sa.Column("accepted_at", sa.String(32)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_team_invites_workspace_id", "team_invites", ["workspace_id"])

    # photoshoot_jobs
    op.create_table(
        "photoshoot_jobs",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("user_id", sa.String(26), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("workspace_id", sa.String(26), sa.ForeignKey("workspaces.id", ondelete="SET NULL")),
        sa.Column("title", sa.String(200)),
        sa.Column("status", sa.String(32), nullable=False, server_default="draft"),
        sa.Column("style_pack_ids", sa.JSON, nullable=False),
        sa.Column("reference_image_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("generated_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("quality_pass_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text),
        sa.Column("celery_task_id", sa.String(64)),
        sa.Column("started_at", sa.String(32)),
        sa.Column("completed_at", sa.String(32)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_photoshoot_jobs_user_id", "photoshoot_jobs", ["user_id"])
    op.create_index("ix_photoshoot_jobs_status", "photoshoot_jobs", ["status"])

    # uploaded_reference_images
    op.create_table(
        "uploaded_reference_images",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("photoshoot_id", sa.String(26), sa.ForeignKey("photoshoot_jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("storage_key", sa.String(512), nullable=False),
        sa.Column("file_name", sa.String(255), nullable=False),
        sa.Column("file_size", sa.Integer, nullable=False),
        sa.Column("mime_type", sa.String(64), nullable=False),
        sa.Column("quality_signals", sa.JSON),
        sa.Column("is_rejected", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("rejection_reason", sa.String(200)),
        sa.Column("uploaded_at", sa.String(32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_uploaded_reference_images_photoshoot_id", "uploaded_reference_images", ["photoshoot_id"])

    # identity_profiles
    op.create_table(
        "identity_profiles",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("photoshoot_id", sa.String(26), sa.ForeignKey("photoshoot_jobs.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("embedding_vector", sa.JSON),
        sa.Column("embedding_version", sa.String(32), nullable=False),
        sa.Column("vector_dimension", sa.Integer, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_identity_profiles_photoshoot_id", "identity_profiles", ["photoshoot_id"])

    # generated_headshots
    op.create_table(
        "generated_headshots",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("photoshoot_id", sa.String(26), sa.ForeignKey("photoshoot_jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("style_pack_id", sa.String(64), nullable=False),
        sa.Column("storage_key", sa.String(512), nullable=False),
        sa.Column("thumbnail_key", sa.String(512), nullable=False),
        sa.Column("prompt", sa.Text),
        sa.Column("model_id", sa.String(128)),
        sa.Column("quality_score", sa.JSON),
        sa.Column("overall_score", sa.Float, nullable=False, server_default="0"),
        sa.Column("rank", sa.Integer, nullable=False, server_default="999"),
        sa.Column("is_favorited", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("is_rejected", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("generated_at", sa.String(32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_generated_headshots_photoshoot_id", "generated_headshots", ["photoshoot_id"])
    op.create_index("ix_generated_headshots_overall_score", "generated_headshots", ["overall_score"])

    # edit_jobs
    op.create_table(
        "edit_jobs",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("headshot_id", sa.String(26), sa.ForeignKey("generated_headshots.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(26), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="queued"),
        sa.Column("edit_type", sa.String(64), nullable=False),
        sa.Column("parameters", sa.JSON, nullable=False),
        sa.Column("result_storage_key", sa.String(512)),
        sa.Column("result_thumbnail_key", sa.String(512)),
        sa.Column("celery_task_id", sa.String(64)),
        sa.Column("error_message", sa.Text),
        sa.Column("started_at", sa.String(32)),
        sa.Column("completed_at", sa.String(32)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_edit_jobs_headshot_id", "edit_jobs", ["headshot_id"])
    op.create_index("ix_edit_jobs_status", "edit_jobs", ["status"])

    # export_assets
    op.create_table(
        "export_assets",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("headshot_id", sa.String(26), sa.ForeignKey("generated_headshots.id", ondelete="CASCADE"), nullable=False),
        sa.Column("edit_job_id", sa.String(26), sa.ForeignKey("edit_jobs.id", ondelete="SET NULL")),
        sa.Column("user_id", sa.String(26), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("format", sa.String(64), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="queued"),
        sa.Column("storage_key", sa.String(512)),
        sa.Column("file_size", sa.Integer),
        sa.Column("width_px", sa.Integer, nullable=False),
        sa.Column("height_px", sa.Integer, nullable=False),
        sa.Column("expires_at", sa.String(32)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_export_assets_headshot_id", "export_assets", ["headshot_id"])
    op.create_index("ix_export_assets_status", "export_assets", ["status"])

    # billing_customers
    op.create_table(
        "billing_customers",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("user_id", sa.String(26), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("stripe_customer_id", sa.String(64), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_billing_customers_user_id", "billing_customers", ["user_id"])
    op.create_index("ix_billing_customers_stripe_customer_id", "billing_customers", ["stripe_customer_id"])

    # subscriptions
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("user_id", sa.String(26), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("billing_customer_id", sa.String(26), sa.ForeignKey("billing_customers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("workspace_id", sa.String(26), sa.ForeignKey("workspaces.id", ondelete="SET NULL")),
        sa.Column("stripe_subscription_id", sa.String(64), nullable=False, unique=True),
        sa.Column("stripe_price_id", sa.String(64), nullable=False),
        sa.Column("plan", sa.String(32), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("current_period_start", sa.String(32), nullable=False),
        sa.Column("current_period_end", sa.String(32), nullable=False),
        sa.Column("cancel_at_period_end", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("cancelled_at", sa.String(32)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"])
    op.create_index("ix_subscriptions_status", "subscriptions", ["status"])

    # audit_events
    op.create_table(
        "audit_events",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("user_id", sa.String(26), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("workspace_id", sa.String(26)),
        sa.Column("action", sa.String(64), nullable=False),
        sa.Column("resource_type", sa.String(64), nullable=False),
        sa.Column("resource_id", sa.String(26), nullable=False),
        sa.Column("metadata", sa.JSON, nullable=False),
        sa.Column("ip_address", sa.String(45)),
        sa.Column("user_agent", sa.String(512)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_audit_events_user_id", "audit_events", ["user_id"])
    op.create_index("ix_audit_events_action", "audit_events", ["action"])
    op.create_index("ix_audit_events_resource_id", "audit_events", ["resource_id"])


def downgrade() -> None:
    for table in [
        "audit_events", "subscriptions", "billing_customers",
        "export_assets", "edit_jobs", "generated_headshots",
        "identity_profiles", "uploaded_reference_images",
        "photoshoot_jobs", "team_invites", "users", "workspaces",
    ]:
        op.drop_table(table)
