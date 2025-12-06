# External Access Configuration

To access ZakApp from other devices on your network (e.g., mobile phones), follow these simple steps.

## Quick Setup

1.  **Get your Host IP:**
    Run the helper script:
    ```bash
    ./get-ip.sh
    ```

2.  **Update Configuration:**
    Open the `.env` file in the root directory and set `HOST_IP`:
    ```env
    HOST_IP=192.168.x.x  # Replace with your IP from step 1
    ```

3.  **Apply Changes:**
    Restart the application:
    ```bash
    docker compose up -d
    ```

4.  **Access the App:**
    *   **Frontend:** `http://<YOUR_IP>:3000`
    *   **Backend:** `http://<YOUR_IP>:3001`

## How It Works

*   **Central Configuration:** The `.env` file acts as the single source of truth.
*   **Runtime Injection:** The frontend configuration is injected at runtime, so you don't need to rebuild the application when changing IPs.
*   **Automatic CORS:** The backend automatically allows requests from the configured `HOST_IP`.

## Troubleshooting

*   **Firewall:** Ensure your computer's firewall allows incoming connections on ports `3000` and `3001`.
*   **Network:** Ensure your phone and computer are on the same Wi-Fi network.


# With custom domain
ALLOWED_ORIGINS=http://localhost:3000,https://zakapp.yourdomain.com

# Wildcard subdomains (production)
ALLOWED_ORIGINS=https://*.yourdomain.com
```

### Option 2: Using docker-compose.yml

Directly in `docker-compose.yml` under backend service:

```yaml
backend:
  environment:
    - ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000
```

### Option 3: Using server/.env (Non-Docker Development)

For running without Docker, edit `server/.env`:

```env
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000
```

## Common Scenarios

### Scenario 1: Access from Mobile on Same WiFi

**Your Setup:**
- Computer IP: `192.168.1.100`
- Frontend: `http://192.168.1.100:3000`
- Backend: `http://192.168.1.100:3001`

**Configuration:**
```env
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000
```

**Access:** Open `http://192.168.1.100:3000` on your mobile device

### Scenario 2: Multiple Developers on Same Network

**Configuration:**
```env
# Allow multiple IP addresses
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000,http://192.168.1.101:3000,http://192.168.1.102:3000
```

### Scenario 3: Custom Domain (Production)

**Your Setup:**
- Domain: `zakapp.example.com`
- HTTPS enabled

**Configuration:**
```env
ALLOWED_ORIGINS=https://zakapp.example.com,https://www.zakapp.example.com
```

### Scenario 4: Multiple Environments

**Your Setup:**
- Production: `https://app.example.com`
- Staging: `https://staging.example.com`
- Development: `http://localhost:3000`

**Configuration:**
```env
ALLOWED_ORIGINS=https://app.example.com,https://staging.example.com,https://*.dev.example.com,http://localhost:3000
```

### Scenario 5: Wildcard Subdomains

**Configuration:**
```env
# Allow all subdomains of example.com
ALLOWED_ORIGINS=https://*.example.com

# Multiple wildcard patterns
ALLOWED_ORIGINS=https://*.example.com,https://*.staging-env.com
```

## Automatic Development Mode

In development mode (`NODE_ENV=development`), the following are **automatically allowed** without configuration:

- ✅ `http://localhost:*` (any port)
- ✅ `http://127.0.0.1:*` (any port)
- ✅ `http://192.168.*.*:*` (local network)
- ✅ `http://10.*.*.*:*` (local network)
- ✅ `http://172.16-31.*.*:*` (local network)

This means in development, you typically don't need to configure CORS for local testing.

## Applying Changes

### Docker Deployment

After changing `.env.docker` or `docker-compose.yml`:

```bash
# Option 1: Restart containers (faster)
docker compose restart backend

# Option 2: Full restart (recommended if changes aren't applied)
docker compose down
docker compose up -d

# Option 3: Rebuild and restart (if core code changed)
./docker-start.sh --rebuild
```

### Non-Docker Development

After changing `server/.env`:

```bash
# Restart the server
cd server
npm run dev
```

The server automatically reloads with nodemon.

## Troubleshooting

### "Not allowed by CORS" Error

**Symptom:** Browser console shows CORS error when accessing from IP address

**Solutions:**

1. Check your IP address is correct:
   ```bash
   ip addr show | grep "inet "
   ```

2. Verify `.env.docker` includes your IP:
   ```env
   ALLOWED_ORIGINS=http://localhost:3000,http://YOUR_IP:3000
   ```

3. Restart backend:
   ```bash
   docker compose restart backend
   ```

4. Check backend logs for rejected origins:
   ```bash
   docker compose logs backend | grep CORS
   ```

### CORS Working in Development but Not Production

**Cause:** Automatic localhost/IP allowance only works in development mode

**Solution:** Explicitly add your production domain to `ALLOWED_ORIGINS`:
```env
NODE_ENV=production
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Frontend Can't Connect to Backend

**Symptom:** Network errors, "Failed to fetch"

**Check:**

1. Backend is running:
   ```bash
   docker compose ps
   curl http://localhost:3001/api/auth/register
   ```

2. Frontend has correct API URL in `client/.env`:
   ```env
   REACT_APP_API_BASE_URL=http://YOUR_IP:3001/api
   ```

3. Firewall allows connections on port 3001

### Mobile Device Can't Connect

**Checklist:**

- [ ] Both devices on same WiFi network
- [ ] Computer's firewall allows incoming connections on ports 3000 and 3001
- [ ] Using correct IP address (not 127.0.0.1 or localhost)
- [ ] Backend CORS includes the IP: `ALLOWED_ORIGINS=http://192.168.x.x:3000`
- [ ] Frontend `.env` has: `REACT_APP_API_BASE_URL=http://192.168.x.x:3001/api`

## Security Best Practices

### Development
- ✅ Use automatic localhost/IP allowance (default)
- ✅ Only allow specific IPs if needed

### Production
- ✅ Always use HTTPS (`https://`)
- ✅ Specify exact domains, avoid wildcards if possible
- ✅ Use wildcards only for controlled subdomains
- ❌ Never use `*` (allow all origins)
- ❌ Never use `http://` in production
- ✅ Set `NODE_ENV=production`

### Example Production Config
```env
NODE_ENV=production
ALLOWED_ORIGINS=https://app.zakapp.com,https://www.zakapp.com
```

## Testing CORS Configuration

### From Command Line

```bash
# Test if backend accepts your origin
curl -H "Origin: http://192.168.1.100:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:3001/api/auth/login \
     -v
```

Look for `Access-Control-Allow-Origin` in the response headers.

### From Browser

1. Open DevTools (F12)
2. Go to Network tab
3. Try making a request
4. Check the response headers for:
   - `Access-Control-Allow-Origin`
   - `Access-Control-Allow-Credentials`

## Additional Resources

- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Understanding CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [CORS Playground](https://jakearchibald.com/2021/cors/)

## Getting Help

If you're still having issues:

1. Check backend logs: `docker compose logs backend`
2. Look for CORS rejection messages
3. Verify your configuration matches one of the scenarios above
4. Create an issue on GitHub with:
   - Your CORS configuration
   - The origin you're trying to access from
   - Backend log output
   - Browser console errors
