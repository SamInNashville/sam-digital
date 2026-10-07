#!/usr/bin/env python3
"""Deterministic checks for the public Short Clips pages."""
from html.parser import HTMLParser
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGES = [ROOT / "short-clips.html", ROOT / "short-clips-terms.html"]
VIDEO = ROOT / "assets" / "sample-reel.mp4"
STRIPE_URL = "https://buy.stripe.com/fZu4gBgoa8ezfYJ1tX6Ri00"


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
    lower_combined = combined.lower()

    require("$75" in combined and "$75 USD" in combined, "exact $75 offer is missing")
    require("20–60 seconds" in combined, "20–60-second clip range is missing")
    require("up to 30 seconds" not in lower_combined, "obsolete 30-second claim remains")
    require("one consolidated revision" in lower_combined, "one revision promise is missing")
    require("three business days" in lower_combined, "three-business-day target is missing")
    require("target delivery within five business days after complete materials" not in lower_combined, "obsolete five-day delivery target remains")
    require("one source recording, up to 60 minutes" in lower_combined, "60-minute source limit is missing")
    require("cleared payment, source validation, and our written start acknowledgment" in lower_combined, "start conditions are incomplete")
    require("first three cleared payments" in lower_combined, "first-three-payment limit is missing")
    require("within five business days after review delivery" in lower_combined, "revision-list deadline is missing")
    require(STRIPE_URL in offer, "approved Stripe checkout URL is missing")
    require("__STRIPE_PAYMENT_LINK__" not in offer, "Stripe placeholder remains")
    require("short-clips-terms.html" in offer, "offer does not link to terms")
    require("short-clips.html" in terms, "terms do not link back to offer")
    require("assets/sample-reel.mp4" in offer, "offer does not embed sample video")
    require(VIDEO.is_file() and VIDEO.stat().st_size > 0, "sample video is missing or empty")

    for statement, message in (
        ("Full refund before our written start acknowledgment", "pre-start refund statement is missing"),
        ("After first proofs are delivered, the normal remedy is correction within the agreed scope", "post-proof remedy statement is missing"),
        ("Source and working files are stored only in the order's access-limited local workspace", "privacy storage statement is missing"),
        ("deleted from the working system no later than seven days", "media deletion statement is missing"),
        ("We do not publish your source or finished clips as portfolio work without separate, explicit permission", "rights statement is missing"),
    ):
        require(statement in terms, message)

    for page in PAGES:
        parser = LocalReferenceParser()
        parser.feed(page.read_text(encoding="utf-8"))
        for reference in parser.references:
            target = (page.parent / reference).resolve()
            require(target.is_file(), f"broken local reference in {page.name}: {reference}")

    print(f"verified {len(PAGES)} pages, {VIDEO.stat().st_size} video bytes, approved checkout URL, required terms, and all local references")


if __name__ == "__main__":
    try:
        main()
    except (AssertionError, OSError) as error:
        print(f"verification failed: {error}", file=sys.stderr)
        raise SystemExit(1)
