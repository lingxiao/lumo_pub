/*
  @Package: functions/utils.js
  @Date   : April 15th, 2021
  @Author : Xiao Ling   
*/



/******************************************************
 print
******************************************************/

exports.print = (xs) => {
	if (Array.isArray(xs)){
		var str = ""
		for (let x of xs){
			str = `${str} ${x}`
		}
		console.log(`\n\n ${str} \n\n`)	
	} else {
		console.log(`\n\n ${xs} \n\n`)	
	}
}

/******************************************************
  compensate for no typesystem
******************************************************/

const illValued = (x) => {
	if (x === null || x === undefined){
		return true 
	} else {
		return false
	}
}

exports.illValued = illValued;

const trivialString = (x) => {
	if (x === null || x === undefined || x === "" || x === " "){
		return true 
	} else {		
		return false
	}
}

exports.trivialString  = trivialString;


exports.trivialProps = (props, fn) => {
	if (props === null || props === undefined || props === {} ){
		return true
	} else if ( fn === null || fn === undefined || fn === "" ){
		return true
	} else if ( props[fn] === null || props[fn] === undefined ) {
		return true
	} else {
		return false
	}
}

exports.trivialObj = (obj) => {
	return (obj === undefined || obj === null || obj === {})
}

exports.trivialNum = (n) => {
	return (n === undefined || n === null || isNaN(n) )
}



exports.trivialArray = (xs) => {
	return (xs === undefined || xs === null || Array.isArray(xs) === false)
}



exports.toWellFormedObject = (obj) => {

	if (illValued(obj)){
		return {}
	}

	var res = {};
    for ( var key in obj ){
        let v = obj[key]
        if ( !illValued(v) ){
            res[key] = v;
        }
    }
    return res;
}


/******************************************************
	@eth to wei
******************************************************/

exports.eth_to_wei = (eth) => {
	if (eth === null || eth === undefined || isNaN(eth)){
		return 0
	} else {
		return eth * 1000000000000000000
	}
}


exports.wei_to_eth_round = (wei) => {
	if (wei === null || wei === undefined || isNaN(wei)){
		return 0
	} else {
		return (wei/1000000000000000000).toFixed(4)
	}
}

exports.str_to_float = (str) => {
	if (str === null || str === undefined || str.trim() === ""){
		return 0
	} else {
		let num = parseFloat(str,10)
		if ( isNaN(num) ){
			return 0
		} else {
			return num
		}
	}
}

exports.str_to_int = (str) => {

	if (Number.isInteger(str)){
		return str
	} else if (str === null || str === undefined || str.trim() === ""){
		return 0
	} else {
		let num = parseInt(str)
		if ( isNaN(num) ){
			return 0
		} else {
			return num
		}
	}
}


exports.str_to_boolean = (str) => {
	if (typeof(str) === "string"){
		return str === "true";
	} else if ( typeof(str) === 'boolean' ){
		return str;
	} else {
		return false;
	}
}

exports.rand_num = (min,max) => {
	return Math.random() * (max - min) + min;
}

function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}
exports.randomIntFromInterval = randomIntFromInterval

exports.force_to_num = (n, baseline) => {
	let b = (isNaN(baseline) || baseline === undefined || baseline === null ) 
		? 0 
		: Number(baseline)
	if (isNaN(n)){
		return b 
	} else {
		if (typeof n === 'number') {
			return Number(n)
		} else {
			let bn = Number(n);
			if ( typeof bn === 'number' ){
				return bn
			} else {
				return b
			}
		}
	}
}



/**
 * 
 * @use: given address of form "0xd2590aea87df038226497ac45d54d1ea72045471"
 *       reduce it to the first `n` and last `m` chars
 * 
 **/ 
function contractMetamaskAddress({ pk, n, m }){

	if ( trivialString(pk) ){
		return ""
	}

	let _n = typeof n === 'number' ? n : 5;
	let _m = typeof m === 'number' ? m : 5;

	if ( pk.length <= _n + _m ){
		return pk;
	}

	let head = pk.slice(0,_n)
	let tail = pk.slice(-1 *_m);
	return `${head}...${tail}`

}

exports.contractMetamaskAddress = contractMetamaskAddress;

/******************************************************
	time  
******************************************************/

/**
 * 
 * @use: day light saving time detection 
 * @Source: https://stackoverflow.com/questions/11887934/how-to-check-if-dst-daylight-saving-time-is-in-effect-and-if-so-the-offset#:~:text=The%20getTimezoneOffset()%20method%20in,5%20hours%20difference%20from%20zero.
 * 
 * 
 **/ 
