const catchAsync = require('../catchAsync')
const axios = require('axios')
axios.defaults.headers.common["X-CMC_PRO_API_KEY"] = process.env.CMC_API_KEY
axios.defaults.headers.common["X-MBX-APIKEY"] = process.env.API_KEY
const CryptoJS = require('crypto-js')
const fs = require("fs");
const os = require("os");
const mapping = require('../idMap.json')

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
    if (['THB', 'USD'].includes(params?.symbol)) {
        if (process.env.SYMBOL !== 'USDT') {
            const {data} = await axios.get(process.env.PAIR + `/${params.symbol}/${process.env.SYMBOL}`)
            return res.json({price: data.conversion_rate})
        }
        else {
            let {data: {data}} = await axios.get(process.env.CMC_QUOTES, {params: {convert_id: process.env[params.symbol], id: process.env.USDT}} )
            data = (({[process.env.USDT]:{quote:{[process.env[params.symbol]] : {price}}}}) => ({price: 1/price}))(data);
            res.json(data)
        }
    }

    params = {...params, convert_id: process.env.SYMBOL_ID, id: mapping[params.symbol]?.id}
    const path = params.id ? process.env.CMC_QUOTES : process.env.CMC_LISTINGS
    params.symbol && delete params.symbol
    let {data: {data}} = await axios.get(path, {params} )
    // * Prune the data
    data.length ? data = data.map(({name,symbol,quote:{[process.env.SYMBOL_ID] : {price}}}) => ({name,symbol,price}))
                : data = (({[params.id]:{name,symbol,quote:{[process.env.SYMBOL_ID] : {price}}}}) => ({name,symbol,price}))(data);
    return res.json(data)
}

module.exports.priceChangeSymbol = catchAsync(async ({ params }, res) => {
    // const { data: { symbol, priceChange, priceChangePercent, lastPrice } } = await axios.get(process.env.PRICE_CHANGE, { params })
    // return res.json({ symbol, priceChange, priceChangePercent, lastPrice })
    params = {  
        id: mapping[params.symbol].id,
        convert_id: process.env.SYMBOL_ID,
    }
    let {data: {data}} = await axios.get(process.env.CMC_QUOTES, {params} )
    data = (({[params.id]:{name,symbol,quote:{[process.env.SYMBOL_ID] : {price,percent_change_24h:percentChange}}}}) => ({name,symbol,price,percentChange}))(data)
    return res.json(data)
})

module.exports.priceChange = catchAsync(async ({ params: { option, number } }, res, next) => {
    // ! Invalid path
    if (!['up', 'down'].includes(option)) return next()
    let params = {  
        convert_id: process.env.SYMBOL_ID,
        sort: "percent_change_24h",
        sort_dir: option === 'up' ? 'desc' : 'asc',
    }
    let {data: {data}} = await axios.get(process.env.CMC_LISTINGS, {params} )
    data = data.map(({name,symbol,quote:{[process.env.SYMBOL_ID] : {price,percent_change_24h:percentChange}}}) => ({name,symbol,price,percentChange}))
    if (number) return res.json(data.slice(0, number))
    else return res.json(data[0])
})

module.exports.graph = catchAsync(async ({ params }, res) => {
    params.interval = params.interval || process.env.DEFAULT_INTERVAL
    params.symbol = params.symbol + "USDT"
    const { data } = await axios.get(process.env.CANDLE, { params })
    res.json(data)
})

module.exports.signedEndpoint = async (req, res) => {
    const now = (new Date()).valueOf()
    const hash = CryptoJS.HmacSHA256(`timestamp=${now}`, process.env.API_SECRET)
    const signature = CryptoJS.enc.Hex.stringify(hash);
    const params = { timestamp: now, signature }
    const { data } = await axios.get(req.path === '/account' ? process.env.ACCOUNT : process.env.OPEN_ORDER, { params})
    res.json(data)
}


module.exports.changeBase = (req, res, next) => {
    const { symbol } = req.params
    if (!['THB', 'USD', 'USDT'].includes(symbol)) next();
    setEnvValue("SYMBOL_ID", process.env[symbol])
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

    // force server restart
    fs.writeFileSync("./dummy.js", fs.readFileSync("./dummy.js", "utf8"));

}

