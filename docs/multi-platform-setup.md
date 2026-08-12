# Multi-platform setup (iOS, Android, TV)

Viventory currently ships as a **desktop-only** Tauri 2 app. This document covers what is
needed to add iOS, Android, and Android TV targets, and records exactly where the machine
stood when this was written (2026-08-12).

## Status

| Piece | State |
|---|---|
| Rust toolchain | Installed — 1.96.1 |
| Rust mobile targets | **Installed** (see below) |
| Xcode | **Missing** — blocks all iOS work |
| Android SDK + NDK | **Missing** — blocks all Android work |
| JDK | **Too old** — 1.8 installed, Android Gradle needs 17+ |
| `src-tauri/gen/android`, `gen/apple` | Not scaffolded |

The Rust cross-compilation targets are already installed and need no further action:

```text
aarch64-apple-ios  aarch64-apple-ios-sim  x86_64-apple-ios
aarch64-linux-android  armv7-linux-androideabi
i686-linux-android  x86_64-linux-android
```

Everything below is blocked on installs that require a GUI, an Apple ID, or a licence
click-through, so they cannot be automated from a terminal session.

## 1. iOS prerequisites

`xcodebuild` currently resolves to the Command Line Tools instance, not a full Xcode.
`tauri ios init` will fail until real Xcode is present.

1. Install **Xcode** from the App Store (large download, needs your Apple ID).
2. Point the developer directory at it and accept the licence:

   ```sh
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -license accept
   ```

3. Verify — this must print a version, not an error:

   ```sh
   xcodebuild -version
   ```

4. Install the CocoaPods dependency Tauri's iOS template uses:

   ```sh
   brew install cocoapods
   ```

Running on a **physical iPad** (the kiosk case) additionally needs a signing team — a free
Apple ID works for 7-day development builds; a paid Apple Developer account is required for
anything longer-lived. The Simulator needs no signing.

## 2. Android prerequisites

1. Install a **JDK 17+** — the installed 1.8 is too old for the Android Gradle Plugin:

   ```sh
   brew install --cask temurin@17
   ```

2. Install **Android Studio**, then use its SDK Manager to install the SDK Platform,
   Platform-Tools, and the **NDK** (Tauri needs the NDK, which is not installed by default).

3. Export the environment variables — add these to `~/.zshrc`, since Tauri reads them on
   every build:

   ```sh
   export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home"
   export ANDROID_HOME="$HOME/Library/Android/sdk"
   export NDK_HOME="$ANDROID_HOME/ndk/$(ls -1 "$ANDROID_HOME/ndk" | sort -V | tail -1)"
   ```

4. Verify:

   ```sh
   java -version          # must report 17 or newer
   ls "$ANDROID_HOME"     # must exist
   ls "$NDK_HOME"         # must exist
   ```

## 3. Scaffolding the mobile projects

Once the prerequisites above pass their verification steps:

```sh
npm run tauri ios init
npm run tauri android init
```

These generate `src-tauri/gen/apple/` and `src-tauri/gen/android/`. Both are committed to
git in a standard Tauri setup, so review what lands before committing.

Then, to run:

```sh
npm run tauri ios dev
npm run tauri android dev
```

`beforeDevCommand` in `src-tauri/tauri.conf.json` starts Vite on `127.0.0.1:5173`. A device
on the network cannot reach `127.0.0.1`, so device (as opposed to simulator/emulator) runs
need the dev server bound to the LAN address — Tauri's mobile CLI normally handles this by
rewriting `devUrl`, but confirm it before debugging a blank screen.

> Watch out for a stale Vite already listening on 5173 — it will silently serve an old
> build with old environment variables, which looks exactly like a code bug.

## 4. TV

Android TV is the practical TV target: it is the same Android build with a different
manifest and input model. It needs three things beyond the phone build:

1. A **leanback launcher intent** and `android.software.leanback` feature declaration in
   `AndroidManifest.xml`, so the app appears on the TV home screen.
2. **D-pad focus navigation.** A TV has no touchscreen and no pointer. Every interactive
   element must be reachable and visibly focused via arrow keys. The current UI has no
   focus-ring styling and assumes pointer input, so this is real work, not a manifest flag.
3. **Overscan-safe margins** — roughly 5% padding, since TV panels crop the frame edges.

Apple TV is *not* reachable this way: tvOS is a separate platform that Tauri does not
target. If a TV experience is needed on Apple hardware, the web build at
`gurtxvivita-4c370.web.app?display=tv` in a browser remains the fallback.

## 5. Known design gap: device mode on native

Device mode is currently resolved from the URL query string —
`?display=tv|kiosk` in `src/utils/displayMode.ts`. Native iOS/Android/TV builds have no
URL to carry that parameter, so **device mode must move to persisted local settings** with
the query parameter kept as a web-only override. This is a prerequisite for the agreed
"hard kid/staff split, device decides" model and should be resolved as part of the
interface simplification work, not bolted on afterwards.
