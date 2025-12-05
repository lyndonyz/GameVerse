# GameVerse IBM Cloud Deployment Guide

## Prerequisites

### On your MacBook:

1. **Install Docker Desktop**
   ```bash
   # Download from: https://www.docker.com/products/docker-desktop
   ```

2. **Install IBM Cloud CLI**
   ```bash
   curl -fsSL https://clis.cloud.ibm.com/install/osx | sh
   ```

3. **Install IBM Cloud plugins**
   ```bash
   ibmcloud plugin install container-registry
   ibmcloud plugin install code-engine
   ```

4. **Create an IBM Cloud account** at https://cloud.ibm.com

## Local Testing

Before deploying to IBM Cloud, test your containers locally:

```bash
# Build and run all services
docker-compose up --build

# Access your application:
# Web: http://localhost
# Server: http://localhost:3000

# Stop services
docker-compose down
```

## Deployment Options

### Option 1: IBM Code Engine (Recommended for beginners)

IBM Code Engine is a fully managed, serverless platform. It's easier to use and more cost-effective for small applications.

```bash
# 1. Login to IBM Cloud
ibmcloud login

# 2. Target your region
ibmcloud target -r us-south

# 3. Create a namespace in Container Registry (one-time)
ibmcloud cr login
ibmcloud cr namespace-add gameverse

# 4. Build and push images
docker build -t us.icr.io/gameverse/server:latest ./server
docker build -t us.icr.io/gameverse/web:latest ./web

docker push us.icr.io/gameverse/server:latest
docker push us.icr.io/gameverse/web:latest

# 5. Create a Code Engine project
ibmcloud ce project create --name gameverse-project
ibmcloud ce project select --name gameverse-project

# 6. Deploy applications
ibmcloud ce application create --name gameverse-server \
  --image us.icr.io/gameverse/server:latest \
  --port 3000 \
  --min-scale 1 --max-scale 3 \
  --cpu 0.5 \
  --memory 1G

ibmcloud ce application create --name gameverse-web \
  --image us.icr.io/gameverse/web:latest \
  --port 80 \
  --min-scale 1 --max-scale 3 \
  --cpu 0.25 \
  --memory 0.5G

# 7. Get your application URLs
ibmcloud ce application list
```

### Option 2: IBM Kubernetes Service (For production)

For more control and production workloads:

```bash
# 1. Create a Kubernetes cluster (takes 15-20 minutes)
ibmcloud ks cluster create classic \
  --name gameverse-cluster \
  --zone dal10 \
  --flavor b3c.4x16 \
  --workers 2

# 2. Wait for cluster to be ready
ibmcloud ks cluster get --cluster gameverse-cluster

# 3. Configure kubectl
ibmcloud ks cluster config --cluster gameverse-cluster

# 4. Push images (same as Option 1, steps 3-4)

# 5. Deploy using Kubernetes manifests
kubectl apply -f k8s/

# 6. Get your LoadBalancer IP
kubectl get service gameverse-web
```

## Using the Deployment Script

For automated deployment:

```bash
# Make the script executable (on MacBook)
chmod +x deploy.sh

# Run deployment
./deploy.sh production
```

## Environment Variables

Add environment variables to your deployment:

### Code Engine:
```bash
ibmcloud ce application update --name gameverse-server \
  --env NODE_ENV=production \
  --env DATABASE_URL=your-cloudant-url
```

### Kubernetes:
Create a `k8s/secrets.yaml` file (don't commit to git):
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: gameverse-secrets
type: Opaque
stringData:
  DATABASE_URL: your-cloudant-url
  API_KEY: your-api-key
```

Then reference in your deployment:
```yaml
envFrom:
- secretRef:
    name: gameverse-secrets
```

## Monitoring & Logs

### Code Engine:
```bash
# View logs
ibmcloud ce application logs --name gameverse-server

# View application status
ibmcloud ce application get --name gameverse-server
```

### Kubernetes:
```bash
# View logs
kubectl logs -l app=gameverse-server

# View pod status
kubectl get pods
```

## Continuous Deployment

For automatic deployments on git push, consider:
1. GitHub Actions + IBM Cloud
2. IBM Continuous Delivery service
3. GitLab CI/CD

## Cost Optimization

- **Code Engine**: Pay only for actual usage (requests/CPU time)
- **Kubernetes**: Pay for cluster uptime (more expensive but more control)
- Use `--min-scale 0` for Code Engine to scale to zero when idle

## Troubleshooting

### Images not pulling:
```bash
# Ensure registry is accessible
ibmcloud cr images

# Create image pull secret for Kubernetes
ibmcloud ks cluster pull-secret apply --cluster gameverse-cluster
```

### Application not starting:
```bash
# Check logs
ibmcloud ce application logs --name gameverse-server --tail 100
```

## Next Steps

1. Set up a custom domain
2. Enable HTTPS/SSL certificates
3. Configure environment-specific settings
4. Set up monitoring and alerts
5. Implement CI/CD pipeline
