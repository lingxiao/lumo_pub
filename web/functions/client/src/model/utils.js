/*
	@Package: utils.js
	@Date   : Dec 16th, 2021
	@Author : Xiao Ling   
*/


import Resizer from "react-image-file-resizer";

/******************************************************
 print
******************************************************/

const print = (xs) => {
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

/**
 * 
 * @use: trivial fn
 * 
 **/ 
function cap(params){
	return;
}


const illValued = (x) => {
	if (x === null || x === undefined){
		return true 
	} else {
		return false
	}
}

const trivialString = (x) => {
	if (x === null || x === undefined || x === "" || x === " "){
		return true 
	} else {    
		return false
	}
}

const trivialProps = (props, fn) => {
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

const trivialObj = (obj) => {
	return (obj === undefined || obj === null || obj === {})
}

const trivialNum = (n) => {
	return (n === undefined || n === null || isNaN(n) )
}


const trivialArray = (xs) => {
	return (xs === undefined || xs === null || Array.isArray(xs) === false)
}


function isValidHttpUrl(string) {

	if ( trivialString(string) ){
		return false;
	}

  let url;
  
  try {
    url = new URL(string);
  } catch (_) {
    return false;  
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

const toWellFormedObject = (obj) => {

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

const handleInputInNumbers = (e) => {
	if ( trivialProps(e,'target') || trivialProps(e.target, 'value') ){
		return 0;
	} else if ( trivialString(e.target.value) ){
		return 0;
	} else {
	    const onlyNums = e.target.value.replace(/[^0-9]/g, '');
	    if (onlyNums.length < 10) {
	    	return onlyNums;
	    } else if (onlyNums.length === 10) {
	        const number = onlyNums.replace(
	            /(\d{3})(\d{3})(\d{4})/,
	            '($1) $2-$3'
	        );
	        return number;
	    }
	}
}

/******************************************************
	@eth to wei
******************************************************/

const eth_to_wei = (eth) => {
	if (eth === null || eth === undefined || isNaN(eth)){
		return 0
	} else {
		return eth * 1000000000000000000
	}
}


const eth_to_wei_in_hex = (amt_in_eth) => {
	let num = Number(amt_in_eth);
	if ( typeof num === 'number' ){
		const eth_to_wei = 1000000000000000000;
		const amt_in_wei =  Number(amt_in_eth) * eth_to_wei;
		const hex_wei = amt_in_wei.toString(16)
		return { wei: amt_in_wei, hex:`0x${hex_wei}` };
	} else {
		return { wei: 0, hex: "" };
	}
}

const wei_to_eth_round = (wei) => {
	if (wei === null || wei === undefined || isNaN(wei)){
		return 0
	} else {
		return (wei/1000000000000000000).toFixed(4)
	}
}

const str_to_float = (str) => {
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

const str_to_int = (str) => {

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


const str_to_boolean = (str) => {
	if (typeof(str) === "string"){
		return str === "true"
	} else {
		return false
	}
}

const rand_num = (min,max) => {
	return Math.random() * (max - min) + min;
}

const force_to_num = (n, baseline) => {
	let b = (isNaN(baseline) || baseline === undefined || baseline === null ) ? 0 : Number(baseline)
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




/******************************************************
	time  
******************************************************/

// @Get now timestamp in seconds from 1972
const swiftNow = () => {
	return Math.round(Date.now()/1000)
}


// @Get now timestamp in seconds from 1972
const swiftPast = () => {
	let now = Math.round(Date.now()/1000)
	return now - now
}


// @Use: convert swift timestamp to millisecondsd since 1972
const fromSwiftTime = (t) => {
	return t * 1000
}

// @use: given swift timestamp, pretty print `MM DD YYYY HH:MM` 
const ppSwiftTime = ({ timeStamp, dateOnly }) => {
	
	let dt = new Date(timeStamp * 1000);

	let datetime = dt.toDateString();
	let time = dt.toLocaleTimeString();

	var datetime_ls = datetime.split(" ");
	datetime_ls.shift()
	let prefix = datetime_ls.join(" ")

	let fullstr = `${prefix}, ${time}`
	if (dateOnly){
		let xs = fullstr.split(', ')
		return xs[0]
	} else {
		return fullstr
	}
}


const parseSeverTimeStamp = ({ timeStamp, split }) => {
	if ( trivialString(timeStamp) ){
		return split ? ['',''] : ""
	}
	let xs = timeStamp.split(' ')
	if ( xs.length < 5 ){
		return split ? ['',''] : ""
	} else {
		if (split){
			let prefix = xs.slice(0,2).join(' ');
			let suffix = xs.slice(2,3).join('').replace(',','');
			return [prefix, suffix];
		} else {
			return xs.slice(0,3).join(' ').replace(',','');
		}
	}
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
const generatePassword = (email) => {  
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
			// let c = s.charCodeAt(i)
			a = a + numHex(s.charCodeAt(i));
	}
	
	return a;
}

function removeAllSpaces(xs){
	if (typeof xs === 'string'){
		return xs.replace(/ /g,'')
	} else {
		return ''
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

function replaceAt(array, index, value) {
  const ret = array.slice(0);
  ret[index] = value;
  return ret;
}

/******************************************************
	card number regular expression
******************************************************/

/**
 * 
 * @Use: match decial w/i string
 * 
 */ 
const matchDecimal = (str) => {

	const NUMERIC_REGEXP = /[-]{0,1}[\d]*[.]{0,1}[\d]+/g;

	if ( trivialString(str) ){
		return []
	} else {
		let matches = str.match(NUMERIC_REGEXP);
		return illValued(matches) ? [] : matches
	}
}



/**
 * 
 * @Use: match whole number w/i string
 * 
 */ 
const matchWholeNum = (str) => {

	const numberPattern = /\d+/g;

	if ( trivialString(str) ){
		return []
	} else {
		let matches = str.match(numberPattern);
		return illValued(matches) ? [] : matches
	}
}


/******************************************************
	email
******************************************************/


const _isEmail = (email) => {
	const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if (email.match(emailRegEx)) return true;
	else return false;
};


const isEmail = (email) => {
	return _isEmail(email)
};

const isEmpty = (string) => {
	if (string === null || string === undefined || string === ""){
		return true
	} else if (string.trim() === ''){
		return true
	} else {
		return false;
	}
};

const validateLoginData = (data) => {
	 let errors = {};
	 if (isEmpty(data.email)) errors.email = 'Must not be empty';
	 if (isEmpty(data.password)) errors.password = 'Must not be  empty';
	 return {
		 errors,
		 valid: Object.keys(errors).length === 0 ? true : false
	};
};


const validateSignUpData = (data) => {

	let errors = {};

	if (isEmpty(data.email)) {
		errors.email = 'Must not be empty';
	} 
	else if (!_isEmail(data.email)) {
		errors.email = 'Must be valid email address';
	}

	if (isEmpty(data.firstName)) errors.firstName = 'Must not be empty';
	if (isEmpty(data.lastName)) errors.lastName = 'Must not be empty';

	if (isEmpty(data.password)) errors.password = 'Must not be empty';
	if (data.password !== data.confirmPassword) errors.confirmPassword = 'Passowrds must be the same';


	return {
		errors,
		valid: Object.keys(errors).length === 0 ? true : false
	};
};


const validPassword = (str) => {

	if (trivialString(str)){
		return { success: false, message: 'empty string' }
	}

	if ( str.length < 8 ){
		return { success: false, message: 'Password must be at least 8 characters long' }
	}

	const lowerCaseLetters = /[a-z]/g;
	const upperCaseLetters = /[A-Z]/g;
	const numbers = /[0-9]/g;

	let lowers = str.match(lowerCaseLetters)
	let uppers = str.match(upperCaseLetters)
	let nums   = str.match(numbers);

	if ( lowers === null || lowers.length === 0 ){

		return { success: false, message: 'Please include at least one lowercase letter' }

	} else if ( uppers === null || uppers.length === 0 ){

		return { success: false, message: 'Please include at least one uppercase letter'}


	} else if (  nums === null || nums.length === 0 ){

		return { success: false, message: 'Please include at least one number'}

	} else {

		return { success: true, message: 'success' }
	}

}


/**
 * Checks if the given string is an address
 *
 * @method isAddress
 * @param {String} address the given HEX adress
 * @return {Boolean}
*/
// var isAddress = function (address) {
//     if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
//         // check if it has the basic requirements of an address
//         return false;
//     } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
//         // If it's all small caps or all all caps, return true
//         return true;
//     } else {
//         // Otherwise check each case
//         return isChecksumAddress(address);
//     }
// };

// /**
//  * Checks if the given string is a checksummed address
//  *
//  * @method isChecksumAddress
//  * @param {String} address the given HEX adress
//  * @return {Boolean}
// */
// var isChecksumAddress = function (address) {
//     // Check each case
//     address = address.replace('0x','');
//     var addressHash = sha3(address.toLowerCase());
//     for (var i = 0; i < 40; i++ ) {
//         // the nth letter should be uppercase if the nth digit of casemap is 1
//         if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
//             return false;
//         }
//     }
//     return true;
// };

/******************************************************
	credit card number
******************************************************/

function AmexCardnumber(inputtxt) {
	var cardno = /^(?:3[47][0-9]{13})$/;
	return cardno.test(inputtxt);
}

function VisaCardnumber(inputtxt) {
	var cardno = /^(?:4[0-9]{12}(?:[0-9]{3})?)$/;
	return cardno.test(inputtxt);
}

function MasterCardnumber(inputtxt) {
	var cardno = /^(?:5[1-5][0-9]{14})$/;
	return cardno.test(inputtxt);
}

function DiscoverCardnumber(inputtxt) {
	var cardno = /^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;
	return cardno.test(inputtxt);
}

function DinerClubCardnumber(inputtxt) {
	var cardno = /^(?:3(?:0[0-5]|[68][0-9])[0-9]{11})$/;
	return cardno.test(inputtxt);
}

function JCBCardnumber(inputtxt) {
	var cardno = /^(?:(?:2131|1800|35\d{3})\d{11})$/;
	return cardno.test(inputtxt);
}

function IsValidCreditCardNumber(number) {

	let cardNumber = number.replace(/ /g,'')

	var cardType = '';
	if (VisaCardnumber(cardNumber)) {
		cardType = "visa";
	} else if (MasterCardnumber(cardNumber)) {
		cardType = "mastercard";
	} else if (AmexCardnumber(cardNumber)) {
		cardType = "americanexpress";
	} else if (DiscoverCardnumber(cardNumber)) {
		cardType = "discover";
	} else if (DinerClubCardnumber(cardNumber)) {
		cardType = "dinerclub";
	} else if (JCBCardnumber(cardNumber)) {
		cardType = "jcb";
	} else {
		return ''
	}

	return cardType;
}


const validCrediCardNumber = card => {
	return IsValidCreditCardNumber(card) !== ''
}


const validCreditCardExpiration = moyr => {

	let exp = moyr.replace(/ /g,'');

	if (exp === null || exp === undefined || exp === '' ){
		return false
	} else if (exp.length !== 4 ){
		return false
	} else {

		let _exp = `${exp}`
		let mo = _exp.substring(0,2)
		let yr = _exp.slice(-2)

		var today, someday;
		var exMonth = parseInt(mo)
		var exYear  = parseInt(yr) + 2000
		today   = new Date();
		someday = new Date();
		someday.setFullYear(exYear, exMonth, 1);

		if (someday < today) {
			return false
		} else {
			return true
		}
	}

}


const validCreditCardCVC = _exp => {
	
	let exp = _exp.replace(/ /g,'');

	if (exp === null || exp === undefined || exp === '' ){
		return false
	} else if (exp.length !== 3 ){
		return false
	} else {
		return true
	}

}


/******************************************************
	other utility functions
******************************************************/

function _range(start, stop, step) {

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

const range = (a,b) => {
	return _range(a,b,1)
}

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}    

/**
 * Round half up ('round half towards positive infinity')
 * Negative numbers round differently than positive numbers.
 */
function roundTo(num, decimalPlaces = 0) {
    num = Math.round(num + "e" + decimalPlaces);
    return Number(num + "e" + -decimalPlaces);
}

/******************************************************
	image utils
******************************************************/


/**
 *
 * @use: compute image brightness
 * 
 **/
function getImageBrightness(url) {

    var img = document.createElement("img");
    img.src = url

    img.style.display = "none";
    document.body.appendChild(img);

    var colorSum = 0;

    img.onload = function() {
        // create canvas
        var canvas = document.createElement("canvas");
        canvas.width  = this.width;
        canvas.height = this.height;

        var ctx = canvas.getContext("2d");
        ctx.drawImage(this,0,0);

        var imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
        var data = imageData.data;
        var r,g,b,avg;

          for(var x = 0, len = data.length; x < len; x+=4) {
            r = data[x];
            g = data[x+1];
            b = data[x+2];

            avg = Math.floor((r+g+b)/3);
            colorSum += avg;
        }

        var brightness = Math.floor(colorSum / (this.width*this.height));
        console.log('brightness', brightness);
    }
}

/**
 * 
 * @use: resize file:
 * @Doc: https://stackoverflow.com/questions/61740953/reactjs-resize-image-before-upload
 * 
 **/
const resizeFile = ({ file, quality }) => new Promise(resolve => {
    Resizer.imageFileResizer(file, 300, 300, 'JPEG', quality ?? 100, 0,
    uri => {
      resolve(uri);
    }, 'base64' );
});

/******************************************************
	export
******************************************************/



export {
	  print
	, cap
	, illValued
	, trivialString
	, trivialProps
	, trivialObj
	, trivialNum
	, trivialArray
	, handleInputInNumbers
	, isValidHttpUrl
	, eth_to_wei
	, eth_to_wei_in_hex
	, wei_to_eth_round
	, str_to_float
	, str_to_int
	, str_to_boolean
	, rand_num
	, force_to_num
	, swiftNow
	, swiftPast
	, fromSwiftTime
	, ppSwiftTime
	, reverseString
	, generatePassword
	, numHex
	, strHex
	, isEmail
	, validPassword
	, isEmpty
	, validateLoginData
	, validateSignUpData
	, validCrediCardNumber
	, validCreditCardExpiration
	, validCreditCardCVC
	, range
	, matchDecimal
	, matchWholeNum
	, removeAllSpaces
	, roundTo
	, getRandomInt
	, replaceAt
	, toWellFormedObject
	, contractMetamaskAddress
	, resizeFile
	, parseSeverTimeStamp
}


