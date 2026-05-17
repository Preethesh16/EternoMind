from __future__ import annotations

import html
import re

from fastapi import HTTPException

# Patterns that indicate prompt injection / jailbreak attempts
_INJECTION_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"ignore\s+(all\s+)?previous\s+instructions", re.IGNORECASE),
    re.compile(r"disregard\s+(all\s+)?previous\s+instructions", re.IGNORECASE),
    re.compile(r"forget\s+(all\s+)?previous\s+instructions", re.IGNORECASE),
    re.compile(r"system\s+prompt", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+", re.IGNORECASE),
    re.compile(r"act\s+as\s+(if\s+you\s+are|a\s+)", re.IGNORECASE),
    re.compile(r"pretend\s+(to\s+be|you\s+are)", re.IGNORECASE),
    re.compile(r"jailbreak", re.IGNORECASE),
    re.compile(r"DAN\b", re.IGNORECASE),  # "Do Anything Now" jailbreak
    re.compile(r"<\s*script", re.IGNORECASE),
    re.compile(r"prompt\s+injection", re.IGNORECASE),
    re.compile(r"override\s+(your\s+)?(rules|instructions|constraints)", re.IGNORECASE),
]

# Control characters (except tab, newline, carriage return which are legitimate)
_CONTROL_CHAR_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def sanitize_input(text: str) -> str:
    """
    Strip HTML tags and control characters from user input.

    Returns the cleaned string. Does NOT raise — callers decide whether
    to reject. Use detect_prompt_injection to check for malicious intent.
    """
    # Unescape HTML entities first, then strip tags
    text = html.unescape(text)
    text = re.sub(r"<[^>]+>", "", text)

    # Remove control characters (keep tab \x09, newline \x0a, CR \x0d)
    text = _CONTROL_CHAR_RE.sub("", text)

    # Collapse excessive whitespace runs (optional hygiene)
    text = re.sub(r"[ \t]{2,}", " ", text)

    return text.strip()


def detect_prompt_injection(text: str) -> bool:
    """
    Return True if the text contains patterns that indicate a prompt injection
    or jailbreak attempt.
    """
    return any(pattern.search(text) for pattern in _INJECTION_PATTERNS)


def validate_and_sanitize(text: str) -> str:
    """
    Convenience helper: sanitize then check for injection.
    Raises HTTPException(400) if injection is detected.
    Returns the sanitized text if clean.
    """
    cleaned = sanitize_input(text)
    if detect_prompt_injection(cleaned):
        raise HTTPException(status_code=400, detail="Rejected input")
    return cleaned
