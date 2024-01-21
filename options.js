// Function to update the checkbox state from chrome.storage.sync
function updateCheckboxState() {
  const checkboxes_defaults = {
    'AI_img': false,
    'quote': true,
    'yoga_pose': true,
    'yoga_pose_name': true,
    'yoga_pose_desc': false,
    'yoga_pose_img': false,
    'french_word': false
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
    });
  });
}

// Function to save the checkbox state to chrome.storage.sync
function saveCheckboxState(id) {
  const checkbox = document.getElementById(id);
  let state = {};
  state[id] = checkbox.checked;
  chrome.storage.sync.set(state);
}

// Event listener for checkboxes
function setupListeners() {
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      saveCheckboxState(checkbox.id);

      // Special handling for yoga_pose checkbox
      if (checkbox.id === 'yoga_pose') {
        ['yoga_pose_name', 'yoga_pose_desc', 'yoga_pose_img'].forEach(yogaId => {
          const yogaCheckbox = document.getElementById(yogaId);
          yogaCheckbox.disabled = !checkbox.checked;
          yogaCheckbox.parentElement.style.color = yogaCheckbox.disabled ? 'gray' : 'black';
        });
      }
    });
  });
}

// Initialize the script
document.addEventListener('DOMContentLoaded', function() {
  updateCheckboxState();
  setupListeners();
});
