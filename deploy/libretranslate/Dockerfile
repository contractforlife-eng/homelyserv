# Dockerfile for running LibreTranslate as an independent Railway service
# Official LibreTranslate image from Docker Hub
FROM libretranslate/libretranslate:latest

# Railway dynamically injects $PORT at runtime.
# By default, LibreTranslate binds to 5000.
# The entrypoint shell script evaluates Railway's dynamic $PORT (falling back to 5000).
# Limits pre-loaded models to required languages (en, ar, fr, ru, tr, de) for fast startup and low RAM footprint.
CMD ["sh", "-c", "libretranslate --host 0.0.0.0 --port ${PORT:-5000} --load-only en,ar,fr,ru,tr,de"]
