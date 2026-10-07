#!/usr/bin/env python3
"""Deterministic checks for the public Short Clips pages."""
from html.parser import HTMLParser
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGES = [ROOT / "short-clips.html", ROOT / "short-clips-terms.html"]
VIDEO = ROOT / "assets" / "sample-reel.mp4"


class LocalReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        for name in ("href", "src"):
            value = attributes.get(name)
            if value and not value.startswith(("#", "mailto:", "http:", "https:", "__")):
                self.references.append(value.split("#", 1)[0].split("?", 1)[0])


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def main():
    for page in PAGES:
        require(page.is_file(), f"missing page: {page.name}")
        require(page.read_text(encoding="utf-8").strip(), f"empty page: {page.name}")

    offer = (ROOT / "short-clips.html").read_text(encoding="utf-8")
    terms = (ROOT / "short-clips-terms.html").read_text(encoding="utf-8")
    combined = offer + "\n" + terms

    require("$75" in combined and "$75 USD" in combined, "exact $75 offer is missing")
    require("up to 30 seconds" in combined, "30-second maximum is missing")
    require("one consolidated revision" in combined.lower(), "one revision promise is missing")
    require("five business days" in combined, "five-business-day target is missing")
    require("__STRIPE_PAYMENT_LINK__" in offer, "Stripe placeholder is missing")
    require("short-clips-terms.html" in offer, "offer does not link to terms")
    require("short-clips.html" in terms, "terms do not link back to offer")
    require("assets/sample-reel.mp4" in offer, "offer does not embed sample video")
    require(VIDEO.is_file() and VIDEO.stat().st_size > 0, "sample video is missing or empty")

    for page in PAGES:
        parser = LocalReferenceParser()
        parser.feed(page.read_text(encoding="utf-8"))
        for reference in parser.references:
            target = (page.parent / reference).resolve()
            require(target.is_file(), f"broken local reference in {page.name}: {reference}")

    print(f"verified {len(PAGES)} pages, {VIDEO.stat().st_size} video bytes, and all local references")


if __name__ == "__main__":
    try:
        main()
    except (AssertionError, OSError) as error:
        print(f"verification failed: {error}", file=sys.stderr)
        raise SystemExit(1)
