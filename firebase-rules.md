# Firebase free-tier setup (Realtime Database only — no Storage)

This portfolio uses **only**:
- Firebase **Authentication** (email/password)
- Firebase **Realtime Database**

Images, PDFs, and small GLBs are compressed and stored **inside RTDB** as data URLs.  
No Firebase Storage, no paid plan required (Spark / free tier).

## 1. Authentication
Console → Authentication → Sign-in method → **Email/Password** → Enable  

Create an account from the site Admin → **Create Account**, or add a user in the Console.

## 2. Realtime Database rules
Console → Realtime Database → Rules:

```json
{
  "rules": {
    ".read": true,
    "experiences": { ".write": "auth != null" },
    "certifications": { ".write": "auth != null" },
    "projects": { ".write": "auth != null" },
    "settings": { ".write": "auth != null" }
  }
}
```

## 3. Size limits (free-tier friendly)
| Asset | Limit | Notes |
|-------|--------|--------|
| Cover / gallery images | ~450 KB after auto-compress | Resized to max 1200px, JPEG |
| PDF | ~700 KB each | Keep drawings simple / compressed |
| GLB | ~800 KB | Optional; hero still has built-in model |
| RTDB total (Spark) | 1 GB stored | Plenty for a portfolio |

## 4. Do **not** enable Storage
This app does not call Storage. You can ignore Storage entirely.

## 5. If save fails
- Confirm you are signed in (Admin dashboard visible)
- Confirm RTDB rules above are published
- Check file sizes against the limits
- Large photos are auto-compressed; very large PDFs must be reduced first
