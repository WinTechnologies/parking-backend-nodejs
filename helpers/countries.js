const countries = require('country-data-lookup').countries.all;
const currencies = require('country-data-lookup').currencies;

exports.search = keyword => {
    keyword = keyword || '';
    return countries
        .filter(item => item.name.toLowerCase().includes(keyword.toLowerCase()))
        .map(item => {
            return {name: item.name, currency: currencies[item.currencies[0]], flag: item.emoji};
        });
};

exports.searchCurrency = keyword => {
    keyword = keyword || '';
    return currencies.all
        .filter(item => {
            return item.name.toLowerCase().includes(keyword.toLowerCase())
                || item.code.toLowerCase().includes(keyword.toLowerCase())
        })
        .map(item => {
            return {name: item.name, code: item.code, symbol: item.symbol};
        });
};