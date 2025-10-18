# ZakApp Troubleshooting Guide & FAQ

## Table of Contents

- [Frequently Asked Questions](#frequently-asked-questions)
- [Common Issues & Solutions](#common-issues--solutions)
- [Error Messages](#error-messages)
- [Performance Issues](#performance-issues)
- [Security Concerns](#security-concerns)
- [Data Management](#data-management)
- [Getting Help](#getting-help)

## Frequently Asked Questions

### General Questions

**Q: What is ZakApp?**
A: ZakApp is a privacy-first Islamic Zakat calculator that helps Muslims manage their Islamic financial obligations with complete privacy and Islamic compliance. It features end-to-end encryption, multiple calculation methodologies, and comprehensive asset tracking.

**Q: Is ZakApp free to use?**
A: Yes, ZakApp is completely free and open-source. You can self-host it or use our hosted version.

**Q: How does ZakApp protect my privacy?**
A: ZakApp implements end-to-end encryption for all sensitive financial data, stores data locally on your device, and never transmits financial information to external servers without your explicit consent.

**Q: What Zakat methodologies does ZakApp support?**
A: ZakApp supports Standard, Hanafi, Shafi'i, Maliki, and Hanbali methodologies, each with proper nisab thresholds and calculation rules.

### Zakat Calculation Questions

**Q: How is the nisab threshold calculated?**
A: The nisab threshold is based on current gold and silver prices. ZakApp uses the lower of the two thresholds for conservative calculations.

**Q: What assets are considered zakatable?**
A: Zakatable assets include cash, gold, silver, cryptocurrency, business inventory, and investment accounts above the nisab threshold for one lunar year.

**Q: What is the Zakat rate?**
A: The standard Zakat rate is 2.5% (1/40th) of zakatable assets held for one lunar year above the nisab threshold.

**Q: How does ZakApp handle different currencies?**
A: ZakApp supports multiple currencies and automatically converts all assets to a base currency for calculation purposes.

### Technical Questions

**Q: What are the system requirements?**
A: ZakApp requires a modern web browser with JavaScript enabled. For self-hosting, you'll need Node.js 18+ and a server with at least 2GB RAM.

**Q: Can I export my data?**
A: Yes, ZakApp supports exporting your data in JSON, CSV, and PDF formats for backup and analysis.

**Q: Is my data backed up automatically?**
A: When self-hosted, you control your backups. The hosted version includes automatic encrypted backups.

## Common Issues & Solutions

### Authentication Issues

#### Login Failed Error
```
Error: Authentication failed
```

**Solutions:**
1. Verify your email and password are correct
2. Check if your account is locked due to too many failed attempts
3. Clear your browser cache and cookies
4. Try resetting your password
5. Check if your browser is blocking cookies

#### Session Expired Error
```
Error: Your session has expired. Please log in again.
```

**Solutions:**
1. Log out and log back in
2. Check your internet connection
3. Clear browser cache if the issue persists
4. Try a different browser

### Asset Management Issues

#### Assets Not Showing in Calculations

**Solutions:**
1. Verify the asset is marked as "zakatable"
2. Check that the asset value is above the nisab threshold
3. Ensure the asset has been held for one lunar year
4. Refresh the calculation page

#### Cannot Add New Asset
```
Error: Asset validation failed
```

**Solutions:**
1. Ensure all required fields are filled
2. Check that the amount is a valid positive number
3. Verify the category is selected from the dropdown
4. Ensure the asset name is unique

### Calculation Issues

#### Zakat Calculation Shows $0.00

**Solutions:**
1. Verify you have zakatable assets above the nisab threshold
2. Check that assets have been held for one lunar year
3. Confirm the nisab threshold is set correctly
4. Try recalculating with different methodology settings

#### Calculation Results Seem Incorrect

**Solutions:**
1. Double-check your asset values and categories
2. Verify the nisab threshold matches current gold/silver prices
3. Compare with manual calculations using the same methodology
4. Check if any assets are incorrectly marked as non-zakatable

### Data Import/Export Issues

#### CSV Import Fails
```
Error: Invalid CSV format
```

**Solutions:**
1. Ensure CSV has required columns: name, category, amount, currency
2. Check that amounts are numeric values
3. Verify categories match the allowed values
4. Remove any special characters from the CSV file

#### PDF Export Not Working

**Solutions:**
1. Check your browser's PDF viewer settings
2. Try a different browser
3. Disable browser extensions temporarily
4. Ensure JavaScript is enabled

## Error Messages

### Authentication Errors

**"Invalid credentials"**
- Your email or password is incorrect
- Account may be locked due to security policy

**"Account not verified"**
- Check your email for verification link
- Request a new verification email if needed

**"Too many failed attempts"**
- Account temporarily locked for security
- Try again after 15 minutes or reset password

### Validation Errors

**"Amount must be positive"**
- Asset amounts must be greater than zero
- Check for negative values or typos

**"Invalid date format"**
- Dates must be in YYYY-MM-DD format
- Check date picker or manual entry

**"Category required"**
- All assets must have a valid category selected
- Choose from the predefined categories

### Server Errors

**"Internal server error"**
- Temporary server issue
- Try again in a few minutes
- Contact support if issue persists

**"Service unavailable"**
- Server maintenance or high load
- Check status page for updates
- Try again later

## Performance Issues

### Slow Loading Times

**Symptoms:** Pages take longer than 3 seconds to load
**Solutions:**
1. Clear browser cache and cookies
2. Disable browser extensions
3. Check internet connection speed
4. Try a different browser or device
5. Contact support if issue persists across devices

### Calculation Delays

**Symptoms:** Zakat calculations take more than 5 seconds
**Solutions:**
1. Reduce the number of assets (keep under 1000)
2. Close other browser tabs and applications
3. Check browser developer tools for errors
4. Try refreshing the page

### Memory Issues

**Symptoms:** Browser becomes unresponsive or crashes
**Solutions:**
1. Close other browser tabs
2. Restart your browser
3. Clear browser cache
4. Try using a different browser
5. Check available system memory

## Security Concerns

### Data Privacy

**Q: How is my data protected?**
A: All sensitive data is encrypted using AES-256 encryption. Financial data never leaves your device without explicit consent.

**Q: Can ZakApp access my bank accounts?**
A: No, ZakApp never accesses external financial accounts. All data is entered manually by the user.

**Q: Are my calculations stored on servers?**
A: When self-hosted, all data stays on your server. The hosted version encrypts data at rest and in transit.

### Account Security

**Problem: Suspicious account activity**
**Solutions:**
1. Change your password immediately
2. Review recent login activity
3. Enable two-factor authentication if available
4. Contact support with details

**Problem: Forgotten password**
**Solutions:**
1. Use the "Forgot Password" link
2. Check your email for reset instructions
3. Add recovery email if not set up
4. Contact support if email not received

## Data Management

### Backup and Recovery

**How to backup your data:**
1. Go to Settings > Export Data
2. Choose JSON format for complete backup
3. Save the file securely
4. Store in multiple locations

**How to restore from backup:**
1. Go to Settings > Import Data
2. Select your backup file
3. Choose merge or replace option
4. Confirm the import

### Data Deletion

**How to delete your account:**
1. Go to Settings > Account
2. Click "Delete Account"
3. Confirm deletion (this is permanent)
4. All data will be permanently removed

**How to delete specific data:**
1. Navigate to the relevant section (Assets, Calculations, etc.)
2. Select items to delete
3. Click delete and confirm

## Getting Help

### Support Channels

1. **Documentation**: Check this troubleshooting guide first
2. **Community Forum**: Join our community discussions
3. **GitHub Issues**: Report bugs and request features
4. **Email Support**: support@zakapp.com for account issues

### Before Contacting Support

Please provide:
- Your browser and operating system
- Steps to reproduce the issue
- Screenshots if applicable
- Error messages (copy/paste exactly)
- When the issue started occurring

### Emergency Contacts

For urgent security issues:
- Email: security@zakapp.com
- Response time: Within 24 hours

For data loss emergencies:
- Email: support@zakapp.com
- Include "URGENT" in subject line

---

*Last updated: January 2025*
*For the latest troubleshooting information, visit our documentation website.*