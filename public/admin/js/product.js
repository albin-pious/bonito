// Global Variables
let croppedImages = [];
let croppers = [];
let uploadCount = 0;
let currentCropper =null;
let cropper;

// utility function
function calculateTotalUnits() {
  let totalUnits = 0;

  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
      if (checkbox.checked) {
          const size = checkbox.value.toLowerCase();
          const inputField = document.getElementById('unit_' + size);
          if (inputField && inputField.value) {
              totalUnits += parseInt(inputField.value) || 0;
          }
      }
  });

  return totalUnits;
}

// Event handlers
function toggleInput(checkboxId, inputId) {
  const checkbox = document.getElementById(checkboxId);
  const inputField = document.getElementById(inputId);
  const stockInput = document.getElementById('stock');

  if (checkbox && inputField) {
    inputField.disabled = !checkbox.checked;

    if (!checkbox.checked) {
      // If unchecked, subtract the value and clear the input field
      const units = parseInt(inputField.value) || 0;
      const totalUnits = parseInt(stockInput.value) || 0;
      stockInput.value = totalUnits - units;
      inputField.value = '';
    }

    // Listen for input and change events on the input field
    inputField.addEventListener('input', updateTotal);
    inputField.addEventListener('change', updateTotal);
    calculateTotalUnits();
  }
}

function updateTotal() {
    const totalUnits = calculateTotalUnits();
    const stockInput = document.getElementById('stock');
    if (stockInput) {
        stockInput.value = totalUnits;
    }
}

// Image handling functions

function initCropper(imgElement, index) {
  const cropper = new Cropper(imgElement, {
    aspectRatio: 1,
    viewMode: 1,
    ready: function () {
      // Enable the crop button once Cropper is ready
      const cropButton = document.querySelector(`#cropButton${index}`);
      if (cropButton) {
        cropButton.disabled = false;
        cropButton.addEventListener('click', function () {
          cropImage(imgElement, index, cropper);
        });
      }
    }
  });
  croppers[index] = cropper;
}

// Function to toggle Cropper canvas visibility for a specific image
function toggleCropperCanvas(imgElement, index) {
  const cropper = croppers[index];
  if (cropper) {
    const canvas = cropper.getCroppedCanvas();
    const cropSection = document.getElementById(`cropSection${index}`);
    cropSection.innerHTML = ''; // Clear the crop section
    if (canvas) {
      cropSection.appendChild(canvas);
      canvas.style.display = 'block'; // Show the cropped canvas
    }
  }
}

function cropImage(imgElement, index, cropper) {
  const croppedCanvas = cropper.getCroppedCanvas();
  if (croppedCanvas) {
    const croppedDataUrl = croppedCanvas.toDataURL('image/jpeg');
    // Update the image preview with the cropped image
    imgElement.src = croppedDataUrl;
    toggleCropOption(imgElement);  // Hide crop option after cropping
  }
}


function openFileInput(){
  document.getElementById('fileInput').click()
}

function handleImageUpload(event) {
  const files = event.target.files;
  const uploadedImagesContainer = document.getElementById('uploadedImagesContainer');
  uploadedImagesContainer.innerHTML='';
  // Reset the upload count and cropped images array when handling new uploads
  uploadCount = 0;
  croppedImages.length = 0;
  croppers = []; 

  for (let i = 0; i < files.length; i++) {
    if(uploadCount>=3){
      alert('Image upload limit is reached.');
      break;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      const imgElement = document.createElement('img');
      imgElement.src = e.target.result;
      imgElement.classList.add('image-preview','img-fluid');
      imgElement.style.maxWidth = '100px';
      imgElement.style.maxHeight = '100px';
      imgElement.dataset.index = i; // Set the dataset index for the image

      const imageContainer = document.createElement('div');
      imageContainer.classList.add('image-crop-container');
      imageContainer.appendChild(imgElement);

      // Event listner to handle image click.
      imgElement.addEventListener('click',function(){
          showCropSection(imgElement,i)
      });
      uploadedImagesContainer.appendChild(imageContainer);
      uploadCount++;
    };  
      
    reader.readAsDataURL(files[i]);    
  }

  if(uploadCount>=3){
    document.getElementById('fileInput').disabled = true;
  }
  cropImages();
}

