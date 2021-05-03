const express = require('express')
const router = express.Router();
const axios = require('axios')
const CryptoJS = require('crypto-js')
const catchAsync = require('../catchAsync')
const {price, priceChange, priceChangeSymbol, graph, changeBase, account, trades} = require('../controllers/main')
const defaultParams = {
    params: {
        symbol: process.env.DEFAULT_SYMBOL
    }
}


router.get('/price/:symbol?', price)

router.get('/diff/:symbol', priceChangeSymbol)

router.get('/diff-:option/:number?', priceChange)

router.get('/graph/:symbol/:interval?', graph)

router.get('/base/:symbol', changeBase)

router.get('/account', account)
S
router.get('/info',async (req, res) => {
    const {data} = await axios.get(process.env.INFO)
    res.json(data)
})

router.get('/depth',async (req, res) => {
    const {data} = await axios.get(process.env.ORDER_BOOK, defaultParams)        // todo limit parameter
    res.json(data)
})

router.get('/trades',trades)

router.get('/agg-trades',async (req, res) => {
    const {data} = await axios.get(process.env.AGG_TRADE, defaultParams)             // todo limit parameter
    res.json(data)
})

// router.get('/price',async (req, res) => {
//     const {data} = await axios.get(process.env.PRICE)             // todo limit parameter
//     res.json(data)
// })



module.exports = router;