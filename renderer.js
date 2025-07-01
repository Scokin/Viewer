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
  }  else if (file.ext === '.docx') {
  previewControls.style.display = 'none';
  const mammoth = require('mammoth');
  mammoth.convertToHtml({ path: file.path }).then(result => {
    imageContainer.innerHTML = result.value;
  }).catch(err => {
    imageContainer.innerHTML = `<pre>${err.message}</pre>`;
  });

} else if (file.ext === '.xlsx') {
  previewControls.style.display = 'none';
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();

  workbook.xlsx.readFile(file.path).then(() => {
    const sheet = workbook.worksheets[0];
    let html = '<table border="1" style="border-collapse: collapse;">';

    sheet.eachRow((row, rowNum) => {
      html += '<tr>';
      row.eachCell((cell, colNum) => {
        html += `<td>${cell.text}</td>`;
      });
      html += '</tr>';
    });

    html += '</table>';
    imageContainer.innerHTML = html;
  }).catch(err => {
    imageContainer.innerHTML = `<pre>${err.message}</pre>`;
  });
} else if (file.ext?.toLowerCase() === '.zip') {
  console.log("Opening ZIP...", file.path);
  previewControls.style.display = 'none';
  imageContainer.innerHTML = 'Loading ZIP contents...';

  const { open } = require('yauzl-promise');

  open(file.path).then(async zip => {
    console.log("ZIP opened");

    const ul = document.createElement('ul');
    ul.id = 'zip-entries';
    imageContainer.innerHTML = '';
    imageContainer.appendChild(ul);

    let count = 0;

    for await (const entry of zip) {
      console.log("Entry:", entry?.filename);
      console.log("Raw entry:", entry);
      if (!entry?.filename || entry.filename.endsWith('/')) continue;
      count++;

      const li = document.createElement('li');
      li.textContent = entry.filename;
      li.style.cursor = 'pointer';

      li.onclick = async () => {
        const stream = await entry.openReadStream();
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);

        const tempExt = path.extname(entry.filename).toLowerCase();
        const blob = new Blob([buffer]);
        const url = URL.createObjectURL(blob);

        if (tempExt.match(/\.(png|jpg|jpeg|gif)$/)) {
          previewControls.style.display = 'block';
          imageContainer.innerHTML = `<img src="${url}" style="display: block; transform: scale(1); transform-origin: top left;" />`;
          currentZoom = 1.0;
          applyZoom();
        } else if (tempExt === '.svg') {
          blob.text().then(svgText => {
            imageContainer.innerHTML = `<div id="svg-wrapper">${svgText}</div>`;
            applyZoom();
          });
        } else if (tempExt.match(/\.(txt|json|html|js|css)$/)) {
          blob.text().then(text => {
            imageContainer.innerHTML = `<pre>${text}</pre>`;
          });
        } else {
          imageContainer.innerHTML = `<em>Cannot preview this file (${entry.filename}).</em>`;
        }
      };

      ul.appendChild(li);
    }

    if (count === 0) {
      imageContainer.innerHTML = '<em>No previewable entries found in ZIP.</em>';
    }

    await zip.close();
  }).catch(err => {
    console.error("ZIP error:", err);
    imageContainer.innerHTML = `<pre>Error opening ZIP: ${err.message}</pre>`;
  });
}

  else {
    imageContainer.innerHTML = `<em>No preview available for ${file.ext}</em>`;
  }
}

window.zoomIn = zoomIn;
window.zoomOut = zoomOut;

