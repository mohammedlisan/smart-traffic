# ---- build the React dashboard ----
FROM node:20-slim AS fe
WORKDIR /fe
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---- backend + AI ----
FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends libglib2.0-0 libgl1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir -r requirements.txt
COPY backend backend
COPY scripts scripts
COPY uploads uploads
COPY --from=fe /fe/dist frontend/dist
# first visit shows the clearly-labelled demo data; judges can switch it off in Settings
ENV DEMO_MODE_DEFAULT=1
RUN useradd -m -u 1000 user && chown -R user /app
USER user
EXPOSE 7860
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
