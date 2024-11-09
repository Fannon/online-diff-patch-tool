// Config and state
const debounceTime = 500;
let lastInput = { };

// DOM elements
const fileNameEl = document.getElementById('file-name');
const originalFileEl = document.getElementById('original-file');
const patchedFileEl = document.getElementById('patched-file');
const patchEl = document.getElementById('patch');

// Event listeners
originalFileEl.addEventListener('input', debounce(onTextInput, debounceTime));
patchedFileEl.addEventListener('input', debounce(onTextInput, debounceTime));
patchEl.addEventListener('input', debounce(onTextInput, debounceTime));
fileNameEl.addEventListener('input', debounce(onTextInput, debounceTime));

onTextInput();

/**
 * Main function to handle input changes
 */
function onTextInput() {
  console.log('onTextInput');
  const input = readInput();

  // const originalFileChanged = input.originalFile !== lastInput.originalFile;
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
    // TODO: Better response
    replaceMessage('warning', 'Missing input: Either provide original and patched file or original file and patch.');
  }

  lastInput = input;

}

function createPatch(input) {
  const patchText = Diff.createPatch(input.fileName, input.originalFile, input.patchedFile)
  console.dir(patchText);
  patchEl.value = patchText;
  replaceMessage('success', 'Created patch from diff between original file and changed file.');
}

function applyPatch(input) {
  const patchedFile = Diff.applyPatch(input.originalFile, input.patch);
  console.dir(patchedFile);
  
  if (patchedFile) {
    patchedFileEl.value = patchedFile;
    replaceMessage('success', 'Applied patch.');

  } else {
    replaceMessage('error', 'Invalid patch format');
  }
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