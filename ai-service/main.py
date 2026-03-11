from contextlib import asynccontextmanager
from fastapi import FastAPI
from pydantic import BaseModel
from normalization.matcher import normalize_bank_name, normalize_bank_names
from normalization.embeddings import index as bank_index


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load model and build index
    bank_index.load()
    yield
    # Shutdown: nothing to clean up


app = FastAPI(
    title="Forge AI — Bank Normalization Service",
    version="1.0.0",
    lifespan=lifespan,
)


# ── Request / Response Models ────────────────────────────────────────────────

class NormalizeSingleRequest(BaseModel):
    bank_name: str


class NormalizeBatchRequest(BaseModel):
    bank_names: list[str]


class NormalizationResult(BaseModel):
    normalized_bank: str | None
    bank_code: str | None
    confidence: float
    original_input: str
    match_type: str
    best_guess: str | None = None
    best_guess_code: str | None = None


class BatchResult(BaseModel):
    results: list[NormalizationResult]


class HealthResponse(BaseModel):
    status: str
    bank_count: int
    index_size: int


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok",
        bank_count=len(bank_index.banks),
        index_size=len(bank_index.entries),
    )


@app.post("/normalize-bank", response_model=NormalizationResult)
def normalize_single(request: NormalizeSingleRequest):
    result = normalize_bank_name(request.bank_name)
    return NormalizationResult(**result)


@app.post("/normalize-banks", response_model=BatchResult)
def normalize_batch(request: NormalizeBatchRequest):
    results = normalize_bank_names(request.bank_names)
    return BatchResult(results=[NormalizationResult(**r) for r in results])
