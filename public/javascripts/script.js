

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



