# Dataset License Review

All datasets must pass this review before any download or training use.
Status: ✅ APPROVED | ⚠️ MANUAL_REVIEW_REQUIRED | ❌ REJECTED

---

## FFHQ — Flickr-Faces-HQ

| Field | Value |
|---|---|
| Source URL | https://github.com/NVlabs/ffhq-dataset |
| License | Creative Commons BY-NC-SA 4.0 |
| Commercial use | **NO** — NC clause prohibits commercial products |
| Redistribution | YES, with attribution and same license |
| Download method | Official NVIDIA Google Drive links via `download_ffhq.py` |

**Status: ⚠️ MANUAL_REVIEW_REQUIRED**

**Notes:** Excellent quality (70k images, 1024×1024). Suitable for non-commercial research and internal model training. If your product is commercial, you must obtain a separate commercial license from NVIDIA or use only the model weights, not redistribute the data. Images were collected from Flickr under CC licenses — individual images may carry their own Flickr licenses.

**Action required:** Confirm your use case is non-commercial OR get NVIDIA commercial license before enabling auto-download. Set `allowed_for_download: true` in `configs/datasets.yaml` only after sign-off.

---

## CelebA — Large-scale CelebFaces Attributes Dataset

| Field | Value |
|---|---|
| Source URL | https://mmlab.ie.cuhk.edu.hk/projects/CelebA.html |
| License | Non-commercial research only |
| Commercial use | **NO** |
| Redistribution | **NO** — must download from official source |
| Download method | Google Drive (requires manual sign-in) or Kaggle mirror |

**Status: ⚠️ MANUAL_REVIEW_REQUIRED**

**Notes:** 200k+ celebrity images with 40 attribute labels. Strong baseline for attribute learning. Images are of real celebrities — public figures, but collected without individual consent forms. Research-only license explicitly stated on the CUHK project page. Do not redistribute.

**Action required:** Download manually after accepting the dataset agreement at the official page, place in `data/raw/celeba/`. Do not auto-download.

---

## LFW — Labelled Faces in the Wild

| Field | Value |
|---|---|
| Source URL | http://vis-www.cs.umass.edu/lfw/ |
| License | Unspecified — research use implied |
| Commercial use | **UNCLEAR** |
| Redistribution | **UNCLEAR** |
| Download method | Direct HTTP from UMass server |

**Status: ⚠️ MANUAL_REVIEW_REQUIRED**

**Notes:** 13,233 images of 5,749 public figures collected from news articles. The dataset has no explicit open license. UMass provides it for academic benchmarking. Individual face images were not collected with consent. Some privacy advocates have raised concerns. Suitable for benchmarking face recognition but not ideal as primary training data for a commercial product.

**Action required:** Use only for evaluation/benchmarking, not primary training. Confirm non-commercial intent before enabling download.

---

## IMDB-WIKI — Age/Gender Estimation Dataset

| Field | Value |
|---|---|
| Source URL | https://data.vision.ee.ethz.ch/cvl/rrothe/imdb-wiki/ |
| License | Research use, no explicit open license |
| Commercial use | **UNCLEAR** |
| Redistribution | **NO** explicit permission |
| Download method | Direct download from ETH Zurich server |

**Status: ⚠️ MANUAL_REVIEW_REQUIRED**

**Notes:** 524,230 images scraped from IMDB and Wikipedia. Images are of public figures (actors, directors). No individual consent forms. The ETH Zurich page states "for research purposes only." Very noisy dataset — many images are low quality, group photos, or non-portrait. Quality filtering is essential. Not recommended as primary training data for commercial use.

**Action required:** Manual review of license terms. Use only for age/gender attribute transfer learning experiments. Mark images by source (IMDB vs Wikipedia) in metadata.

---

## UTKFace — UTK Large Scale Face Dataset

| Field | Value |
|---|---|
| Source URL | https://susanqq.github.io/UTKFace/ |
| License | Research use only |
| Commercial use | **NO** |
| Redistribution | Allowed for research |
| Download method | Google Drive (manual) or academic mirrors |

**Status: ⚠️ MANUAL_REVIEW_REQUIRED**

**Notes:** 23,000+ images labeled with age, gender, ethnicity. Collected from internet, no individual consent. Research-only license. Good diversity across age and ethnicity. Clean format — each filename encodes metadata (age_gender_race_datetime.jpg).

**Action required:** Download manually from official page. Place in `data/raw/utkface/`. Good for age/diversity conditioning experiments.

---

## Human Profile Photos (Kaggle)

| Field | Value |
|---|---|
| Source URL | https://www.kaggle.com/datasets/tapakah68/facial-emotion-recognition |
| License | CC0 or dataset-specific — varies per Kaggle dataset |
| Commercial use | **UNCLEAR** |
| Redistribution | **UNCLEAR** |
| Download method | Kaggle API (`kaggle datasets download`) |

**Status: ⚠️ MANUAL_REVIEW_REQUIRED**

**Notes:** "750+ curated images from Pinterest" raises copyright concerns. Pinterest images are not under open licenses — they are typically copyrighted by their original creators. This dataset likely violates Pinterest's Terms of Service and individual image copyrights. DO NOT USE for commercial training without clearing individual image licenses.

**Action required:** ❌ Not recommended until each source image's copyright is verified. Consider as **REJECTED** for production training.

---

## 100K Faces — Generated (SAFE OPTION)

| Field | Value |
|---|---|
| Source URL | https://generated.photos/ |
| License | Generated Photos license (royalty-free) |
| Commercial use | YES (with subscription) |
| Redistribution | Depends on plan |
| Download method | API or bulk download (paid) |

**Status: ✅ APPROVED (with paid license)**

**Notes:** Fully synthetic faces generated by GANs. No real people, no privacy concerns, no consent issues. Available royalty-free for commercial use with a subscription. Excellent for bootstrapping training data. Recommended as the safest commercial training data source.

---

## SFHQ — Synthetic Faces High Quality (FREE OPTION)

| Field | Value |
|---|---|
| Source URL | https://github.com/SelfishMachines/SFHQ-dataset |
| License | CC0 1.0 Universal (Public Domain) |
| Commercial use | YES |
| Redistribution | YES |
| Download method | Hugging Face datasets |

**Status: ✅ APPROVED**

**Notes:** ~90k synthetic face images generated with StyleGAN3. Public domain. No privacy concerns. Available on Hugging Face for easy download. Recommended as primary training data for commercial use. Excellent quality, diverse demographics, consistent lighting.

---

## Summary Table

| Dataset | Size | Commercial OK | Auto-download | Recommended Use |
|---|---|---|---|---|
| FFHQ | 70k, 1024px | ❌ NC only | Manual | Research fine-tuning |
| CelebA | 200k | ❌ NC only | Manual | Attribute learning (research) |
| LFW | 13k | ⚠️ Unclear | Manual | Evaluation only |
| IMDB-WIKI | 524k | ⚠️ Unclear | Manual | Research experiments |
| UTKFace | 23k | ❌ NC only | Manual | Diversity evaluation |
| Kaggle Profile | 750 | ❌ Copyright risk | **DO NOT** | N/A |
| 100K Faces | 100k | ✅ Paid | API | Production training |
| **SFHQ** | 90k | ✅ CC0 | **Auto OK** | **Primary training** |
