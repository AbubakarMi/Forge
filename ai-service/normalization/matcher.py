import numpy as np
from .preprocessor import preprocess
from .embeddings import index as bank_index

_CONFIDENCE_THRESHOLD = 0.7


def normalize_bank_name(raw_name: str) -> dict:
    """
    Normalize a bank name through a multi-stage pipeline:
    1. Preprocess input
    2. Check exact match against names and aliases
    3. If no exact match, use embedding similarity
    4. Return best match with confidence score
    """
    if not raw_name or not raw_name.strip():
        return {
            "normalized_bank": None,
            "bank_code": None,
            "confidence": 0.0,
            "original_input": raw_name,
            "match_type": "none",
        }

    processed = preprocess(raw_name)

    # Stage 1: Exact match on preprocessed text
    for bank_idx, text, _ in bank_index.entries:
        if text == processed:
            bank = bank_index.get_bank(bank_idx)
            return {
                "normalized_bank": bank["name"],
                "bank_code": bank["code"],
                "confidence": 1.0,
                "original_input": raw_name,
                "match_type": "exact",
            }

    # Stage 2: Embedding similarity
    query_embedding = bank_index.encode(raw_name)

    # Cosine similarity (embeddings are already normalized)
    similarities = np.dot(bank_index.embedding_matrix, query_embedding)

    best_idx = int(np.argmax(similarities))
    best_score = float(similarities[best_idx])
    best_bank_idx = bank_index.entries[best_idx][0]
    bank = bank_index.get_bank(best_bank_idx)

    if best_score < _CONFIDENCE_THRESHOLD:
        return {
            "normalized_bank": None,
            "bank_code": None,
            "confidence": round(best_score, 4),
            "original_input": raw_name,
            "match_type": "rejected",
            "best_guess": bank["name"],
            "best_guess_code": bank["code"],
        }

    return {
        "normalized_bank": bank["name"],
        "bank_code": bank["code"],
        "confidence": round(best_score, 4),
        "original_input": raw_name,
        "match_type": "semantic",
    }


def normalize_bank_names(names: list[str]) -> list[dict]:
    """Batch normalize multiple bank names."""
    return [normalize_bank_name(name) for name in names]
