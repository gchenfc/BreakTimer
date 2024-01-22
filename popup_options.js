// Function to update the checkbox state from chrome.storage.sync
function updateCheckboxState() {
  const checkboxes_defaults = {
    'AI_img': false,
    'quote': true,
    'yoga_pose': true,
    // 'yoga_pose_name': true,
    // 'yoga_pose_desc': false,
    // 'yoga_pose_img': false,
    'french_word': true,
  };

  Object.entries(checkboxes_defaults).forEach(([id, defaultValue]) => {
    chrome.storage.sync.get({ [id]: defaultValue }, function(data) {
      const checkbox = document.getElementById(id);
      checkbox.checked = data[id];

      // For yoga pose related checkboxes, check the state of the yoga_pose checkbox
      if (['yoga_pose_name', 'yoga_pose_desc', 'yoga_pose_img'].includes(id)) {
        checkbox.disabled = !document.getElementById('yoga_pose').checked;
        checkbox.parentElement.style.color = checkbox.disabled ? 'gray' : 'black';
      }

      if (['french_word'].includes(id)) {
        updateZipfParamVisibility();
      }

      saveCheckboxState(id);
    });
  });

  // And for the numerical input text box zipf_parameter
  chrome.storage.sync.get({ 'zipf_parameter': 1.15 }, function(data) {
    const input = document.getElementById('zipf_parameter');
    input.value = data['zipf_parameter'];
  });
}

// Function to save the checkbox state to chrome.storage.sync
function saveCheckboxState(id) {
  const checkbox = document.getElementById(id);
  let state = {};
  state[id] = checkbox.checked;
  chrome.storage.sync.set(state);
}
function saveZipfParameter(id) {
  const input = document.getElementById(id);
  let state = {};
  state[id] = parseFloat(input.value);
  chrome.storage.sync.set(state);
}
function updateZipfParamVisibility() {
  if (document.getElementById('french_word').checked) {
    document.getElementById('zipf_parameter').parentElement.style.display = 'block';
  } else {
    document.getElementById('zipf_parameter').parentElement.style.display = 'none';
  }
}

// Event listener for checkboxes
function setupListeners() {
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      saveCheckboxState(checkbox.id);
    });
  });
  document.getElementById('zipf_parameter').addEventListener('change', () => {
    saveZipfParameter('zipf_parameter');
  });
  document.getElementById('french_word').addEventListener('change', updateZipfParamVisibility);
}

// Initialize the script
document.addEventListener('DOMContentLoaded', function() {
  updateCheckboxState();
  setupListeners();
});
