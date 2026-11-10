# Firebase Console Setup (Required)

## 1. Enable Authentication
Firebase Console → Authentication → Sign-in method → Email/Password → Enable

Create your admin user:
Authentication → Users → Add user
(email + password you will use to log in)

## 2. Enable Storage
Firebase Console → Storage → Get started → Start in production mode
(then update rules below)

## 3. Realtime Database Rules
Replace your current rules with:

```json
{
  "rules": {
    ".read": true,
    "experiences": {
      ".write": "auth != null"
    },
    "certifications": {
      ".write": "auth != null"
    },
    "projects": {
      ".write": "auth != null"
    },
    "settings": {
      ".write": "auth != null"
    }
  }
}
```

Public visitors can read everything. Only signed-in admins can write.

## 4. Storage Rules
Firebase Console → Storage → Rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /models/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 50 * 1024 * 1024
                   && request.resource.contentType.matches('model/.*|application/octet-stream');
    }
    match /thumbnails/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 8 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    match /images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 12 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    match /pdfs/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 30 * 1024 * 1024
                   && request.resource.contentType.matches('application/pdf');
    }
  }
}
```

## 5. Database URL
Already wired in script.js:
https://tine-54a9e-default-rtdb.asia-southeast1.firebasedatabase.app/

## What gets stored where

| Content | Storage path | RTDB field |
|---------|--------------|------------|
| GLB 3D model | `/models/` | `projects/{id}.modelUrl` |
| Cover image | `/thumbnails/` | `projects/{id}.thumbnailUrl` |
| Gallery images | `/images/` | `projects/{id}.images[]` |
| PDF documents | `/pdfs/` | `projects/{id}.pdfs[{name,url}]` |
| Experience | — | `/experiences/` |
| Certifications | — | `/certifications/` |

After setup: open the site → footer **Admin** → sign in → add projects with images/PDFs/GLB. The public gallery updates in real time.
