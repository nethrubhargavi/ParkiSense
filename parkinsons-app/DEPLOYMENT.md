# Production Deployment Guide

## ⚠️ Important: Medical Software Compliance

Before deploying this application to production, ensure compliance with:
- FDA regulations (if applicable)
- HIPAA requirements
- Clinical validation
- Legal review and liability insurance

---

## Docker Compose Deployment (Recommended)

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
    restart: unless-stopped
    
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### Deployment Commands

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Environment Configuration

### Production Backend Changes

Update `backend/main.py` CORS settings:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],  # Your production domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Frontend API Configuration

Update `frontend/src/components/*.jsx` - change:

```javascript
const API_BASE = import.meta.env.PROD 
  ? 'https://your-domain.com/api'  // Production
  : 'http://localhost:8000';        // Development
```

---

## Security Hardening

### 1. Add Authentication

Implement JWT-based authentication:

```python
# backend/auth.py (example)
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    # Verify JWT token here
    return token
```

### 2. Rate Limiting

```bash
pip install slowapi
```

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(429, _rate_limit_exceeded_handler)

@app.post("/run-tremor-test")
@limiter.limit("10/minute")
async def tremor_test(request: Request):
    # ...
```

### 3. HTTPS Only

Force HTTPS in Nginx or use middleware:

```python
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

if ENVIRONMENT == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
```

---

## Monitoring Setup

### Application Logs

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/parkinsons-app/app.log'),
        logging.StreamHandler()
    ]
)
```

### Error Tracking (Sentry)

```bash
pip install sentry-sdk
```

```python
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=1.0,
)
```

---

## Backup Strategy

### Database Backups (if applicable)

```bash
# Automated daily backup script
0 2 * * * /usr/bin/pg_dump parkinsons_db > /backups/db_$(date +\%Y\%m\%d).sql
```

### Application Files

```bash
# Backup application directory
tar -czf /backups/app_$(date +%Y%m%d).tar.gz /home/parkinsons-app/
```

---

## Health Checks

Add health endpoint:

```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }
```

Monitor with:
- UptimeRobot (https://uptimerobot.com)
- Pingdom (https://www.pingdom.com)

---

## Performance Optimization

### Backend

- Use Gunicorn with multiple workers: `gunicorn -w 4`
- Enable HTTP/2 in Nginx
- Implement caching for static results
- Use connection pooling for databases

### Frontend

- Enable gzip compression
- Use CDN for static assets
- Implement lazy loading
- Optimize images (WebP format)

---

## Compliance Checklist

### HIPAA Requirements
- [ ] Encrypt data at rest
- [ ] Encrypt data in transit (HTTPS)
- [ ] Implement audit logging
- [ ] Access controls and authentication
- [ ] Business Associate Agreements (BAAs)
- [ ] Regular security assessments

### Medical Device Regulations
- [ ] Obtain necessary clearances (FDA, CE)
- [ ] Conduct clinical validation studies
- [ ] Implement version control
- [ ] Document change management
- [ ] User training materials

---

## Disaster Recovery

### Backup Restoration

```bash
# Restore database
psql parkinsons_db < /backups/db_20240215.sql

# Restore application
tar -xzf /backups/app_20240215.tar.gz -C /
```

### Incident Response Plan

1. Detect issue (monitoring alerts)
2. Assess severity
3. Notify stakeholders
4. Implement fix
5. Verify resolution
6. Document incident

---

## Update Procedure

```bash
# 1. Backup current version
tar -czf /backups/pre-update_$(date +%Y%m%d).tar.gz /home/parkinsons-app/

# 2. Pull new code
cd /home/parkinsons-app
git pull origin main

# 3. Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt --upgrade

# 4. Update frontend
cd ../frontend
npm install
npm run build

# 5. Restart services
sudo systemctl restart parkinsons-backend
sudo systemctl restart nginx

# 6. Verify
curl https://your-domain.com/health
```

---

## Production Checklist

- [ ] SSL certificate installed and auto-renewal configured
- [ ] CORS configured for production domain
- [ ] Authentication and authorization implemented
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Monitoring and alerting set up
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] Security audit completed
- [ ] Load testing performed
- [ ] Compliance requirements met
- [ ] Documentation updated

---

For questions or issues, refer to README.md and VS_CODE_QUICKSTART.md
