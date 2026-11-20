import os
import time
from django.core.cache import cache
from django.http import JsonResponse


class APIRateLimitMiddleware:
    """
    Lightweight per-IP rate limiting middleware for Django / Django Ninja APIs.
    Applies tiered limits:
      - Auth endpoints (/api/auth/, /api/token/): 10 req/min (default)
      - Public portal endpoints (/api/portal/): 30 req/min (default)
      - General API endpoints (/api/): 120 req/min (default)
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.enabled = os.environ.get("RATE_LIMIT_ENABLED", "true").lower() == "true"
        self.auth_limit = int(os.environ.get("RATE_LIMIT_AUTH_PER_MIN", "10"))
        self.portal_limit = int(os.environ.get("RATE_LIMIT_PORTAL_PER_MIN", "30"))
        self.api_limit = int(os.environ.get("RATE_LIMIT_API_PER_MIN", "120"))
        self.window_seconds = 60

    def _get_client_ip(self, request) -> str:
        xff = request.META.get("HTTP_X_FORWARDED_FOR")
        if xff:
            return xff.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "unknown")

    def _resolve_tier(self, path: str):
        if path.startswith("/api/auth") or path.startswith("/api/token"):
            return "auth", self.auth_limit
        if path.startswith("/api/portal"):
            return "portal", self.portal_limit
        if path.startswith("/api/"):
            return "api", self.api_limit
        return None, None

    def __call__(self, request):
        if not self.enabled or request.method == "OPTIONS":
            return self.get_response(request)

        tier, limit = self._resolve_tier(request.path)
        if not tier or not limit:
            return self.get_response(request)

        ip = self._get_client_ip(request)
        now = int(time.time())
        window_id = now // self.window_seconds
        reset_at = (window_id + 1) * self.window_seconds
        retry_after = max(1, reset_at - now)
        cache_key = f"rl:{tier}:{ip}:{window_id}"

        count = cache.get(cache_key, 0) + 1
        cache.set(cache_key, count, timeout=self.window_seconds + 5)
        remaining = max(0, limit - count)

        if count > limit:
            resp = JsonResponse(
                {
                    "detail": "Rate limit exceeded. Please slow down and try again shortly.",
                    "retry_after": retry_after,
                },
                status=429,
            )
            resp["Retry-After"] = str(retry_after)
            resp["X-RateLimit-Limit"] = str(limit)
            resp["X-RateLimit-Remaining"] = "0"
            resp["X-RateLimit-Reset"] = str(reset_at)
            return resp

        response = self.get_response(request)
        response["X-RateLimit-Limit"] = str(limit)
        response["X-RateLimit-Remaining"] = str(remaining)
        response["X-RateLimit-Reset"] = str(reset_at)
        return response
