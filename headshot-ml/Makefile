.PHONY: setup install review-datasets fetch preprocess quality split train eval report clean help

PYTHON := python3
UV := uv
VENV := .venv
PIP := $(VENV)/bin/pip
PYTHON_VENV := $(VENV)/bin/python

# ─── Setup ────────────────────────────────────────────────────────────────────

setup: ## Create virtualenv and install all dependencies
	@echo "Setting up headshot-ml environment..."
	$(UV) venv $(VENV) --python 3.11 || python3 -m venv $(VENV)
	$(VENV)/bin/pip install --upgrade pip
	$(VENV)/bin/pip install -e ".[dev]"
	@echo ""
	@echo "✓ Environment ready. Activate with: source $(VENV)/bin/activate"

install: ## Install/update dependencies only
	$(VENV)/bin/pip install -e ".[dev]"

# ─── Dataset pipeline ─────────────────────────────────────────────────────────

review-datasets: ## Print license review summary for all configured datasets
	$(PYTHON_VENV) scripts/review_datasets.py

verify-licenses: ## Run automated license checks and flag blockers
	$(PYTHON_VENV) scripts/verify_licenses.py

fetch: ## Download all approved datasets (auto-downloadable only)
	$(PYTHON_VENV) scripts/fetch_datasets.py

fetch-sfhq: ## Download SFHQ (CC0, auto-approved)
	$(PYTHON_VENV) scripts/fetch_datasets.py --dataset sfhq

fetch-manual: ## Print manual download instructions for all restricted datasets
	$(PYTHON_VENV) scripts/fetch_datasets.py --manual-only

# ─── Preprocessing pipeline ───────────────────────────────────────────────────

preprocess: ## Run full preprocessing pipeline (detect → align → crop → dedup)
	$(PYTHON_VENV) scripts/preprocess_faces.py

preprocess-sfhq: ## Preprocess SFHQ dataset only
	$(PYTHON_VENV) scripts/preprocess_faces.py --dataset sfhq

build-manifest: ## Build JSONL metadata manifest for all processed images
	$(PYTHON_VENV) scripts/build_manifest.py

# ─── Quality pipeline ─────────────────────────────────────────────────────────

quality: ## Score all images and generate quality reports
	$(PYTHON_VENV) scripts/quality_filter.py

quality-report: ## Plot quality score distributions
	$(PYTHON_VENV) scripts/quality_filter.py --report-only

# ─── Splits ───────────────────────────────────────────────────────────────────

split: ## Create train/val/test manifests
	$(PYTHON_VENV) scripts/split_dataset.py

# ─── Training ─────────────────────────────────────────────────────────────────

train: ## Train the baseline quality ranker model
	$(PYTHON_VENV) scripts/train_baseline.py \
		--config configs/training.yaml

train-resume: ## Resume training from last checkpoint
	$(PYTHON_VENV) scripts/train_baseline.py \
		--config configs/training.yaml \
		--resume artifacts/checkpoints/last.pth

# ─── Evaluation ───────────────────────────────────────────────────────────────

eval: ## Run full evaluation on test split
	$(PYTHON_VENV) scripts/evaluate_model.py \
		--config configs/evaluation.yaml

# ─── Reports ──────────────────────────────────────────────────────────────────

report: ## Generate all compliance and reproducibility reports
	$(PYTHON_VENV) scripts/export_report.py

# ─── Development ──────────────────────────────────────────────────────────────

lint: ## Run ruff linter
	$(VENV)/bin/ruff check src/ scripts/ tests/

format: ## Auto-format with ruff
	$(VENV)/bin/ruff format src/ scripts/ tests/

test: ## Run tests
	$(VENV)/bin/pytest tests/ -v

test-fast: ## Run fast unit tests only
	$(VENV)/bin/pytest tests/ -v -m "not slow"

notebook: ## Start JupyterLab
	$(VENV)/bin/jupyter lab --notebook-dir=notebooks/

# ─── Cleanup ──────────────────────────────────────────────────────────────────

clean-artifacts: ## Remove training artifacts (keep data)
	rm -rf artifacts/
	@echo "Artifacts cleaned."

clean-processed: ## Remove processed data (keep raw)
	rm -rf data/interim/ data/processed/ data/manifests/
	mkdir -p data/interim data/processed data/manifests
	@echo "Processed data cleaned."

clean: ## Full clean (artifacts + processed, keep raw data)
	make clean-artifacts
	make clean-processed

# ─── Bootstrap ────────────────────────────────────────────────────────────────

bootstrap: ## Run the full setup → fetch → preprocess → quality → split pipeline
	make setup
	$(PYTHON_VENV) scripts/bootstrap_project.py

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-25s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
