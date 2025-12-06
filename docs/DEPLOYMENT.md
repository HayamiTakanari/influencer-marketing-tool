# Deployment Guide

## Production Deployment

This guide covers deploying the Influencer Marketing Tool to production environments.

## Prerequisites

- Docker & Docker Compose installed on server
- Domain name with DNS pointing to server
- SSL/TLS certificates (Let's Encrypt recommended)
- Environment variables configured
- Database backup strategy in place

## Deployment Methods

### 1. Self-Hosted with Docker Compose

#### Server Setup

```bash
# SSH into your server
ssh user@your-server.com

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install pnpm (for any local scripts)
npm install -g pnpm
```

#### Application Setup

```bash
# Clone repository
git clone https://github.com/yourusername/influencer-marketing-tool.git
cd influencer-marketing-tool

# Create production environment file
cp .env.example .env
# Edit with production values
nano .env
```

#### SSL Certificate Setup

Using Let's Encrypt with Certbot:

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Certificate paths:
# - /etc/letsencrypt/live/your-domain.com/fullchain.pem
# - /etc/letsencrypt/live/your-domain.com/privkey.pem

# Copy to project
sudo mkdir -p ./configs/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./configs/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./configs/ssl/key.pem
sudo chown -R $USER:$USER ./configs/ssl
```

#### Database Backup

```bash
# Create backup directory
mkdir -p ./backups

# Manual backup script
#!/bin/bash
# backup.sh
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

docker-compose exec -T postgres pg_dump -U postgres influencer_db > \
  "$BACKUP_DIR/backup_$TIMESTAMP.sql"

echo "Backup created: $BACKUP_DIR/backup_$TIMESTAMP.sql"
```

Make it executable and add to cron:

```bash
chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /path/to/influencer-marketing-tool/backup.sh
```

#### Start Services

```bash
# Build and start containers
pnpm start:prod:build
pnpm start:prod

# Or with traditional Docker Compose
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml up -d

# Verify services
docker-compose ps
```

#### Update Environment Variables

```bash
# Update database
docker-compose -f docker-compose.yml exec -T api pnpm prisma migrate deploy

# View logs
docker-compose -f docker-compose.yml logs -f

# Stop services
docker-compose -f docker-compose.yml down
```

### 2. Cloud Deployment

#### AWS (ECS + RDS)

1. **Create RDS PostgreSQL Instance**
   - Engine: PostgreSQL 15
   - Instance class: db.t3.micro (or larger based on load)
   - Storage: 100GB (adjustable)
   - Enable automatic backups (retention: 30 days)
   - Create security group for database

2. **Create ECR Repositories**
   ```bash
   aws ecr create-repository --repository-name influencer-api
   aws ecr create-repository --repository-name influencer-web
   ```

3. **Push Docker Images**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

   docker build -f Dockerfile.api -t influencer-api:latest .
   docker tag influencer-api:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/influencer-api:latest
   docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/influencer-api:latest

   # Repeat for web image
   ```

4. **Create ECS Cluster**
   - Use Fargate launch type
   - Configure task definitions with environment variables
   - Set CPU and memory allocations
   - Configure load balancer (ALB)

5. **Configure RDS Proxy** (optional, for connection pooling)
   - Reduce cold connection overhead
   - Implement automatic failover

#### DigitalOcean (App Platform)

1. **Connect GitHub Repository**
   - Link GitHub account
   - Select repository

2. **Create App**
   - Add API service (Dockerfile.api)
   - Add Web service (Dockerfile.web)
   - Add database (Managed PostgreSQL)

3. **Configure Environment Variables**
   - Set in App Platform console

4. **Deploy**
   - Automatic deployment on push to main branch

#### Vercel (Frontend Only)

1. **Connect GitHub**
   - Import project from GitHub

2. **Configure**
   ```
   Framework: Next.js
   Build Command: pnpm build:web
   Output Directory: apps/web/.next
   Environment Variables: Add NEXT_PUBLIC_API_BASE_URL
   ```

3. **Deploy**
   - Automatic deployment on push

### 3. Kubernetes Deployment

#### Prerequisites
- Kubernetes cluster (EKS, GKE, or self-managed)
- kubectl configured
- Helm (optional)

#### Create Deployment Files

```yaml
# k8s/postgres-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  selector:
    app: postgres
  ports:
  - protocol: TCP
    port: 5432
    targetPort: 5432
```

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: your-registry/influencer-api:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  type: LoadBalancer
  selector:
    app: api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
```

```yaml
# k8s/web-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: web
        image: your-registry/influencer-web:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_API_BASE_URL
          value: "https://api.your-domain.com"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  type: LoadBalancer
  selector:
    app: web
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

#### Deploy to Kubernetes

```bash
# Create secrets
kubectl create secret generic db-secrets \
  --from-literal=password=your-secure-password

kubectl create secret generic api-secrets \
  --from-literal=database-url=postgresql://... \
  --from-literal=jwt-secret=your-secret

# Create persistent volume
kubectl create -f k8s/postgres-pvc.yaml

# Deploy services
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/web-deployment.yaml

# Check deployment
kubectl get deployments
kubectl get services
```

## Monitoring & Maintenance

### Health Checks

```bash
# Check API health
curl -X GET https://your-domain.com/health

# Check Docker containers
docker ps
docker-compose ps

# View logs
docker-compose logs -f api
docker-compose logs -f web
```

### Scaling

```bash
# Docker Compose scaling
docker-compose -f docker-compose.yml up -d --scale api=3

# Or modify docker-compose.yml with replicas
```

### Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild images
docker-compose -f docker-compose.yml build --no-cache

# Restart services
docker-compose -f docker-compose.yml up -d

# Run migrations if needed
docker-compose -f docker-compose.yml exec -T api pnpm prisma migrate deploy
```

### Backup & Recovery

```bash
# Backup database
docker-compose -f docker-compose.yml exec -T postgres pg_dump -U postgres influencer_db > backup.sql

# Restore database
docker exec -i postgres psql -U postgres influencer_db < backup.sql

# Backup volumes
docker run --rm -v influencer_postgres_data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres-backup.tar.gz /data
```

## Performance Tuning

### Database Optimization

```sql
-- Create indexes
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_influencer_category ON influencer_profiles(category);

-- Analyze queries
EXPLAIN ANALYZE SELECT * FROM projects WHERE company_id = ?;
```

### Application Optimization

1. **Enable caching headers** (configured in nginx.conf)
2. **Implement Redis caching** for frequently accessed data
3. **Use CDN** for static assets
4. **Enable gzip compression** (configured in nginx.conf)
5. **Optimize database queries** with Prisma Select

### Monitoring

Set up monitoring with:
- Prometheus (metrics)
- Grafana (visualization)
- ELK Stack (logs)
- Sentry (error tracking)
- New Relic (APM)

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs -f

# Verify environment variables
docker-compose exec api env | grep DATABASE_URL

# Restart containers
docker-compose restart
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U postgres -c "SELECT version();"
```

### High Memory Usage

```bash
# Monitor resource usage
docker stats

# Increase container limits in docker-compose.yml
# Adjust Node.js heap size
NODE_OPTIONS="--max-old-space-size=4096"
```

## Rollback Strategy

```bash
# Tag releases
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Build specific version
docker build --build-arg VERSION=v1.0.0 -t influencer-api:v1.0.0 -f Dockerfile.api .

# Rollback to previous version
docker-compose -f docker-compose.yml down
# Update docker-compose.yml to use v1.0.0 image
docker-compose -f docker-compose.yml up -d
```

## Disaster Recovery

### Backup Strategy

- Daily automated database backups
- Weekly full system snapshots
- Monthly backup verification tests
- Off-site backup storage

### Recovery Plan

1. Assess damage
2. Restore from latest backup
3. Run migrations if needed
4. Verify data integrity
5. Notify users of any data loss window

### Documentation

Maintain:
- Runbook for common issues
- Incident response procedures
- Contact information for key personnel
- Service dependencies map
