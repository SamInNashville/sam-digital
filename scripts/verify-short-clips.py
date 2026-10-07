#!/usr/bin/env python3
"""Deterministic checks for the public Short Clips pages."""
from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGES = [ROOT / "short-clips.html", ROOT / "short-clips-terms.html"]
OFFER = ROOT / "short-clips.html"
TERMS = ROOT / "short-clips-terms.html"
VIDEO = ROOT / "assets" / "sample-reel.mp4"
PUBLIC_EMAIL = "sam-in-nashville@pm.me"
STRIPE_URL = "https://buy.stripe.com/fZu4gBgoa8ezfYJ1tX6Ri00"
SAMPLE_SHA256 = "9200a90edddd05f09e5c4f44795f153790d2e450b2b6b398721b94225493c938"


class PageParser(HTMLParser):
    """Collect the structural hooks that the public pages must expose."""

    def __init__(self):
        super().__init__()
        self.root_attrs = {}
        self.meta_viewports = []
        self.headings = []
        self.videos = []
        self.ids = set()
        self._video_attrs = None

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "html":
            self.root_attrs = attributes
        if "id" in attributes:
            self.ids.add(attributes["id"])
        if tag == "meta" and (attributes.get("name") or "").lower() == "viewport":
            self.meta_viewports.append(attributes.get("content", ""))
        if tag in {"h1", "h2", "h3"}:
            self.headings.append(tag)
        if tag == "video":
            self._video_attrs = attributes

    def handle_endtag(self, tag):
        if tag == "video" and self._video_attrs is not None:
            self.videos.append(self._video_attrs)
            self._video_attrs = None

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


def load_page(page):
    require(page.is_file(), f"missing page: {page.name}")
    contents = page.read_text(encoding="utf-8")
    require(contents.strip(), f"empty page: {page.name}")
    parser = PageParser()
    parser.feed(contents)
    return contents, parser


def require_accessibility(page, parser):
    require(parser.root_attrs.get("lang") == "en", f"{page.name} must declare lang=en")
    require(parser.meta_viewports == ["width=device-width, initial-scale=1"], f"{page.name} viewport hook is not exact")
    require("h1" in parser.headings and "h2" in parser.headings, f"{page.name} is missing required heading hooks")
    if page == OFFER:
        require(len(parser.videos) == 1, "offer must contain exactly one sample video")
        video = parser.videos[0]
        require("controls" in video, "sample video controls hook is missing")
        description_id = video.get("aria-describedby")
        require(description_id and description_id in parser.ids, "sample video description hook is missing")


def require_contract_semantics(combined, lower_combined, offer, terms):
    required_phrases = (
        ("$75 USD, paid upfront", "price and upfront-payment terms are missing"),
        ("cleared payment, source validation, and our written start acknowledgment", "start conditions are incomplete"),
        ("three business days after that acknowledgment", "three-business-day delivery target is missing"),
        ("final delivery within one business day after receiving an in-scope revision list", "post-revision timing is missing"),
        ("first three cleared payments", "first-three-payment cap is missing"),
        ("one source recording, up to 60 minutes", "source duration limit is missing"),
        ("customer-controlled download link", "customer-controlled source destination is missing"),
        ("own or are authorized to use", "source authorization term is missing"),
        ("one consolidated revision", "one consolidated revision promise is missing"),
        ("within five business days after review delivery", "revision-list deadline is missing"),
        ("additional clips is outside the pilot and requires a new agreement", "revision scope boundary is missing"),
        ("Full refund before our written start acknowledgment", "pre-start refund statement is missing"),
        ("After first proofs are delivered, the normal remedy is correction within the agreed scope", "post-proof remedy statement is missing"),
        ("A customer cancellation before our written start acknowledgment receives the pre-start refund", "pre-start cancellation term is missing"),
        ("After start, cancellation does not create an automatic refund", "post-start cancellation term is missing"),
        ("primary and backup private upload destinations they control", "primary and backup delivery destinations are missing"),
        ("If the primary destination fails, we use the verified backup", "delivery fallback term is missing"),
        ("If both customer-controlled delivery destinations fail", "delivery access-failure term is missing"),
        ("replacement private destination is verified", "replacement destination term is missing"),
        ("every needed right in the source", "source-rights term is missing"),
        ("We do not publish your source or finished clips as portfolio work without separate, explicit permission", "portfolio privacy term is missing"),
        ("access-limited local workspace and used only to fulfill the order", "privacy storage statement is missing"),
        ("deleted from the working system no later than seven days", "media deletion deadline is missing"),
        ("This pilot does not offer extended media retention", "no-extended-retention term is missing"),
        ("Report playback, corruption, wrong-export, or agreed-content defects within seven calendar days", "support defect window is missing"),
        ("local AI-assisted transcription and editing tools", "AI disclosure is missing"),
        ("human-readable quality review is performed before delivery", "human review promise is missing"),
        ("No guarantee is made about views, engagement, leads, sales, or virality", "no-outcome promise is missing"),
    )
    for phrase, message in required_phrases:
        require(phrase.lower() in lower_combined, message)

    require("20–60 seconds" in combined, "20–60-second clip range is missing")
    require("up to 30 seconds" not in lower_combined and "30-second" not in lower_combined, "obsolete 30-second claim remains")
    require("target delivery within five business days after complete materials" not in lower_combined, "obsolete five-day delivery target remains")
    require(terms.count("deleted from the working system") == 1, "deletion policy is not singular and deterministic")
    require("short-clips-terms.html" in offer, "offer does not link to terms")
    require("short-clips.html" in terms, "terms do not link back to offer")


def main():
    loaded = {page: load_page(page) for page in PAGES}
    contents = {page: value[0] for page, value in loaded.items()}
    parsers = {page: value[1] for page, value in loaded.items()}
    offer = contents[OFFER]
    terms = contents[TERMS]
    combined = offer + "\n" + terms
    lower_combined = combined.lower()

    for page in PAGES:
        require_accessibility(page, parsers[page])

    email_addresses = set(re.findall(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}", combined))
    require(email_addresses == {PUBLIC_EMAIL}, "public email is not exactly the approved address")
    require(all(PUBLIC_EMAIL in contents[page] for page in PAGES), "approved public email is missing from a page")
    stripe_urls = re.findall(r"https://buy\.stripe\.com/[^\s\"'<>]+", combined)
    require(stripe_urls == [STRIPE_URL], "checkout URL must appear exactly once with no other buy.stripe.com URL")
    require("__STRIPE_PAYMENT_LINK__" not in combined, "Stripe placeholder remains")

    require_contract_semantics(combined, lower_combined, offer, terms)
    require("assets/sample-reel.mp4" in offer, "offer does not embed sample video")
    require(VIDEO.is_file() and VIDEO.stat().st_size > 0, "sample video is missing or empty")
    require(sha256(VIDEO.read_bytes()).hexdigest() == SAMPLE_SHA256, "sample video SHA-256 does not match approved bytes")

    for page in PAGES:
        parser = LocalReferenceParser()
        parser.feed(contents[page])
        for reference in parser.references:
            target = (page.parent / reference).resolve()
            require(target.is_file(), f"broken local reference in {page.name}: {reference}")

    print(f"verified {len(PAGES)} pages, exact public email, exact checkout URL, approved contract semantics, accessibility hooks, and sample SHA-256")


if __name__ == "__main__":
    try:
        main()
    except (AssertionError, OSError) as error:
        print(f"verification failed: {error}", file=sys.stderr)
        raise SystemExit(1)
