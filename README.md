# ⚡ QRDrop — Lossless Optical File Transfer
View Live :https://qr-drop-liart.vercel.app/
<div align="center">

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Air--Gapped](https://img.shields.io/badge/Network-100%25%20Air--Gapped-success.svg)](#-key-features)

**Beam photos, audio, and files across devices in 100% original quality using rapid optical QR code streams.**  
*Zero Wi-Fi • Zero Bluetooth • Zero Cellular Data • Zero Servers*

</div>

---

## 📖 Overview

**QRDrop** is a peer-to-peer, air-gapped web application that turns any screen into an optical transmitter and any camera into an optical receiver. 

Instead of routing data through cloud servers or pairing over radio frequencies (Wi-Fi / Bluetooth), QRDrop serializes, compresses, and streams data packets as high-speed animated QR codes directly through physical light.

---

## ✨ Key Features

- 💎 **100% Lossless Quality**: Transmit images and files bit-for-bit without lossy compression or resizing.
- ⚡ **Adaptive Quality Presets**:
  - **Original**: Exact binary byte-for-byte transmission.
  - **HD (1080p)**: Optimized for fast high-definition visual sharing.
  - **Fast Demo**: Ultra-compact lightweight transmission for instant sharing.
- 📸 **Real-Time Computer Vision Scanner**: Progressive receiver with visual block assembly matrix.
- 🔄 **Out-of-Order Assembly**: Automatically captures missed frames on subsequent loops.
- 🔒 **Air-Gapped & Secure**: Zero network traffic. Data never leaves your physical space.
- 📱 **Cross-Platform**: Works seamlessly across iOS, Android, Mac, Windows, and Linux in any modern browser.

---

## 🏗️ Architecture & How It Works

```
┌────────────────────────────────────────────────────────┐
│                   TRANSMITTER (Sender)                 │
│  [File] ──► [Uint8Array] ──► [Pako Deflate L9]        │
│              ──► [140-Byte Chunking] ──► [QR Stream]   │
└──────────────────────────┬─────────────────────────────┘
                           │ 💡 Optical Light (Screen ➜ Camera)
┌──────────────────────────▼─────────────────────────────┐
│                    RECEIVER (Scanner)                  │
│  [Camera Feed] ──► [Canvas Frame] ──► [jsQR Decode]    │
│    ──► [Out-of-Order Buffer] ──► [Pako Inflate]        │
│              ──► [Blob Construction & Download]        │
└────────────────────────────────────────────────────────┘
```

### 📦 Optical Packet Protocol
Each QR frame carries a lightweight, self-describing packet:
$$\text{Frame Format} = \texttt{index} \mid \texttt{total\_chunks} \mid \texttt{type\_header} \mid \texttt{base64\_payload}$$

* **Payload Size**: ~140 bytes per frame (optimized for camera focal length & QR density).
* **Error Correction**: QR Level-M Reed-Solomon error correction.
* **Frame Rate**: ~5 FPS transmission loop for optimal scanning accuracy.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript |
| **Bundler & Dev Server** | Vite 6 |
| **Styling & Theme** | Tailwind CSS v4 (Lego-inspired Neo-brutalist design) |
| **Binary Compression** | Pako (Deflate / Inflate Level 9) |
| **QR Code Engine** | QRCode.js (Generator) & jsQR (Computer Vision Reader) |
| **Animations & Icons** | Motion (Framer Motion) & Lucide Icons |

---

## 🚀 Quick Start (Run Locally)

### Prerequisites
- **Node.js**: v18 or higher
- **npm** or **bun**

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/your-username/qrdrop.git

# 2. Navigate to project directory
cd qrdrop

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Open `http://localhost:3000` in your browser.

> [!NOTE]
> To test camera scanning between devices on the same local network, start with `npm run dev -- --host` and open `http://<your-ip>:3000`.

---

## 🌐 Free Deployment

Because QRDrop is 100% client-side, you can host it for free on any static hosting platform:

- **Vercel**: Import repository $\rightarrow$ Deploy (Automatic HTTPS).
- **Netlify**: Connect repo or drag & drop the `dist/` folder.
- **Cloudflare Pages**: Connect repo $\rightarrow$ Build command: `npm run build`, Output directory: `dist`.
- **Google AI Studio**: Deploy directly from the AI Studio dashboard.

> [!IMPORTANT]
> Browsers require **HTTPS** to enable camera permissions (`getUserMedia`). All platforms above provide automatic, free SSL/HTTPS certificates.

---

## 📄 License

Distributed under the **Apache 2.0 License**.
