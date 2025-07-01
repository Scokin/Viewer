const { ipcRenderer } = require('electron');

const browseBtn = document.getElementById('browse');
const fileList = document.getElementById('files');
const preview = document.getElementById('preview');

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

function showPreview(file) {
  if (file.ext.match(/\.txt|\.md|\.json|\.js|\.html|\.css/)) {
    fetch(`file://${file.path}`)
      .then(res => res.text())
      .then(text => {
        preview.textContent = text;
      });
  } else if (file.ext.match(/\.png|\.jpg|\.jpeg|\.gif/)) {
    preview.innerHTML = `<img src="file://${file.path}" style="max-width: 100%" />`;
  } else {
    preview.innerHTML = `<em>No preview available for ${file.ext}</em>`;
  }
}
