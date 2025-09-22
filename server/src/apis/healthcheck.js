const router = require('express').Router();

router.get('/health-check',(req,res,next)=>{
    res.status(200).send(`Server is running on port ${process.env.PORT}`);
})

module.exports = router;