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


document.addEventListener('DOMContentLoaded',()=>{
    console.log('Setting Up event listner for brand dropdown.');
    document.getElementById('brand').addEventListener('change', function() {
        console.log('hai');
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
})
  
document.getElementById('category').addEventListener('change', function() {
    const categoryId = this.value;  // Get the selected category ID
    console.log('Selected category ID:', categoryId);
});