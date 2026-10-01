from fastapi import APIRouter

from app.api.v1.routes import (
    auth,
    uploads,
    photoshoots,
    headshots,
    editor,
    exports,
    billing,
    privacy,
    workspace,
)

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
router.include_router(photoshoots.router, prefix="/photoshoots", tags=["photoshoots"])
router.include_router(headshots.router, prefix="/headshots", tags=["headshots"])
router.include_router(editor.router, prefix="/editor", tags=["editor"])
router.include_router(exports.router, prefix="/exports", tags=["exports"])
router.include_router(billing.router, prefix="/billing", tags=["billing"])
router.include_router(privacy.router, prefix="/privacy", tags=["privacy"])
router.include_router(workspace.router, prefix="/workspaces", tags=["workspaces"])
