# Deployment Guide

## Production Deployment Checklist

### Pre-Deployment
- [ ] Test all features locally
- [ ] Set secure JWT_SECRET
- [ ] Configure production database
- [ ] Set up error monitoring
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up backup strategy
- [ ] Create deployment documentation

---

## Backend Deployment (Node.js + Express)

### Option 1: Railway

1. **Create Railway Project**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init
```

2. **Configure Environment Variables**
```
PORT=5000
MONGODB_URI=<your_mongodb_atlas_uri>
JWT_SECRET=<secure_random_string>
JWT_EXPIRE=7d
ML_SERVICE_URL=<your_ml_service_url>
NODE_ENV=production
```

3. **Deploy**
```bash
railway up
```

### Option 2: Heroku

1. **Create Heroku App**
```bash
heroku create autism-screening-backend
```

2. **Set Environment Variables**
```bash
heroku config:set MONGODB_URI=<uri>
heroku config:set JWT_SECRET=<secret>
heroku config:set ML_SERVICE_URL=<url>
heroku config:set NODE_ENV=production
```

3. **Deploy**
```bash
git push heroku main
```

### Option 3: DigitalOcean App Platform

1. Create new app from GitHub repository
2. Set environment variables in UI
3. Configure build/run commands:
   - Build: `npm install`
   - Run: `npm start`

---

## ML Service Deployment (Python FastAPI)

### Option 1: Render

1. **Create Web Service**
   - Connect GitHub repository
   - Select `ml-service` directory
   - Set Python environment

2. **Configure**
```yaml
# render.yaml
services:
  - type: web
    name: autism-ml-service
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PORT
        value: 8000
```

3. **Deploy**: Render auto-deploys on push

### Option 2: AWS EC2 with Docker

1. **Create Dockerfile**
```dockerfile
# ml-service/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

2. **Build and Push to ECR**
```bash
docker build -t autism-ml-service .
docker tag autism-ml-service:latest <ecr-url>/autism-ml-service:latest
docker push <ecr-url>/autism-ml-service:latest
```

3. **Deploy to EC2**
```bash
# On EC2 instance
docker pull <ecr-url>/autism-ml-service:latest
docker run -d -p 8000:8000 autism-ml-service
```

### Option 3: Google Cloud Run

1. **Create Dockerfile** (same as above)

2. **Deploy**
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/autism-ml-service
gcloud run deploy autism-ml-service --image gcr.io/PROJECT_ID/autism-ml-service
```

---

## Frontend Deployment (React)

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
cd frontend
vercel
```

3. **Configure Environment Variables**
   - Go to Vercel dashboard
   - Add `VITE_API_URL=<backend_url>`

4. **Production Deploy**
```bash
vercel --prod
```

### Option 2: Netlify

1. **Build Project**
```bash
cd frontend
npm run build
```

2. **Deploy**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

3. **Configure**
   - Set environment variable: `VITE_API_URL`
   - Add `_redirects` file:
```
/*    /index.html   200
```

### Option 3: AWS S3 + CloudFront

1. **Build**
```bash
npm run build
```

2. **Upload to S3**
```bash
aws s3 sync dist/ s3://your-bucket-name --delete
```

3. **Configure CloudFront**
   - Create distribution pointing to S3 bucket
   - Set default root object: `index.html`
   - Configure error pages to redirect to `index.html`

---

## Database Setup (MongoDB Atlas)

1. **Create Cluster**
   - Go to mongodb.com/cloud/atlas
   - Create free cluster

2. **Configure**
   - Create database user
   - Whitelist IP addresses (0.0.0.0/0 for all)
   - Get connection string

3. **Connection String Format**
```
mongodb+srv://username:password@cluster.mongodb.net/autism_screening?retryWrites=true&w=majority
```

---

## Environment Variables Summary

### Backend
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<64-char-random-string>
JWT_EXPIRE=7d
ML_SERVICE_URL=https://your-ml-service.com
NODE_ENV=production
```

### ML Service
```env
PORT=8000
HOST=0.0.0.0
UPLOAD_DIR=./uploads
```

### Frontend
```env
VITE_API_URL=https://your-backend.com/api
```

---

## SSL/HTTPS Configuration

All deployment platforms provide free SSL certificates:
- **Vercel/Netlify**: Automatic
- **Heroku**: Free SSL
- **Railway**: Automatic
- **AWS**: Use ACM (AWS Certificate Manager)

---

## Monitoring & Logging

### Backend Logging
```javascript
// Add winston for logging
npm install winston

// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

module.exports = logger;
```

### Error Monitoring
- **Sentry**: For error tracking
- **LogRocket**: For session replay
- **DataDog**: For comprehensive monitoring

---

## Scaling Considerations

### Backend Scaling
- Use PM2 for process management
- Enable clustering
- Implement rate limiting
- Use Redis for caching

### ML Service Scaling
- Use GPU instances for faster processing
- Implement request queuing
- Consider serverless functions for burst traffic
- Cache common predictions

### Database Scaling
- Enable MongoDB indexes
- Use replica sets
- Implement read replicas
- Consider sharding for large datasets

---

## Backup Strategy

### Database Backups
```bash
# Automated backups with MongoDB Atlas
# Or manual backup:
mongodump --uri="mongodb+srv://..." --out=/backup/
```

### File Backups
- Use S3 for uploaded files
- Enable versioning
- Set up lifecycle policies

---

## Security Checklist

- [ ] Enable HTTPS everywhere
- [ ] Set secure JWT_SECRET (64+ characters)
- [ ] Configure CORS properly
- [ ] Implement rate limiting
- [ ] Add helmet.js middleware
- [ ] Sanitize user inputs
- [ ] Keep dependencies updated
- [ ] Enable MongoDB encryption at rest
- [ ] Use environment variables (never commit secrets)
- [ ] Implement request validation
- [ ] Set up security headers
- [ ] Enable CSP (Content Security Policy)

---

## Performance Optimization

### Backend
```javascript
// Add compression
const compression = require('compression');
app.use(compression());

// Enable caching
const redis = require('redis');
const client = redis.createClient();
```

### Frontend
```javascript
// vite.config.js - Production optimizations
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['framer-motion', '@headlessui/react']
        }
      }
    }
  }
}
```

---

## Post-Deployment Testing

1. **Smoke Tests**
   - User registration
   - Login
   - Add child
   - Start screening
   - View results

2. **Load Testing**
```bash
# Using Apache Bench
ab -n 1000 -c 10 https://your-api.com/api/children

# Using artillery
artillery quick --count 10 --num 50 https://your-api.com/
```

3. **Security Audit**
```bash
npm audit
pip audit
```

---

## Rollback Strategy

### Vercel/Netlify
- Use deployment history
- One-click rollback in dashboard

### Heroku
```bash
heroku releases
heroku rollback v123
```

### Docker
```bash
docker pull previous-image:tag
docker stop current-container
docker run previous-image
```

---

## Maintenance Plan

### Weekly
- Check error logs
- Monitor disk usage
- Review performance metrics

### Monthly
- Update dependencies
- Review security alerts
- Backup verification
- Performance optimization

### Quarterly
- Security audit
- Load testing
- Disaster recovery drill
- Documentation update

---

## Support Resources

- Documentation: README.md
- API Docs: API_EXAMPLES.md
- Quick Start: QUICKSTART.md
- Issues: GitHub Issues

---

**Deployment Complete! 🚀**