function showCropSection(imgElement,index) {
  let cropButton = document.createElement('button');
  cropButton.id = `cropButton${index}`;
  cropButton.classList.add('btn', 'btn-primary', 'mx-auto', 'crop-button');
  cropButton.textContent = 'Crop Image';
  cropButton.addEventListener('click', function () {
    cropImage(imgElement,index);
  });

  const cropSection = document.getElementById('cropSection');
  cropSection.innerHTML='';
  cropSection.appendChild(cropButton);

  // Initialize Cropper for this image
  initCropper(imgElement,index)
}

function hideCropSection() {
  const cropSection = document.getElementById('cropSection');
  cropSection.innerHTML = ''; // Clear the crop section
  cropper.destroy(); // Destroy the Cropper instance
  cropper = null; // Reset the Cropper instance
}

function cropImages() {
  const imagePreviews = document.querySelectorAll('#uploadedImagesContainer img');

  // Log the array before cropping
  console.log('Array before cropping:', croppedImages);

  imagePreviews.forEach((imgElement, index) => {
    const cropper = croppers[index];
    if (cropper) {
      const croppedCanvas = cropper.getCroppedCanvas();
      if (croppedCanvas) {
        const croppedDataUrl = croppedCanvas.toDataURL('image/jpeg');
        // Update the image preview with the cropped image
        imgElement.src = croppedDataUrl;
        toggleCropOption(imgElement);  // Hide crop option after cropping
        croppedImages[index] = croppedDataUrl; // Update the array
        const form = document.getElementById('product-form');
        const formData = new FormData(form);
        formData.append('images',croppedDataUrl)
      }
    }
  });

  // Log the array after cropping
  console.log('Array after cropping:', croppedImages);
}

function sendCroppedImagesToServer() {
  const croppedImagesInput = document.getElementById('croppedImagesStore');
  croppedImagesInput.value = JSON.stringify(croppedImages); // Assuming croppedImages is an array of cropped image data URLs

  // Submit the form
  const productForm = document.getElementById('productForm');
  productForm.submit();
}

if (croppedImages.length === 3) {
  // All images cropped, proceed to send them to the server
  sendCroppedImagesToServer();
}

function showCropper(imgElement) {
  cropper = new Cropper(imgElement.nextElementSibling.querySelector('.cropper-canvas'), {
    aspectRatio: 1,
    viewMode: 1,
  });
}

// Function to enable/disable "Crop Images" button based on image selection
function toggleCropButton() {
  const fileInput = document.getElementById('fileInput');
  const cropButton = document.getElementById('cropButton');

  if (fileInput.files.length > 0) {
    cropButton.disabled = false; // Enable "Crop Images" button
  } else {
    cropButton.disabled = true; // Disable "Crop Images" button
  }
}

function toggleCropSection(imgElement){
  const cropSection = document.getElementById('cropSection');
  // Hide the current crop section if any
  if(currentCropper && currentCropper.image === imgElement){
    hideCropSection();
    return;
  }
  showCropSection(imgElement);
}

function toggleCropOption(imgElement) {
  if (!imgElement) {
    console.error('Invalid imgElement:', imgElement);
    return;
  }

  // Check if the crop option is visible for the clicked image
  const isCropVisible = imgElement.classList.contains('crop-visible');

  // Hide the crop option if it's visible, else show it
  if (isCropVisible) {
    imgElement.classList.remove('crop-visible');
    // Hide the crop button
    const nextSibling = imgElement.nextElementSibling;
    if (nextSibling) {
      nextSibling.style.display = 'none';
    }
  } else {
    imgElement.classList.add('crop-visible');
    // Show the crop button
    const nextSibling = imgElement.nextElementSibling;
    if (nextSibling) {
      nextSibling.style.display = 'block';
    }
  }
}

function destroyCropper() {
  // Destroy the Cropper instance
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
}

// DOM manipulation and Event Listeners
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('name').addEventListener('input', validateForm);
  document.getElementById('brand').addEventListener('change', validateForm);
  document.getElementsByName('gender').forEach(element => element.addEventListener('change', validateForm));
  document.getElementById('price').addEventListener('input', validateForm);
  document.getElementById('offer').addEventListener('input', validateForm);
  document.getElementById('fileInput').addEventListener('change', validateForm);
})

