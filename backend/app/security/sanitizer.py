from __future__ import annotations

import html
import re

from fastapi import HTTPException

# Patterns that indicate prompt injection / jailbreak attempts
_INJECTION_PATTERNS: list[re.Pattern[str]] = [
    # Instruction overrides
    re.compile(r"ignore\s+(all\s+)?previous\s+instructions", re.IGNORECASE),
    re.compile(r"disregard\s+(all\s+)?previous\s+instructions", re.IGNORECASE),
    re.compile(r"forget\s+(all\s+)?previous\s+instructions", re.IGNORECASE),
    re.compile(r"system\s+prompt", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+", re.IGNORECASE),
    re.compile(r"act\s+as\s+(if\s+you\s+are|a\s+)", re.IGNORECASE),
    re.compile(r"pretend\s+(to\s+be|you\s+are)", re.IGNORECASE),
    re.compile(r"override\s+(your\s+)?(rules|instructions|constraints)", re.IGNORECASE),
    
    # Jailbreak attempts
    re.compile(r"jailbreak", re.IGNORECASE),
    re.compile(r"DAN\b", re.IGNORECASE),  # "Do Anything Now" jailbreak
    re.compile(r"ChatGPT\s+DAN", re.IGNORECASE),
    re.compile(r"evil\s+mode", re.IGNORECASE),
    re.compile(r"developer\s+mode", re.IGNORECASE),
    re.compile(r"unrestricted\s+mode", re.IGNORECASE),
    
    # Code/Script injection
    re.compile(r"<\s*script", re.IGNORECASE),
    re.compile(r"eval\s*\(", re.IGNORECASE),
    re.compile(r"exec\s*\(", re.IGNORECASE),
    re.compile(r"__import__", re.IGNORECASE),
    re.compile(r"subprocess\s*\.", re.IGNORECASE),
    re.compile(r"os\s*\.\s*system", re.IGNORECASE),
    
    # SQL injection patterns
    re.compile(r"('\s*or\s*'1'\s*=\s*'1|--\s*|;.*drop|union\s+select)", re.IGNORECASE),
    
    # Prompt injection keywords
    re.compile(r"prompt\s+injection", re.IGNORECASE),
    re.compile(r"context\s+break", re.IGNORECASE),
    re.compile(r"hidden\s+instruction", re.IGNORECASE),
    re.compile(r"reveal\s+(your\s+)?instructions", re.IGNORECASE),
    re.compile(r"what\s+are\s+you\s+instructed", re.IGNORECASE),
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


def validate_and_sanitize(text: str) -> tuple[str, int]:
    """
    Convenience helper: sanitize then check for injection.
    Raises HTTPException(400) if injection is detected.
    Returns tuple of (sanitized_text, safety_score) if clean.
    
    safety_score: 0-100 where 100 is completely safe, 0 is definitely malicious
    """
    cleaned = sanitize_input(text)
    
    if detect_prompt_injection(cleaned):
        raise HTTPException(status_code=400, detail="Rejected input: Potential injection attack detected")
    
    # Calculate safety score based on characteristics
    safety_score = _calculate_safety_score(cleaned)
    return cleaned, safety_score


def _calculate_safety_score(text: str) -> int:
    """
    Calculate a safety score from 0-100 for clean input.
    100 = very safe, 0 = suspicious but not blocked.
    
    Evaluates:
    - Sensitive data requests (passwords, API keys, secrets)
    - Excessive special characters (obfuscation)
    - Unusual patterns (fuzzing attempts)
    - Length anomalies
    """
    if not text:
        return 50  # Empty input is suspicious
    
    score = 100
    
    # Check for sensitive data requests - MAJOR penalty
    sensitive_keywords = [
        r"password", r"api\s+key", r"secret", r"private\s+key",
        r"access\s+token", r"bearer\s+token", r"database\s+credentials",
        r"ssh\s+key", r"aws\s+(secret|access)", r"stripe\s+key",
        r"encryption\s+key", r"jwt\s+token", r"auth\s+token"
    ]
    for keyword in sensitive_keywords:
        if re.search(keyword, text, re.IGNORECASE):
            score -= 40  # Heavy penalty for sensitive data requests
            break
    
    # Check for hacking/unauthorized access attempts - CRITICAL penalty
    hacking_keywords = [
        r"hack", r"crack", r"breach", r"exploit", r"bypass",
        r"unauthorized\s+access", r"access\s+without\s+permission",
        r"gain\s+access", r"break\s+into", r"compromise",
        r"steal\s+account", r"fake\s+account", r"impersonate",
        r"phish", r"malware", r"ransomware", r"trojan"
    ]
    for keyword in hacking_keywords:
        if re.search(keyword, text, re.IGNORECASE):
            score -= 60  # CRITICAL penalty for security threats
            break
    
    # Check for excessive special characters (possible obfuscation)
    special_chars = sum(1 for c in text if not c.isalnum() and c not in " .,!?'\"-()[]{}:")
    special_ratio = special_chars / len(text)
    if special_ratio > 0.3:
        score -= 20
    
    # Check for unusual patterns (repeated characters might indicate fuzzing)
    if re.search(r"(.)\1{5,}", text):  # 6+ repeated characters
        score -= 15
    
    # Check for mixed case in suspicious ways
    has_mixed_case = any(c.isupper() for c in text) and any(c.islower() for c in text)
    uppercase_ratio = sum(1 for c in text if c.isupper()) / len(text)
    if has_mixed_case and uppercase_ratio > 0.4:
        score -= 10
    
    # Check for extremely long words (might be encoded data)
    words = text.split()
    long_words = sum(1 for w in words if len(w) > 50)
    if long_words > 0:
        score -= 10
    
    # Reward natural language
    if len(words) >= 2:
        score += 5
    
    return max(0, min(100, score))
