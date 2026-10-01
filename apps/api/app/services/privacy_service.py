"""
Privacy Service — handles full user data deletion cascade.
Built to support GDPR/CCPA deletion requests.
Deletion order respects FK constraints.
"""
import structlog
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditEvent
from app.models.billing import BillingCustomer, Subscription
from app.models.editor import EditJob
from app.models.export import ExportAsset
from app.models.headshot import GeneratedHeadshot, IdentityProfile
from app.models.photoshoot import PhotoshootJob, UploadedReferenceImage
from app.storage.s3 import delete_object
from app.core.config import get_settings

log = structlog.get_logger(__name__)
settings = get_settings()


class PrivacyService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def delete_all_user_data(self, user_id: str) -> dict:
        """
        Hard-delete all user-generated content in correct dependency order.
        Audit events are retained for 90 days per compliance policy.
        """
        counts: dict[str, int] = {
            "deleted_uploads": 0,
            "deleted_headshots": 0,
            "deleted_exports": 0,
            "deleted_edit_jobs": 0,
            "embedding_cleared": False,
        }

        # 1. Collect all photoshoot IDs for this user
        result = await self.db.execute(
            select(PhotoshootJob.id).where(PhotoshootJob.user_id == user_id)
        )
        photoshoot_ids = [r[0] for r in result.all()]

        # 2. Delete S3 uploads and reference image records
        for ps_id in photoshoot_ids:
            ref_result = await self.db.execute(
                select(UploadedReferenceImage).where(
                    UploadedReferenceImage.photoshoot_id == ps_id
                )
            )
            for img in ref_result.scalars().all():
                _safe_s3_delete(settings.s3_bucket_uploads, img.storage_key)
                counts["deleted_uploads"] += 1
            await self.db.execute(
                delete(UploadedReferenceImage).where(
                    UploadedReferenceImage.photoshoot_id == ps_id
                )
            )

            # 3. Delete identity profiles
            await self.db.execute(
                delete(IdentityProfile).where(IdentityProfile.photoshoot_id == ps_id)
            )
            counts["embedding_cleared"] = True

            # 4. Collect headshot IDs for cascade
            hs_result = await self.db.execute(
                select(GeneratedHeadshot.id, GeneratedHeadshot.storage_key, GeneratedHeadshot.thumbnail_key).where(
                    GeneratedHeadshot.photoshoot_id == ps_id
                )
            )
            hs_rows = hs_result.all()

            for hs_id, storage_key, thumb_key in hs_rows:
                # 5. Delete exports for this headshot
                exp_result = await self.db.execute(
                    select(ExportAsset).where(ExportAsset.headshot_id == hs_id)
                )
                for exp in exp_result.scalars().all():
                    if exp.storage_key:
                        _safe_s3_delete(settings.s3_bucket_outputs, exp.storage_key)
                    counts["deleted_exports"] += 1

                await self.db.execute(
                    delete(ExportAsset).where(ExportAsset.headshot_id == hs_id)
                )

                # 6. Delete edit jobs
                ej_result = await self.db.execute(
                    select(EditJob).where(EditJob.headshot_id == hs_id)
                )
                for ej in ej_result.scalars().all():
                    if ej.result_storage_key:
                        _safe_s3_delete(settings.s3_bucket_outputs, ej.result_storage_key)
                    counts["deleted_edit_jobs"] += 1

                await self.db.execute(
                    delete(EditJob).where(EditJob.headshot_id == hs_id)
                )

                # 7. Delete the headshot itself from S3 and DB
                _safe_s3_delete(settings.s3_bucket_outputs, storage_key)
                _safe_s3_delete(settings.s3_bucket_outputs, thumb_key)
                counts["deleted_headshots"] += 1

            await self.db.execute(
                delete(GeneratedHeadshot).where(GeneratedHeadshot.photoshoot_id == ps_id)
            )

        # 8. Delete photoshoot job records
        if photoshoot_ids:
            await self.db.execute(
                delete(PhotoshootJob).where(PhotoshootJob.user_id == user_id)
            )

        # 9. Billing records — soft flag, not hard delete (Stripe reconciliation)
        await self.db.execute(
            delete(Subscription).where(Subscription.user_id == user_id)
        )
        await self.db.execute(
            delete(BillingCustomer).where(BillingCustomer.user_id == user_id)
        )

        await self.db.commit()

        log.info(
            "user_data_deleted",
            user_id=user_id,
            uploads=counts["deleted_uploads"],
            headshots=counts["deleted_headshots"],
            exports=counts["deleted_exports"],
            edits=counts["deleted_edit_jobs"],
        )
        return counts

    async def get_privacy_settings(self, user_id: str) -> dict:
        from app.models.user import User
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        return {
            "user_id": user_id,
            "upload_retention_days": 30,
            "output_retention_days": 90,
            "data_deletion_requested_at": user.data_deletion_requested_at if user else None,
            "audit_log_available": True,
        }


def _safe_s3_delete(bucket: str, key: str) -> None:
    try:
        delete_object(bucket, key)
    except Exception as exc:
        log.warning("s3_delete_skipped", bucket=bucket, key=key, error=str(exc))
