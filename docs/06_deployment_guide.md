# Deployment Guide - PayFlowX

This document outlines the strategy for deploying the PayFlowX payment engine into staging and production cloud environments using Docker and Kubernetes.

---

## 1. Dockerization

We use multi-stage builds to produce minimized production images.

### Backend (NestJS) Dockerfile
```dockerfile
# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

### Frontend (Angular) Dockerfile
```dockerfile
# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build --configuration=production

# Production Stage (Nginx)
FROM nginx:alpine
COPY --from=builder /app/dist/dashboard/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 2. Kubernetes Manifests

We deploy the services to Kubernetes clusters under the `payflowx` namespace.

### Backend API Deployment (`k8s/api-deployment.yaml`)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payflowx-api
  namespace: payflowx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payflowx-api
  template:
    metadata:
      labels:
        app: payflowx-api
    spec:
      containers:
      - name: api
        image: payflowx-api:latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: payflowx-secrets
        - configMapRef:
            name: payflowx-config
        resources:
          limits:
            cpu: "1"
            memory: 1Gi
          requests:
            cpu: 250m
            memory: 256Mi
---
apiVersion: v1
kind: Service
metadata:
  name: payflowx-api-service
  namespace: payflowx
spec:
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: payflowx-api
```

---

## 3. Database & Caching Topologies

### Staging
- PostgreSQL and Redis run within the Kubernetes cluster as stateful workloads (`StatefulSet`) with persistent volume claims (PVCs).

### Production
- **PostgreSQL:** Managed cloud SQL instances (e.g., AWS RDS PostgreSQL, GCP Cloud SQL) with multi-AZ replication enabled for high availability and automatic daily backups.
- **Redis:** Managed elastic caching clusters (e.g., AWS ElastiCache Redis, GCP Memorystore Redis) configured in a replication-group mode with failover.
