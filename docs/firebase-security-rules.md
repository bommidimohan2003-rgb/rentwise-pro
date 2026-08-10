# Firebase Security Rules & Database Setup Guide

This document contains the security rules for Firebase Firestore and Firebase Realtime Database for the Payent platform.

---

## 1. Firebase Firestore Security Rules

To secure all user data stored in Cloud Firestore:

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project (**payent-app**).
3. In the left navigation bar, go to **Build** -> **Firestore Database**.
4. Click on the **Rules** tab at the top of the Firestore dashboard.
5. Paste the following rules into the editor:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // User collection security rules
    match /users/{userId} {
      // Allow user to read and write their own profile document
      allow read, write: if request.auth != null && (request.auth.uid == userId || request.auth.token.email_verified == true);
      
      // Allow authenticated user profile lookups
      allow read: if request.auth != null;
      allow create, update: if request.auth != null || request.resource.data.email != null;
    }

    // Rentals and products collection rules (if extended to Firestore)
    match /custom_products/{productId} {
      allow read: if true; // Publicly readable catalog
      allow create, update, delete: if request.auth != null;
    }

    // Default catch-all rule: Deny access to unauthenticated requests
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

6. Click **Publish** to apply the security rules.

---

## 2. Firebase Realtime Database Rules (Optional)

If you are using Firebase Realtime Database in addition to or instead of Cloud Firestore:

1. Go to **Build** -> **Realtime Database** -> **Rules**.
2. Paste the following JSON rules:

```json
{
  "rules": {
    "users": {
      "$user_id": {
        ".read": "auth != null",
        ".write": "auth != null && (auth.uid === $user_id || newData.hasChild('email'))"
      }
    },
    ".read": false,
    ".write": false
  }
}
```

3. Click **Publish**.

---

## 3. Enabling Firebase Phone Authentication

To allow SMS OTP verification through Firebase:

1. Open **Firebase Console** -> **Authentication** -> **Sign-in method**.
2. Enable **Phone** as a sign-in provider.
3. Under **Testing phone numbers**, you can add test phone numbers (e.g., `+91 99999 99999` with code `123456`) for local testing without spending SMS quotas.
4. Save the configuration.
