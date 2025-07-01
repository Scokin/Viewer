const { ipcRenderer } = require('electron');
const path = require('path');

const browseBtn = document.getElementById('browse');
const fileList = document.getElementById('files');
const previewControls = document.getElementById('preview-controls');
const imageContainer = document.getElementById('image-container');
const zoomLabel = document.getElementById('zoom-label');

let currentZoom = 1.0;
const zoomStep = 0.1;

browseBtn.onclick = async () => {
  const folder = await ipcRenderer.invoke('select-folder');
  if (!folder) return;
  const files = await ipcRenderer.invoke('read-directory', folder);
  renderFiles(files);
};

function renderFiles(files) {
  fileList.innerHTML = '';
  files.forEach(file => {
    const li = document.createElement('li');
    li.textContent = file.name;
    li.onclick = () => showPreview(file);
    fileList.appendChild(li);
  });
}

function zoomIn() {
  currentZoom += zoomStep;
  applyZoom();
}

function zoomOut() {
  currentZoom = Math.max(zoomStep, currentZoom - zoomStep);
  applyZoom();
}

function applyZoom() {
  const svgEl = imageContainer.querySelector('svg');
  if (svgEl) {
    svgEl.style.transform = `scale(${currentZoom})`;
    svgEl.style.transformOrigin = 'top left';
    zoomLabel.textContent = `${Math.round(currentZoom * 100)}%`;
  }
  const img = imageContainer.querySelector('img');
  if (img) {
    img.style.transform = `scale(${currentZoom})`;
    img.style.transformOrigin = 'top left';
    zoomLabel.textContent = `${Math.round(currentZoom * 100)}%`;
  }
}

function showPreview(file) {
  previewControls.style.display = 'none';
  imageContainer.innerHTML = '';

  if (file.ext.match(/\.txt|\.md|\.json|\.js|\.html|\.css/)) {
    fetch(`file://${file.path}`)
      .then(res => res.text())
      .then(text => {
        imageContainer.innerText = text;
      });
  } else if (file.ext.match(/\.png|\.jpg|\.jpeg|\.gif/)) {
    previewControls.style.display = 'block';
    imageContainer.innerHTML = `<img src="file://${file.path}" style="display: block; transform: scale(1); transform-origin: top left;" />`;
    currentZoom = 1.0;
    applyZoom();
  } else if (file.ext === '.svg') {
  previewControls.style.display = 'block';
  fetch(`file://${file.path}`)
    .then(res => res.text())
    .then(svgText => {
      imageContainer.innerHTML = `<div id="svg-wrapper" style="overflow: auto;">${svgText}</div>`;
      const svgEl = imageContainer.querySelector('svg');
      if (svgEl) {
        let width = svgEl.getAttribute('width') || '1000';
        let height = svgEl.getAttribute('height') || '1000';

        // Try to extract numeric values
        const w = parseFloat(width);
        const h = parseFloat(height);

        if (!svgEl.getAttribute('viewBox') && !isNaN(w) && !isNaN(h)) {
          svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
        }

        svgEl.removeAttribute('width');
        svgEl.removeAttribute('height');

        svgEl.style.width = '100%';
        svgEl.style.height = 'auto';
        svgEl.style.transform = `scale(1)`;
        svgEl.style.transformOrigin = 'top left';
        svgEl.style.display = 'block';

        currentZoom = 1.0;
        applyZoom();
      }
    });
} else if (file.ext === '.pdf') {
    const relPath = path.relative(__dirname, file.path);
    imageContainer.innerHTML = `<iframe src="pdf-viewer.html?file=${encodeURIComponent(relPath)}" style="width: 100%; height: 100vh; border: none;"></iframe>`;
  } else {
    imageContainer.innerHTML = `<em>No preview available for ${file.ext}</em>`;
  }
}

window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
