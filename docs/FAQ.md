# ZakApp Frequently Asked Questions (FAQ)

## 🔄 Sync & Data

### Q: Why is my sync indicator stuck on "Syncing..." (Blue)?
**A:** This usually happens if the application cannot reach the CouchDB server. 
1. Check if the server is running (`docker compose ps`). 
2. Verify you can access `http://localhost:5984/_utils` in your browser.
3. If using a different device on the LAN, ensure your firewall is not blocking port 5984.

### Q: I logged in on a new device but see no data. Did I lose everything?
**A:** No. Your data is likely safe on your **original device**. 
If sync failed (Red indicator) on the first device, data stayed local.
**Fix:** Go back to the first device, ensure Sync turns **Green**, then refresh the new device.

### Q: Can I use ZakApp on my phone?
**A:** Yes, but with a caveat. ZakApp uses advanced cryptography (`window.crypto.subtle`) that browsers **block** on insecure (HTTP) connections.
If you host it on your LAN (`http://192.168.x.x`), it will crash on mobile.
**Workaround:** Use a tunnel like `ngrok` to get an HTTPS URL, or enable "Treat insecure origin as secure" in Chrome flags.

## 🔒 Security & Privacy

### Q: Where is my data stored?
**A:** Primarily on your device (IndexedDB). If you use Sync, an encrypted copy is stored in your self-hosted CouchDB. The server **cannot** read your data because it is encrypted with your password-derived key.

### Q: What acts as my password?
**A:** Your password is your **encryption key**. If you forget it, **WE CANNOT RECOVER YOUR DATA**. There is no "Forgot Password" link because we don't not have your key.

### Q: Can I export my data?
**A:** Yes. Go to **Settings > Data Management** to export a fully encrypted or decrypted JSON backup of your vault.
