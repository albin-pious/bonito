   

const addCouponToUser = async(collection,userId,coupon)=>{

    const currentDate = new Date();
    const expireDate = new Date(coupon.expireDate);

    console.log(`currentDate: ${currentDate} and expireDate: ${expireDate}`);

    if(expireDate < currentDate){
        console.log(`Coupon has expired and won't be added to user.`);
        return;
    }
    
    await collection.updateOne(
        { _id: userId },
        {
            $push: {
                coupon:{coupon}
            }
        }
    )
    console.log('Coupon added to the User.');
}

module.exports= { addCouponToUser }