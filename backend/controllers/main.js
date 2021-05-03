const catchAsync = require('../catchAsync')
const axios = require('axios')
const CryptoJS = require('crypto-js')
const fs = require("fs");
const os = require("os");

async function convertCurrency(inCurrency, outCurrency) { // inCurrency -> outCurreny 
    /**
     * inCurrency: string
     * outCurrency: string
     */
    const { data: data1 } = await axios.get(process.env.EXCHANGE, {
        params: {
            symbol: inCurrency,
            access_key: process.env.EXCHANGE_API_KEY
        }
    }) // 1 EUR -> ?? symbol
    const { data: data2 } = await axios.get(process.env.PRICE, { params: { symbol: `EUR${outCurrency}` } })
    return (1 / data1.rates[inCurrency]) * data2.price
}

module.exports.price = async ({ params }, res) => {
    // * for THB USD USDT
    if (['THB', 'USD', 'USDT'].includes(params?.symbol)) {
        params.symbols = params.symbol
        // params.base = params.symbol === 'THB' ? 'USD' : 'THB'
        params.access_key = process.env.EXCHANGE_API_KEY
        const { data: data1 } = await axios.get(process.env.EXCHANGE, { params }) // 1 EUR -> ?? symbol
        const { data: data2 } = await axios.get(process.env.PRICE, { params: { symbol: "EURUSDT" } }) // 1 EUR -> ?? USDT
        let one_euro_in_symbol = data1.rates[params.symbol]
        let one_symbol_in_euro = 1 / one_euro_in_symbol
        let output = data2.price * one_symbol_in_euro // THB in USDT
        // console.log(await convertCurrency("USD", "THB"))
        switch (params.symbol) { // Bam says USD = USDT
            case 'THB': // to THB
                if (process.env.SYMBOL == 'USD') {
                    // USD -> EUR
                    // EUR -> THB
                    return res.json({
                        price: 
                    })
                } else if (process.env.SYMBOL == 'USDT') {

                }

    

                break
            case 'USD':
                if (process.env.SYMBOL == 'THB') {

                } else if (process.env.SYMBOL == 'USDT') {

                }
                break
            case 'USDT':
                if (process.env.SYMBOL == 'USD') {

                } else if (process.env.SYMBOL == 'THB') {

                }
                break
        }
        return res.json(data1)
    }

    // ตอนนี้นะ ข้อ 5 ราคา ไทยบาท | usd | usdt
    // base ไทยบาท | usd | usdt
    // process.env.SYMBOL
    // switch (process.env.SYMBOL){
    //     case 'THB':
    //         asdfkljka
    //     case 'US'
    // }
    // ถามราคา ไทยบาท โดย base = usd
    // ถามราคา ไทยบาท โดย base = usdt

    // ถามราคา usd โดย base = ไทยบาท
    // ถามราคา usd โดย base = usdt

    // ถามราคา usdt โดย base = ไทยบาท
    // ถามราคา usdt โดย base = usd
    // * for crypto symbol
    if (params.symbol) params.symbol = params.symbol + process.env.SYMBOL
    const { data } = await axios.get(process.env.PRICE, { params })
    return res.json(data)
}

module.exports.priceChangeSymbol = catchAsync(async ({ params }, res) => {
    const { data: { symbol, priceChange, priceChangePercent, lastPrice } } = await axios.get(process.env.PRICE_CHANGE, { params })
    return res.json({ symbol, priceChange, priceChangePercent, lastPrice })
})

module.exports.priceChange = catchAsync(async ({ params: { option, number } }, res, next) => {
    // ! Invalid path
    if (!['up', 'down'].includes(option)) return next()

    // * (0) Fetch the data
    let { data } = await axios.get(process.env.PRICE_CHANGE)

    // * (1) Prune the data
    data = data.map(({ symbol, priceChange, priceChangePercent, lastPrice, ...other }) => ({ symbol, priceChange, priceChangePercent, lastPrice }))

    // * (2) Sort the data based on parameter
    let descending = option === "up" ? 1 : -1
    data.sort((a, b) => (+b.priceChangePercent - +a.priceChangePercent) * descending)

    // * (3) Return the data based on number
    if (number) res.json(data.slice(0, number))
    else res.json(data[0])
})

module.exports.graph = catchAsync(async ({ params }, res) => {
    params.interval = params.interval || process.env.DEFAULT_INTERVAL
    const { data } = await axios.get(process.env.CANDLE, { params })
    res.json(data)
})

module.exports.account = catchAsync(async (req, res) => {
    // * (1) Create timestamp
    const now = (new Date()).valueOf()
    // * (2) Create params
    const params = { timestamp: now }
    // * (3) Create signature
    const hash = CryptoJS.HmacSHA256(`timestamp=${now}`, process.env.API_SECRET)
    const signature = CryptoJS.enc.Hex.stringify(hash);
    params.signature = signature
    try {
        const { data } = await axios.get(process.env.ACCOUNT, { params, headers: { "X-MBX-APIKEY": process.env.API_KEY } })
        res.json(data)
    }
    catch (e) {
        res.send("error")
    }
})

module.exports.trades = async (req, res) => {
    console.log("TRADES")
    // * (1) Create timestamp
    const now = (new Date()).valueOf()
    // * (2) Create params
    const params = { timestamp: now }
    // * (3) Create signature
    const hash = CryptoJS.HmacSHA256(`timestamp=${now}`, process.env.API_SECRET)
    const signature = CryptoJS.enc.Hex.stringify(hash);
    params.signature = signature
    console.log(params.signature)
    try {
        const { data } = await axios.get(process.env.OPEN_ORDER, { params, headers: { "X-MBX-APIKEY": process.env.API_KEY } })
        res.json(data)
    }
    catch (e) {
        console.log(e)
        res.send("error")
    }
}


module.exports.changeBase = (req, res, next) => {
    const { symbol } = req.params
    if (!['THB', 'USD', 'USDT'].includes(symbol)) next();
    setEnvValue("SYMBOL", symbol)
    res.status(200).json({ base: symbol })
}

function setEnvValue(key, value) {

    // read file from hdd & split if from a linebreak to a array
    const ENV_VARS = fs.readFileSync("./.env", "utf8").split(os.EOL);

    // find the env we want based on the key
    const target = ENV_VARS.indexOf(ENV_VARS.find((line) => {
        return line.match(new RegExp(key));
    }));

    // replace the key/value with the new value
    ENV_VARS.splice(target, 1, `${key}=${value}`);

    // write everything back to the file system
    fs.writeFileSync("./.env", ENV_VARS.join(os.EOL));

}
