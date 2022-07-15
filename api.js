'use strict'
const axios = require('axios');
const AUD_UUID = 'OEomm4hQzk_M'

var coinOptions = {
    method: 'GET',
    url: 'https://coinranking1.p.rapidapi.com/coins',
    params: {
      referenceCurrencyUuid: AUD_UUID,
      timePeriod: '24h',
      tiers: '1',
      orderBy: 'marketCap',
      orderDirection: 'desc',
      limit: '100',
      offset: '0'
    },
    headers: {
      'x-rapidapi-host': 'coinranking1.p.rapidapi.com',
      'x-rapidapi-key': 'd73d966e0emsh98c94c8eb1443c4p1740ccjsn300fa6bdbd83'
    }
  };

var refCurrOptions = {
    method: 'GET',
    url: 'https://coinranking1.p.rapidapi.com/reference-currencies',
    headers: {
      'x-rapidapi-host': 'coinranking1.p.rapidapi.com',
      'x-rapidapi-key': 'd73d966e0emsh98c94c8eb1443c4p1740ccjsn300fa6bdbd83'
    }
  };

async function get_ref_curr(){
	let req = axios.request(refCurrOptions).then(function (response) {
		return response
	})
	return req
}



async function api_call(){
	let req = axios.request(coinOptions).then(function (response) {
		return response.data
	}).catch(function (error) {
		console.error(error);
	});
	let test = req
	return test
}

module.exports = {
	api_call
}