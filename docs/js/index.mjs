// Config and state
const debounceTime = 300;
let lastInput = { fileName: '', originalFile: '', patchedFile: '', patch: '' };

// DOM elements
const fileNameEl = document.getElementById('file-name');
const originalFileEl = document.getElementById('original-file');
const patchedFileEl = document.getElementById('patched-file');
const patchEl = document.getElementById('patch');
const sharePatchButton = document.getElementById('share-patch');
const resetButton = document.getElementById('reset');
const copyPatchedFileButton = document.getElementById('copy-patched-file');
const copyPatchButton = document.getElementById('copy-patch');
const messages = document.getElementById('messages');

// Event listeners
originalFileEl.addEventListener('input', debounce(onTextInput, debounceTime));
patchedFileEl.addEventListener('input', debounce(onTextInput, debounceTime));
patchEl.addEventListener('input', debounce(onTextInput, debounceTime));
fileNameEl.addEventListener('input', debounce(onTextInput, debounceTime));
sharePatchButton.addEventListener('click', sharePatchViaUrl)
resetButton.addEventListener('click', reset)
copyPatchedFileButton.addEventListener('click', copyPatchedFile)
copyPatchButton.addEventListener('click', copyPatch)
window.addEventListener('DOMContentLoaded', init);

/**
 * Main function to run when page is ready
 */
function init() {

  if (window.location.hash) {
    const hash = window.location.hash.trim().slice(1)
    if (hash.includes('&patch=')) {
      console.log('Loading shared patch', hash)
      const split = hash.split('&patch=');
      const fileName = decodeURIComponent(split[0])
      const patch = atob(split[1])

      console.log('Loaded patch from sharable URL', {fileName, patch})

      fileNameEl.value = fileName;
      patchEl.value = patch;

      replaceMessage('info', `<strong>Shared URL</strong>: Loaded patch from sharable URL`)
    }
  }
}

/**
 * Main function to handle input changes
 */
function onTextInput() {
  const input = readInput();

  const patchedFileChanged = input.patchedFile !== lastInput.patchedFile;
  const patchChanged = input.patch !== lastInput.patch;

  if (patchedFileChanged && input.originalFile) {
    createPatch(input);
  } else if (patchChanged && input.originalFile) {
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
  patchEl.value = patchText;
  replaceMessage('success', '<strong>Success</strong>: Created patch from diff between original file and changed file.');
}

function applyPatch(input) {
  const patchParsed = Diff.parsePatch(input.patch)[0]
  console.dir(patchParsed);
  
  const patchedFile = Diff.applyPatch(input.originalFile, input.patch);
  if (patchedFile) {
    patchedFileEl.value = patchedFile;
    replaceMessage('success', `<strong>Success</strong>: Applied patch with ${patchParsed.hunks?.length || 0} change sets.`);
  } else {
    replaceMessage('danger', '<strong>Error</strong>: Patch could not be applied due to invalid patch format or incompatible target file.');
  }
}

function sharePatchViaUrl(event) { 
  event.preventDefault();
  const fileNameEncoded = encodeURIComponent(fileNameEl.value);
  const patchEncoded = btoa(patchEl.value);

  const hashLocation = `${fileNameEncoded}&patch=${patchEncoded}`;

  window.location.hash = hashLocation;

  const shareUrl = `${window.location.origin}${window.location.pathname}#${hashLocation}`;
  
  navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
    if (result.state === "granted" || result.state === "prompt") {
      navigator.clipboard.writeText(shareUrl);
      console.log('Copied URL to clipboard');
    }
  });
  
  replaceMessage('success', `<strong>Share Link</strong>: <a href="${shareUrl}}">Patch for ${fileNameEl.value}</a>`)
  
  console.log({ shareUrl });
}

function copyPatch(event) { 
  event.preventDefault();
  navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
    if (result.state === "granted" || result.state === "prompt") {
      navigator.clipboard.writeText(patchEl.value);
      console.log('Copied Patch to clipboard');
      replaceMessage('success', `<strong>Success</strong>: Patch copied into clipboard.`)
    }
  });
}
function copyPatchedFile(event) { 
  event.preventDefault();
  navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
    if (result.state === "granted" || result.state === "prompt") {
      navigator.clipboard.writeText(patchedFileEl.value);
      console.log('Copied Patch to clipboard');
      replaceMessage('success', `<strong>Success</strong>: Patched file copied into clipboard.`)
    }
  });
}

function reset(event) { 
  event.preventDefault();
  window.location.hash = '';
  fileNameEl.value = 'file.txt';
  originalFileEl.value = '';
  patchedFileEl.value = '';
  patchEl.value = '';
  messages.innerHTML = '';
}

function readInput () {
  const fileName = fileNameEl.value.trim() || 'file.txt';
  const originalFile = originalFileEl.value;
  const patchedFile = patchedFileEl.value;
  const patch = patchEl.value;
  console.log({ fileName, originalFile, patchedFile, patch });
  return { fileName, originalFile, patchedFile, patch }
};

function debounce(func, delay) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func.apply(this, args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, delay)
  }
}

function getMessage(type, message) {
  return `<div class="notification is-${type}">${message}</div>`;
}

function replaceMessage(type, message) {
  messages.innerHTML = getMessage(type, message);
}