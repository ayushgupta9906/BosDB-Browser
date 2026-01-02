# Fix: ENCRYPTION_MASTER_KEY Missing

## Error
```
Error: Encryption master key not configured. Set ENCRYPTION_MASTER_KEY environment variable.
```

## Solution

Add this line to your `.env` file:

```bash
ENCRYPTION_MASTER_KEY=your-secret-key-here-min-32-chars-long-for-aes256
```

### Quick Fix (Copy/Paste)

**Option 1: Generate a secure random key**
```bash
# Run this in PowerShell to generate a random 32-character key
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Option 2: Use a simple key for development**
```
ENCRYPTION_MASTER_KEY=dev-secret-key-12345678901234567890123
```

### Steps:

1. Open `.env` file in the project root
2. Add the `ENCRYPTION_MASTER_KEY` line
3. Save the file
4. Restart `npm run dev`

## Why This Is Needed

BosDB encrypts database credentials (passwords) before storing them. The `ENCRYPTION_MASTER_KEY` is used for AES-256 encryption to keep your database passwords secure.

**Security Note:** 
- Use a strong, random key in production
- Never commit this key to Git (already in `.gitignore`)
- Minimum 32 characters recommended

## Example .env File

```bash
# MongoDB Atlas (if using)
MONGODB_URI=your-mongodb-connection-string

# Encryption (REQUIRED)
ENCRYPTION_MASTER_KEY=your-secret-key-here-min-32-chars-long-for-aes256

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Stripe (optional, for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

After adding the key, your connection creation will work! 🎉
