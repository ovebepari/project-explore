FROM python:3.12-slim

LABEL maintainer="study-tracker"
LABEL description="Study Tracker — dynamic syllabus-driven study tracker"

WORKDIR /app

# Copy application files
COPY server.py .
COPY public/ ./public/

# Create data directory and copy default syllabus into it
# A volume mount on /data will override this default
RUN mkdir -p /data
COPY syllabus.toml /data/syllabus.toml

# Expose the default port
EXPOSE 8080

# Mount /data for persistence (db.ndjson) and custom syllabus
VOLUME ["/data"]

# Run the server, binding to 0.0.0.0 for Docker networking
CMD ["python3", "server.py", \
     "--host", "0.0.0.0", \
     "--port", "8080", \
     "--db", "/data/db.ndjson", \
     "--syllabus", "/data/syllabus.toml"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/api/state')" || exit 1

