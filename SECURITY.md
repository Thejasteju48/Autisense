# Security Guidelines

## 🔒 Environment Variables

**NEVER commit the following files to Git:**
- `backend/.env`
- `ml-service/.env`
- `frontend/.env` (if you create one)

These files contain sensitive credentials and should remain local only.

## 🔑 Required Secrets

### Backend (`backend/.env`)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=generate_a_strong_random_64_character_string
```

**How to generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### ML Service (`ml-service/.env`)
```env
GROQ_API_KEY=your_groq_api_key_from_console.groq.com
```

## 🛡️ MongoDB Security

1. **Never use default credentials**
2. **Enable IP Whitelist** in MongoDB Atlas
3. **Use strong passwords** (at least 16 characters)
4. **Rotate credentials** every 90 days
5. **Use MongoDB Atlas** for production (not local MongoDB)

## 🔐 API Keys

### GROQ API Key
1. Sign up at [console.groq.com](https://console.groq.com)
2. Create a new API key
3. Add to `ml-service/.env` as `GROQ_API_KEY`
4. Keep it secret - never share or commit to Git

## 📋 Security Checklist

Before deploying:
- [ ] All `.env` files are in `.gitignore`
- [ ] No hardcoded credentials in source code
- [ ] MongoDB URI uses strong password
- [ ] JWT_SECRET is randomized (64+ characters)
- [ ] GROQ_API_KEY is active and valid
- [ ] MongoDB Atlas IP whitelist configured
- [ ] HTTPS enabled in production
- [ ] CORS configured for production domain only

## 🚨 If Credentials Are Exposed

1. **Immediately rotate all compromised credentials**:
   - Generate new MongoDB user/password in Atlas
   - Create new JWT_SECRET
   - Regenerate GROQ API key
   
2. **Update environment variables** on all deployment platforms

3. **Revoke old credentials** to prevent unauthorized access

4. **Review Git history** - if credentials were committed, consider them compromised

## 📞 Reporting Security Issues

If you discover a security vulnerability, please email: thejast397@gmail.com

Do NOT create a public GitHub issue for security vulnerabilities.
