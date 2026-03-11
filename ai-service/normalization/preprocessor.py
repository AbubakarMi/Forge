import re

# Common suffixes to strip
_SUFFIXES = [
    r"\bplc\b", r"\bltd\b", r"\blimited\b", r"\bnig\b", r"\bnigeria\b",
    r"\bbank\b", r"\bmfb\b", r"\bmicrofinance\b", r"\binc\b", r"\bcorp\b",
]

# Common abbreviation expansions
_ABBREVIATIONS: dict[str, str] = {
    "gtb": "guaranty trust",
    "uba": "united bank for africa",
    "fcmb": "first city monument",
    "fbnh": "first bank",
    "zenith": "zenith",
    "stanbic": "stanbic ibtc",
    "std chartered": "standard chartered",
    "diamondbank": "access",  # Diamond merged with Access
    "skye": "polaris",  # Skye became Polaris
}

_SUFFIX_PATTERN = re.compile("|".join(_SUFFIXES), re.IGNORECASE)


def preprocess(text: str) -> str:
    """Normalize a bank name string for matching."""
    if not text:
        return ""

    # Lowercase
    result = text.lower().strip()

    # Remove special characters (keep alphanumeric and spaces)
    result = re.sub(r"[^a-z0-9\s]", " ", result)

    # Collapse whitespace
    result = re.sub(r"\s+", " ", result).strip()

    # Expand known abbreviations (exact match on full string)
    if result in _ABBREVIATIONS:
        result = _ABBREVIATIONS[result]

    # Remove common suffixes
    result = _SUFFIX_PATTERN.sub("", result).strip()

    # Collapse whitespace again after suffix removal
    result = re.sub(r"\s+", " ", result).strip()

    return result
