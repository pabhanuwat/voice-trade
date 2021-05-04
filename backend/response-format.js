/api/price[/:symbol]
[
    {
        symbol: "xxx",
        price: yyy,
    },
    ...
]

OR

{
    symbol: xxx,
    price: yyy
}
/api/diff/:symbol
{
    symbol: "uuu",
    price: vvv,
    diff: xxx
}
/api/diff-(up|down)
{
    symbol: "uuu",
    price: vvv,
    diff: xxx
}
/api/diff-(up|down)-10
[
    {
        symbol: "uuu",
        price: vvv,
        diff: xxx
    },
    ...
]
/api/price/(THB|USDT|USD)
/api/graph/:symbol