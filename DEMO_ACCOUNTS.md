# Demo Accounts for BosDB Browser

## 🎯 Test Accounts (Auto-Created)

Visitors can use these accounts to test BosDB immediately without registration:

### Individual Account
```
Email:    demo@gmail.com
Password: Demo123!
Type:     Individual Plan
```

**Features to Test:**
- Personal database connections
- Query editor with AI assistant
- Version control (VCS)
- Personal workspace

---

### Organization Account
```
Email:    demo@company.com
Password: Demo123!
Type:     Enterprise Plan
```

**Features to Test:**
- Team collaboration
- Admin panel (`/admin`)
- User management & approvals
- Connection sharing
- Organization-wide settings

---

## 🔐 Owner Account

```
Regular Login:     ayush@bosdb.com / Arush098!
Super Admin:       ayush@bosdb.com / Arush098! (at /super-admin/login)
```

---

## 📋 Usage

These accounts are automatically seeded on application startup. Visitors can:

1. Go to `/login`
2. Select account from dropdown (or type email)
3. Enter password
4. Start testing immediately

**Important Notes:**
- Demo accounts have full admin privileges
- Data may be reset periodically
- For production use, create a real account
- Demo accounts are read-only on production deployments (optional)

---

## 🌐 Display on Landing Page

Add this to your landing page/hero section:

```html
<div class="demo-accounts">
  <h3>Try BosDB Now - No Registration Required</h3>
  <div class="demo-cards">
    <div class="demo-card">
      <span class="badge">Individual</span>
      <code>demo@gmail.com</code>
      <code>Demo123!</code>
    </div>
    <div class="demo-card">
      <span class="badge">Enterprise</span>
      <code>demo@company.com</code>
      <code>Demo123!</code>
    </div>
  </div>
  <a href="/login" class="btn-primary">Start Testing →</a>
</div>
```
