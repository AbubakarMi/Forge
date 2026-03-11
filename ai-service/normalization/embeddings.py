import json
import os
import numpy as np
from sentence_transformers import SentenceTransformer
from .preprocessor import preprocess

_MODEL_NAME = "all-MiniLM-L6-v2"
_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "banks.json")


class BankEmbeddingIndex:
    """Loads bank data, generates embeddings, and provides lookup."""

    def __init__(self):
        self.model: SentenceTransformer | None = None
        self.banks: list[dict] = []
        # Each entry: (bank_index, text, embedding)
        self.entries: list[tuple[int, str, np.ndarray]] = []
        self.embedding_matrix: np.ndarray | None = None

    def load(self):
        """Load model and build embedding index."""
        print("[embeddings] Loading sentence-transformer model...")
        self.model = SentenceTransformer(_MODEL_NAME)

        print(f"[embeddings] Loading bank data from {_DATA_PATH}...")
        with open(_DATA_PATH, "r", encoding="utf-8") as f:
            self.banks = json.load(f)

        # Collect all texts to embed: bank name + aliases
        texts: list[str] = []
        bank_indices: list[int] = []

        for idx, bank in enumerate(self.banks):
            # Add the bank name itself
            name = bank["name"]
            texts.append(preprocess(name))
            bank_indices.append(idx)

            # Add aliases
            for alias in bank.get("aliases", []):
                texts.append(preprocess(alias))
                bank_indices.append(idx)

        print(f"[embeddings] Generating embeddings for {len(texts)} texts...")
        embeddings = self.model.encode(texts, show_progress_bar=True,
                                        normalize_embeddings=True)

        self.entries = []
        for i, (bank_idx, text) in enumerate(zip(bank_indices, texts)):
            self.entries.append((bank_idx, text, embeddings[i]))

        self.embedding_matrix = np.array([e[2] for e in self.entries])
        print(f"[embeddings] Index ready: {len(self.banks)} banks, {len(self.entries)} entries.")

    def encode(self, text: str) -> np.ndarray:
        """Encode a single text string."""
        if self.model is None:
            raise RuntimeError("Model not loaded. Call load() first.")
        processed = preprocess(text)
        embedding = self.model.encode([processed], normalize_embeddings=True)
        return embedding[0]

    def get_bank(self, index: int) -> dict:
        return self.banks[index]


# Singleton
index = BankEmbeddingIndex()
