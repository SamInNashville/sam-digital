export function buildMailto(service, brief) {
  return `mailto:sam-in-nashville@pm.me?subject=${encodeURIComponent(`Project inquiry: ${service}`)}&body=${encodeURIComponent(`Hi Sam Digital,\n\nI’m looking for help with ${service.toLowerCase()}.\n\n${brief.trim()}\n\nTimeline / budget (if known):\n\nThanks,\n`)}`;
}
