export interface GeneratedHeadshot {
  id: string
  photoshootId: string
  stylePackId: string
  storageKey: string
  thumbnailKey: string
  prompt: string | null
  modelId: string | null
  qualityScore: QualityScore | null
  overallScore: number        // 0–1 weighted composite
  rank: number                // ascending, 1 = best
  isFavorited: boolean
  isRejected: boolean
  generatedAt: string
  createdAt: string
}

export interface QualityScore {
  identitySimilarity: number  // 0–1, compared against reference embeddings
  faceQuality: number         // 0–1 general face quality
  sharpness: number           // 0–1
  naturalEyes: number         // 0–1
  skinTexture: number         // 0–1
  symmetry: number            // 0–1
  teethArtifacts: number      // 0–1, higher = less artifacts
  backgroundArtifacts: number // 0–1
  composition: number         // 0–1 rule-of-thirds, framing
  // Derived
  overallScore: number
  passedQualityGate: boolean
  rejectionReasons: string[]
}

export interface IdentityProfile {
  id: string
  photoshootId: string
  embeddingVersion: string
  vectorDimension: number
  // The actual embedding vector is stored in the backend only, never sent to client
  createdAt: string
}
