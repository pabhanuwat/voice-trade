const express = require('express')
const router = express.Router();
const {price, priceChange, priceChangeSymbol, graph, changeBase, account, trades, signedEndpoint} = require('../controllers/main')

router.get('/price/:symbol?', price)

router.get('/diff/:symbol', priceChangeSymbol)

router.get('/diff-:option/:number?', priceChange)

router.get('/graph/:symbol/:interval?', graph)

router.get('/base/:symbol', changeBase)

router.get('/account', signedEndpoint)

router.get('/trades',signedEndpoint)

module.exports = router;