Date.prototype.stdTimezoneOffset = function () {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.isDstObserved = function () {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
}



// @Get now timestamp in seconds from 1972
exports.swiftNow = () => {
	return Math.round(Date.now()/1000)
}


// @Get now timestamp in seconds from 1972
exports.swiftPast = () => {
	let now = Math.round(Date.now()/1000)
	return now - now
}


// @Use: convert swift timestamp to millisecondsd since 1972
exports.fromSwiftTime = (t) => {
	return t * 1000
}

// @use: given swift timestamp, pretty print `MM DD YYYY HH:MM`	
exports.ppSwiftTime = (t) => {
	
	let dt = new Date(t * 1000);

	let datetime = dt.toDateString();
	let time = dt.toLocaleTimeString();

	var datetime_ls = datetime.split(" ");
	datetime_ls.shift()
	let prefix = datetime_ls.join(" ")

	return `${prefix}, ${time}`
}

//@use: convert seconds to hr, min, second
//      note this cannot be negative
exports.ppSwiftTimeToHrMinSec = (seconds) => {

	if (seconds === null || seconds === undefined || isNaN(seconds)){

		return [0,0,0]

	} else {

		let ls = [3600, 60]
			.reduceRight(
				(p, b) => r => [Math.floor(r / b)].concat(p(r % b)),
				r => [r]
			)(seconds)
			.map(a => a.toString().padStart(2, '0'))
			.join('_');

		let xs = ls.split('_')

		if (xs.length < 3){

			return [0,0,0]

		} else {

			let well_behaved = (n) => {
				return isNaN(n) 
					? 0
					: n < 0 ? 0 : n
			}

			let hr  = parseInt(xs[0])
			let min = parseInt(xs[1])
			let sec = parseInt(xs[2])

			return [ well_behaved(hr), well_behaved(min), well_behaved(sec) ]
		}

	}

}


/**
 * 
 * @use: convert vernacular date obj to timeStamp in swift TimeStampe format
 * @Source: https://stackoverflow.com/questions/9756120/how-do-i-get-a-utc-timestamp-in-javascript
 * @Params:
 *   - yr:  [Number] 2022
 *   - mo:  [Number] 12
 *   - day: [Number] 3
 *   - hr   [Number] 23  must be in military format in EST timezone
 *   - min  [Number] 8  12:0 must be < 60
 *   
 * 
 **/
exports.vernacularDateInESTToSwiftTimeStamp = ({ yr, mo, day, hr, min }) => {

	const trivialNum = (n) => {
		return (n === undefined || n === null || isNaN(n) )
	}

	const today = new Date();
	const offset_hours = today.isDstObserved() ? 4 : 5;


	// format timezone
	let _yr  = trivialNum(yr)  ? 2022 : yr;
	let _mo  = trivialNum(mo)  ? 1    : mo;
	let _day = trivialNum(day) ? 1    : day;
	let _hr  = trivialNum(hr)  ? 0    : hr;
	let _min = trivialNum(min) ? 0    : min;

	let _yr1  = Number(_yr)  < 100 ? (_yr + 2000) : _yr;
	let _mo1  = Number(_mo)  < 10  ? `0${Number(_mo)}`  : _mo
	let _day1 = Number(_day) < 10  ? `0${Number(_day)}` : _day
	let _hr1  = Number(_hr)  < 10  ? `0${Number(_hr)}`  : _hr
	let _min1 = Number(_min) < 10  ? `0${Number(_min)}` : _min

	let str  = `${_yr1}-${_mo1}-${_day1}T${_hr1}:${_min1}:00`;  // format in EST
	let dt   = Date.parse(str);                     //  timestamp in EST
	let dt_in_utc = dt/1000 + offset_hours*60*60   //   timestamp in UTC

	return parseInt(dt_in_utc);

}

/**
 * 
 * @use: pretty print UTC timestamp in ESt
 * 
 **/ 
exports.prettyPrintUtcTimeStampInESTVernacular = (time) => {

	const today = new Date();
	const offset_hours = today.isDstObserved() ? 4 : 5;
	let dt_in_est = (time - offset_hours*60*60)*1000;
	let str = new Date(dt_in_est).toString();
	let est_str = str.replace('GMT+0000 (Coordinated Universal Time)', 'EST');
	return est_str;
}



/******************************************************
	string
******************************************************/

const reverseString = (str) => {
	var newString = "";
	for (var i = str.length - 1; i >= 0; i--) {
		newString += str[i];
	}
	return newString;
}


// @use: dev mode dummy user.
exports.generatePassword = (email) => {  
	const prefix = "64439638952027"
	const suffix = "1904383418681"
	const _root  = reverseString(email)
	return `${prefix}_${_root}_${suffix}`
}


function numHex(s){

    var a = s.toString(16);
    if ((a.length % 2) > 0) {
        a = "0" + a;
    }
    return a;
}

function strHex(s){

    var a = "";
    for (var i=0; i<s.length; i++) {
    	let c = s.charCodeAt(i)
        a = a + numHex(s.charCodeAt(i));
    }
    
    return a;
}


exports.strHex = strHex

/******************************************************
	utility functions
******************************************************/

function range(start, stop, step) {

	if (stop < start){
		return []
	} else {
	    var a = [start], b = start;
	    while (b < stop) {
	        a.push(b += step || 1);
	    }
	    return a;
	}
}

exports.range = (a,b) => {
	return range(a,b,1)
}


function getMultipleRandom(arr, num) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}
exports.getMultipleRandom = getMultipleRandom;


function generateRandom(maxLimit = 100){
  let rand = Math.random() * maxLimit;
  rand = Math.floor(rand); 
  return rand;
}

exports.generateRandom = generateRandom;

