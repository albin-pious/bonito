

// Cart

function addToCart(productId) {
    const selectedSizeElement = $('input[name="size"]:checked');

    if (!selectedSizeElement.length) {
        alert('Please select size to continue.');
        return;
    }

    const selectedSize = selectedSizeElement.val();
    const url = `/add_to_cart/${productId}?size=${selectedSize}`;

    $.ajax({
        url: url,
        method: 'get',
        success: (response) => {
            if (response.status) {
                let count = $('#cart-count').html();
                count = parseInt(count) + 1;
                $('#cart-count').html(count);
                alert('Product added to Cart');
            }
            if(response.message){
                alert(response.message)
            }
        }
    });
}

// Wishlist
function addToWishlist(productId){
    $.ajax({
        url: '/save_product/'+productId,
        method:'get',
        success:(response)=>{
            if(response.successExist){
                return alert('Product already added to the Wishlist.')
            }
            let savedProductCount = $('#wishlist-count').html();
            savedProductCount = parseInt(savedProductCount)+1;
            $('#wishlist-count').html(savedProductCount)

        }
    })
}

// Search using Debouncing.
const searchResultContainer = document.getElementById('search-results');
function debounce(func,delay){
    let debounceTimer;
    return function(){
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function(){
            return func.apply(context,args)
        }, delay);
    }
}

const debounceHandler = debounce(function(e){
    const search = e.target.value
    
    fetch(`/bonito_search?q=${search}`,{
        method: 'GET'
    })
    .then(response=>{
        console.log('response is ',response);
        if(!response.ok){
            console.log('error occured we need to handle it.');
        }
        return response.json()
    })
    .then(data=>{
        
        searchResultContainer.innerHTML='';
        displayResults(data.result)

    })
    .catch(error=>{
        console.log('error while fetching data: ',error);
    })

},750);

document.getElementById('search-box').addEventListener('input',debounceHandler);

function displayResults(data) {
    console.log('Data Fetched: ', data);

    // Clear previous search results
    searchResultContainer.innerHTML = '';

    for (const category in data) {
        const categoryResults = data[category];

        if (Array.isArray(categoryResults) && categoryResults.length > 0) {
            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} Results`;

            searchResultContainer.appendChild(categoryTitle);

            const list = document.createElement('ul');

            // Iterate through the items in the category
            categoryResults.forEach(item => {
                const listItem = document.createElement('li');

                // Assuming each item has a 'name' property; adjust based on your data structure
                listItem.textContent = item.name || item.title || item.brandName;

                list.appendChild(listItem);
            });

            searchResultContainer.appendChild(list);
        }
    }

    if (searchResultContainer.children.length === 0) {
        searchResultContainer.innerHTML = '<p>No results found.</p>';
    }
}

function showAlert(){
    alert(`Please SignIn to continue.`)
}

