const Rating = require ("../model/rating")

const addCustomerReview =async(req,res)=>{
    // res.send(req.body.data);
    let currentTime = new Date().getTime();
    const IST_OFFSET = (5.5*60*60*1000);
    currentTime = currentTime + IST_OFFSET;
    const data = {...(req.body.data),date: new Date(currentTime)};
    try{
      const doc = new Rating(data);
      const response = await doc.save();
      res.json(response);
    }catch(err){
       res.status(500).send("Something Went Wrong");
       console.log(err);
    }
}

module.exports = addCustomerReview