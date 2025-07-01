# 📂 File Previewer App

A lightweight desktop application built with **Electron** that lets you explore folders and preview various file types — including **PDF, SVG, PNG, JPG, text, and more**. Ideal for working with mixed technical files like schematics, documentation, and assets.

---

## ✨ Features

- 📁 Browse folders recursively
- 🖼️ Preview images (`.png`, `.jpg`, `.gif`) with zoom
- 📄 View multi-page PDFs using Mozilla’s `pdf.js`
- 🧠 Inline-render large `.svg` files with smart scaling
- 📝 Preview raw `.txt`, `.json`, `.html`, `.css`, `.js` files
- 🔍 Zoom in/out controls for supported formats

---

## 🧱 Tech Stack

- ⚙️ [Electron](https://www.electronjs.org/)
- 💻 JavaScript (Node.js + browser)
- 🖼️ [pdf.js](https://mozilla.github.io/pdf.js/) (for PDF rendering)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/file-previewer-app.git
cd file-previewer-app
```

### 2. Install dependencies

Make sure you have **Node.js v16+** installed.

```bash
npm install
```

### 3. Run the app

```bash
npm start
```

---

## 📦 Folder Structure

```
file-previewer-app/
├── main.js              # Electron main process
├── index.html           # App layout and UI
├── renderer.js          # Handles folder scan and preview rendering
├── pdf-viewer.html      # Embedded PDF viewer using pdf.js
├── package.json         # NPM configuration
```

---

## 🖇 Supported File Types

| Extension     | Behavior              |
|---------------|------------------------|
| `.pdf`        | Renders all pages using pdf.js |
| `.svg`        | Inline rendering, zoomable |
| `.png`, `.jpg`, `.gif` | Zoomable preview |
| `.txt`, `.json`, `.html`, `.css`, `.js` | Raw text display |
| Others        | Not previewed (fallback message) |

---

## 🛠 Troubleshooting

### Linux: sandbox errors or `/dev/shm` issues?

If Electron crashes with sandbox or shared memory issues, try:

```bash
sudo chmod 1777 /dev/shm
```

Or run Electron without the sandbox (already handled in code):

```js
app.commandLine.appendSwitch('no-sandbox');
```

---

## 📜 License

MIT — Use it freely, contribute if you like!

---

## 🙋‍♂️ Want to Extend It?

- Add drag-and-drop support
- Add tagging or bookmarking
- Support archive file preview (.zip, .tar)
- Export search or preview history

Feel free to fork and enhance it!
