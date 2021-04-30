const express = require('express')
const router = express.Router();
const axios = require('axios')

router.get('/info',async (req, res) => {
    const {data} = await axios.get(process.env.INFO)
    res.json(data)
})

router.get('/depth',async (req, res) => {
    const {data} = await axios.get(process.env.ORDER_BOOK + "?symbol=" + process.env.DEFAULT_SYMBOL)        // todo limit parameter
    res.json(data)
})

router.get('/trades',async (req, res) => {
    const {data} = await axios.get(process.env.TRADE + "?symbol=" + process.env.DEFAULT_SYMBOL)             // todo limit parameter
    res.json(data)
})

router.get('/agg-trades',async (req, res) => {
    const {data} = await axios.get(process.env.AGG_TRADE + "?symbol=" + process.env.DEFAULT_SYMBOL)             // todo limit parameter
    res.json(data)
})

router.get('/candle',async (req, res) => {
    const {data} = await axios.get(process.env.CANDLE + "?symbol=" + process.env.DEFAULT_SYMBOL + "&interval=1d" )             // todo limit parameter
    res.json(data)
})

module.exports = router;