document.getElementById('fileInput').addEventListener('change', handleImageUpload);
document.getElementById('cropButton').addEventListener('click', cropImages);

document.getElementById('uploadedImagesContainer').addEventListener('click', function(event) {
  if (event.target && event.target.matches('img.croppable-image')) {
    toggleCropOption(event.target);
  }
});

document.getElementById('fileInput').addEventListener('change', function (event) {
  const files = event.target.files;
  const uploadedImagesContainer = document.getElementById('uploadedImagesContainer');
  uploadedImagesContainer.innerHTML = ''; // Clear the existing content
  croppers = []; // Reset the Cropper instances

  for (let i = 0; i < files.length; i++) {
    const reader = new FileReader();

    reader.onload = function (e) {
      const imgElement = document.createElement('img');
      imgElement.src = e.target.result;
      imgElement.classList.add('croppable-image');
      imgElement.classList.add('img-fluid');
      imgElement.style.maxWidth = '100px';
      imgElement.style.maxHeight = '100px';

      const imageContainer = document.createElement('div');
      imageContainer.classList.add('image-crop-container');
      imageContainer.appendChild(imgElement);

      // Event listner to handle image click
      imgElement.addEventListener('click',function() {
        toggleCropSection(imgElement);
        // Remove the "Crop" button from the previously clicked image, if any.
        const prevCropButton = uploadedImagesContainer.querySelector('.crop-button');
        if(prevCropButton){
          prevCropButton.remove();
        }

        
      })

      // Initialize Cropper.js for this image
      const cropper = new Cropper(imgElement, {
        aspectRatio: 1,
        viewMode: 1,
        // You can configure other Cropper.js options here
      });

      const cropButton = document.getElementById('cropButton');
      cropButton.classList.add('btn','btn-primary','mx-auto','crop-button');
      cropButton.textContent = 'Crop Image';
      cropButton.addEventListener('click',cropImages);
      imageContainer.appendChild(cropButton);
      croppers.push(cropper);
      uploadedImagesContainer.appendChild(imageContainer);
    };

    reader.readAsDataURL(files[i]);
  }

  toggleCropButton(); // Enable/disable "Crop Images" button based on image selection
});

document.getElementById('brand').addEventListener('change', function() {
  const brandId = this.value; // Get the selected brand ID
  const categoryDropdown = document.getElementById('category');

  // Clear existing options
  categoryDropdown.innerHTML = '<option selected>Select category</option>';

  // Fetch categories for the selected brand and populate the category dropdown
  fetch(`/admin/getcategories_forbrand/${brandId}`)
    .then(response => response.json())
    .then(categories => {
      console.log('Response from server: ', categories);
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.categoryId;  // Assuming category.categoryId is the correct property
        option.textContent = category.categoryName;
        categoryDropdown.appendChild(option);
      });
    })
    .catch(error => console.error('Error fetching categories:', error));
});

document.getElementById('category').addEventListener('change', function() {
  const categoryId = this.value;  // Get the selected category ID
  console.log('Selected category ID:', categoryId);
});

// Product form validation

function validateProductName() {
    const name = document.getElementById('name').value;
    return name && name.trim() !== '';
  }
  
  function validateBrand() {
    const brand = document.getElementById('brand').value;
    return brand !== 'Select Brand';
  }
  
  function validateGender() {
    const genderElements = document.getElementsByName('gender');
    for (const genderElement of genderElements) {
      if (genderElement.checked) {
        return true;
      }
    }
    return false;
  }
  
  function validatePrice() {
    const price = document.getElementById('price').value;
    return !isNaN(price) && parseFloat(price) >= 0;
  }
  
  function validateOffer() {
    const offer = document.getElementById('offer').value;
    return !isNaN(offer) && parseFloat(offer) >= 0 && parseFloat(offer) <= 100;
  }
  
  function validateImages() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
  
    return files && files.length <= 3;
  }
  
  function validateForm() {
    const isNameValid = validateProductName();
    const isBrandValid = validateBrand();
    const isGenderValid = validateGender();
    const isPriceValid = validatePrice();
    const isOfferValid = validateOffer();
    const areImagesValid = validateImages();
 
    document.getElementById('submitBtn').disabled =
      !(isNameValid  && isBrandValid && isGenderValid && isPriceValid && isOfferValid && areImagesValid);
  }





  



