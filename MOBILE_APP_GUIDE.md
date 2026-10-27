# 📱 Kirti Store — Cross-Platform Mobile App (Android & iOS)

The Kirti Store mobile application is built using **Capacitor**, unifying your existing React + Vite frontend and Node.js/Express backend into high-performance native apps for both **Android** and **iOS**.

---

## 🏗️ Architecture & What Was Implemented

1. **Native Platform Projects**:
   - `client/android/`: Complete Android Studio project (Gradle, Kotlin/Java, AndroidManifest with cleartext network & UPI intent queries).
   - `client/ios/`: Complete Xcode project (Swift, Info.plist with App Transport Security and UPI URL schemes).
2. **Native Device Plugins**:
   - `@capacitor/app`: Handles Android physical and gesture back buttons (navigates backward through React Router, minimizes app on Home).
   - `@capacitor/status-bar`: Configures light/dark status bar styling with native background matching.
   - `@capacitor/splash-screen`: Smooth splash screen display and animated dismissal on app ready.
   - `@capacitor/haptics`: Provides subtle tactile vibration on navigation and cart interactions.
   - `@capacitor/keyboard`: Prevents keyboard overlay from obscuring checkout and login inputs.
3. **Mobile-First UI Enhancements**:
   - **Mobile Bottom Navigation Bar** (`MobileBottomNav.jsx`): Fixed bottom bar with instant 1-tap thumb navigation for *Home*, *Shop*, *Wishlist (with badge)*, *Cart (with live count)*, and *Account*.
   - **Safe-Area Insets**: Proper padding for iPhone Dynamic Island/notches and Android camera punch holes.
   - **Dynamic API BaseURL**: Auto-routes API calls to local emulator host (`http://10.0.2.2:5000`) or custom server URL via `VITE_API_URL`.
   - **UPI Payment Intent Support**: Native queries configured for Google Pay, PhonePe, and Paytm.

---

## 🚀 Quick Command Reference

Run these commands from the root directory (`d:\Kirti Store`):

| Command | Action |
|---|---|
| `npm run mobile:sync` | Builds the client and syncs web assets & native plugins to Android and iOS |
| `npm run mobile:android` | Opens the Android project directly in **Android Studio** |
| `npm run mobile:ios` | Opens the iOS project directly in **Xcode** (macOS) |

---

## 🤖 Running on Android

### Prerequisites
1. Download and install [Android Studio](https://developer.android.com/studio).
2. In Android Studio SDK Manager, ensure **Android SDK Platform 34 or 35** and **Android SDK Build-Tools** are installed.

### Steps to Run
1. Start your backend server:
   ```bash
   npm run server
   ```
2. Build and sync your mobile assets:
   ```bash
   npm run mobile:sync
   ```
3. Open in Android Studio:
   ```bash
   npm run mobile:android
   ```
4. In Android Studio:
   - Select an **Android Virtual Device (AVD)** emulator or plug in your physical Android phone with **USB Debugging** enabled.
   - Click the green **Run (▶)** button.
   - The app will install and launch with native splash screen and status bar.

### Connecting to Your Local Backend on Android
- **Android Emulator**: Automatically connects to your PC backend via `http://10.0.2.2:5000`.
- **Physical Android Phone over Wi-Fi**:
  1. Find your computer's Wi-Fi IP address by running `ipconfig` in PowerShell (e.g., `192.168.1.15`).
  2. Create a file `client/.env.local` containing:
     ```env
     VITE_API_URL=http://192.168.1.15:5000
     ```
  3. Run `npm run mobile:sync`.
  4. Ensure your phone and computer are on the same Wi-Fi network.

---

## 🍏 Running on iOS

### Prerequisites
- macOS machine with [Xcode](https://developer.apple.com/xcode/) installed from the Mac App Store.
- CocoaPods (`sudo gem install cocoapods`) or Swift Package Manager (pre-configured).

### Steps to Run
1. From your macOS terminal:
   ```bash
   npm run mobile:sync
   npm run mobile:ios
   ```
2. Xcode will open the `App.xcworkspace`.
3. Select your target device (e.g. **iPhone 16 Pro Simulator** or physical connected iPhone).
4. Click the **Play (▶)** button to build and run.

---

## 📦 Building Production Release Binaries

### Android (APK & AAB for Google Play Store)
1. Run `npm run mobile:sync`.
2. In Android Studio, go to **Build > Generate Signed Bundle / APK...**
3. Choose **Android App Bundle (.aab)** for Google Play Store or **APK** for direct download/sideloading.
4. Select or create your release keystore key, choose `release` build variant, and click **Finish**.

### iOS (IPA for Apple App Store / TestFlight)
1. In Xcode, select **Any iOS Device (arm64)** as target.
2. Go to **Product > Archive**.
3. Once archived, click **Distribute App** to upload to App Store Connect or export an Ad-Hoc/Enterprise IPA.

---

## 🔔 Firebase Cloud Messaging (FCM) Push Notifications

Kirti Store includes complete end-to-end push notifications for mobile devices powered by `@capacitor/push-notifications` and `firebase-admin`:

### Automated Triggers:
1. **🚚 Order Dispatched**: Automatically fires when admin updates order status to `Shipped` with courier name & live AWB tracking link.
2. **🛵 Out for Delivery**: Automatically fires when package is marked `Out for Delivery` with delivery agent details.
3. **🎉 Order Delivered**: Automatically fires upon delivery with a 1-click CTA to activate 2-Year Manufacturer Warranty.
4. **✨ Wishlist Restock Alerts**: Automatically fires to interested customers when an out-of-stock appliance is restocked.
5. **🔥 Flash Deals & Announcements**: Admins can broadcast flash deals to all customers and mobile devices with 1-click from the **Executive Dashboard**.

### Connecting to Live Firebase Credentials:
1. **Firebase Console**:
   - Create a project at [console.firebase.google.com](https://console.firebase.google.com).
   - Add an **Android app** with package name matching `app/build.gradle` (e.g. `com.kirtistore.app`). Download `google-services.json` and place it in `client/android/app/`.
   - Add an **iOS app** with bundle identifier. Download `GoogleService-Info.plist` and place it in `client/ios/App/App/`.
2. **Backend Admin Credentials**:
   - In Firebase Console > Project Settings > Service Accounts, click **Generate new private key**.
   - Save the downloaded JSON file as `server/config/firebaseServiceAccount.json` (or set `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env`).
   - If no key is provided, the system gracefully runs in **simulation mode** (recording notifications in MongoDB and displaying them via the in-app notification bell).

