const catchAsync = require('../catchAsync')
const axios = require('axios')

module.exports.price = catchAsync(async ({params}, res) => {
    if (['THB','USD','USDT'].includes(params?.symbol)){
        params.symbols = params.symbol
        // params.base = params.symbol === 'THB' ? 'USD' : 'THB'
        params.access_key = process.env.EXCHANGE_API_KEY
        const {data} = await axios.get(process.env.EXCHANGE,{params})
        return res.json(data)
    }
    const {data} = await axios.get(process.env.PRICE,{params})
    return res.json(data)
})

module.exports.priceChangeSymbol = catchAsync(async ({params}, res) => {
    const {data: {symbol, priceChange, priceChangePercent, lastPrice}} = await axios.get(process.env.PRICE_CHANGE,{params})
    return res.json({symbol, priceChange, priceChangePercent, lastPrice})
})

module.exports.priceChange = catchAsync(async ({params : {option, number}}, res, next) => {
    // ! Invalid path
    if(!['up','down'].includes(option)) return next()

    // * (0) Fetch the data
    let {data} = await axios.get(process.env.PRICE_CHANGE)
    
    // * (1) Prune the data
    data = data.map(({symbol, priceChange,priceChangePercent, lastPrice, ...other}) => ({symbol,priceChange, priceChangePercent, lastPrice}))
    
    // * (2) Sort the data based on parameter
    let descending = option === "up" ? 1 : -1
    data.sort((a,b) => (+b.priceChangePercent - +a.priceChangePercent)*descending)

    // * (3) Return the data based on number
    if (number) res.json(data.slice(0,number))
    else res.json(data[0])
})

module.exports.graph = catchAsync(async ({params}, res) => {
    params.interval= params.interval || process.env.DEFAULT_INTERVAL
    const {data} = await axios.get(process.env.CANDLE, {params})
    res.json(data)
})