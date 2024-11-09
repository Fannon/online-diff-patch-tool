// Config and state
const debounceTime = 500;
let lastInput = { fileName: '', originalFile: '', patchedFile: '', patch: '' };

// DOM elements
const fileNameEl = document.getElementById('file-name');
const originalFileEl = document.getElementById('original-file');
const patchedFileEl = document.getElementById('patched-file');
const patchEl = document.getElementById('patch');
const sharePatchButton = document.getElementById('share-patch');

// Event listeners
originalFileEl.addEventListener('input', debounce(onTextInput, debounceTime));
patchedFileEl.addEventListener('input', debounce(onTextInput, debounceTime));
patchEl.addEventListener('input', debounce(onTextInput, debounceTime));
fileNameEl.addEventListener('input', debounce(onTextInput, debounceTime));
sharePatchButton.addEventListener('click', sharePatch)
window.addEventListener('DOMContentLoaded', init);

/**
 * Main function to run when page is ready
 */
function init() {

  if (window.location.hash) {
    const hash = window.location.hash.trim().slice(1)
    if (hash.includes('&patch=')) {
      console.log('loading shared patch', hash)
      const split = hash.split('&patch=');
      const fileName = decodeURIComponent(split[0])
      const patch = atob(split[1])

      console.log({fileName, patch})

      fileNameEl.value = fileName;
      patchEl.value = patch;
    }
  }
}

/**
 * Main function to handle input changes
 */
function onTextInput() {
  console.log('onTextInput');
  const input = readInput();

  const patchedFileChanged = input.patchedFile !== lastInput.patchedFile;
  const patchChanged = input.patch !== lastInput.patch;

  if (patchedFileChanged && input.originalFile) {
    console.log('patchedFileChanged')
    createPatch(input);
  } else if (patchChanged && input.originalFile) {
    console.log('patchChanged')
    applyPatch(input);
  } else if (input.originalFile && input.patchedFile) {
    createPatch(input);
  } else if (input.originalFile && input.patch) {
    applyPatch(input);
  } else {
    replaceMessage('warning', '<strong>Missing input</strong>: Either provide original and patched file or original file and patch.');
  }

  lastInput = input;
}

function createPatch(input) {
  const patchText = Diff.createPatch(input.fileName, input.originalFile, input.patchedFile)
  console.dir(patchText);
  patchEl.value = patchText;
  replaceMessage('success', '<strong>Success</strong>: Created patch from diff between original file and changed file.');
}

function applyPatch(input) {
  const patchedFile = Diff.applyPatch(input.originalFile, input.patch);
  console.dir(patchedFile);
  
  if (patchedFile) {
    patchedFileEl.value = patchedFile;
    replaceMessage('success', '<strong>Success</strong>: Applied patch.');

  } else {
    replaceMessage('error', 'Invalid patch format');
  }
}

function sharePatch(event) { 
  event.preventDefault();
  const fileNameEncoded = encodeURIComponent(fileNameEl.value);
  const patchEncoded = btoa(patchEl.value);

  const hashLocation = `${fileNameEncoded}&patch=${patchEncoded}`;

  window.location.hash = hashLocation;

  const shareUrl = `${window.location.origin}${window.location.pathname}#${hashLocation}`;

  console.log({ shareUrl });
}


function readInput () {
  const fileName = fileNameEl.value.trim() || 'file.txt';
  const originalFile = originalFileEl.value.trim();
  const patchedFile = patchedFileEl.value.trim();
  const patch = patchEl.value.trim();
  console.log({ fileName, originalFile, patchedFile, patch });
  return { fileName, originalFile, patchedFile, patch }
};

function debounce(func, delay) {
  let debounceTimer;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  };
};

function getMessage(type, message) {
  return `<div class="notification is-${type}">${message}</div>`;
}

function replaceMessage(type, message) {
  const el = document.getElementById('messages');
  el.innerHTML = getMessage(type, message);
}