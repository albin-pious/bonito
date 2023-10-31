

// Cart




function addToCart(productId){
    $.ajax({
        url:'/add_to_cart/'+productId,
        method:'get',
        success:(response)=>{
            if(response.status){
                let count=$('#cart-count').html();
                count = parseInt(count)+1;
                $('#cart-count').html(count)
            }
            
        }
    })
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



