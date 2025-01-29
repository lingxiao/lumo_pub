/**
 * @Package: endpoint utils
 * @Date   : July 4th, 2021
 * @Author : Xiao Ling   
 * 
*/


const { 
	illValued,
	trivialProps,
	trivialString,
	trivialNum 
} = require('./../api/utils');

const { 
	getVendorByClientID,
 } = require('./../api/client/vendor');

 const { print } = require("./../api/utils")


/**
 * 
 * @Use: determine if `req`uest is well formed and 
 *       contains the `keys` enumerated
 *
*/ 
async function assertWellFormedRequest( req, keys ){

	if (illValued(req) || trivialProps(req,'body')){
		return { wellFormed: false, message: "request is invalid", vendor: {} };
	}

	let str  = JSON.stringify(req.body);
	let body = JSON.parse(str);

	if (illValued(body)){

       return { wellFormed: false, message: `Malformed input data ${str}, request must be well formed JSON`, vendor: {} }

	} else if ( trivialProps(body, 'vendorID') || trivialString(body.vendorID) ){

       return { wellFormed: false, message: `Must provide vendor token for the request, you provided ${body.vendorID ?? ""}`, vendor: {} }

	} else if ( trivialProps(body, 'vendorSecret') || trivialString(body.vendorSecret) ){

       return { wellFormed: false, message: `Must provide vendor secret for the request`, vendor: {} }

	} else {

		let vendor = await getVendorByClientID( body.vendorID );

		if ( trivialProps(vendor, 'vendorID') || trivialProps(vendor, 'sk_live') || trivialProps(vendor, 'sk_test') ){

	       	return { wellFormed: false, message: `Must provide a valid vendor token for the request`, vendor: {} };

	    } else if ( (body.vendorSecret !== vendor.sk_test) && (body.vendorSecret !== vendor.sk_live) ) {

	       	return { wellFormed: false, message: `Your vendor id ${body.vendorID} does not match the vendor secret on file`, vendor: {} };

	    } else {

	    	var well_formed = true;
	    	var message = "";

	    	keys.forEach(key => {
	    		if (trivialProps(body, key)){
	    			message = message.concat(`You must provide a valid ${key}; `)
	    			well_formed = false;
	    		}
	    	});

	    	if (well_formed){
	    		return { wellFormed: true, message: "ok", vendor: vendor }
	    	} else {
	    		return { wellFormed: false, message: message, vendor: {} } // `${message} for ${str}`, vendor: {} }
	    	}
	    } 

	}
}



/******************************************************
    @API Utils
******************************************************/


/***
 * 
 * @Use: higher order fn that executes api request at `fn`
 * 
 * 
 **/
async function with_api_response ({ req, res, params, data_format, fn }){

    let str = JSON.stringify(req.body);
    let body = JSON.parse(str);

    const { wellFormed, message, vendor } = await assertWellFormedRequest(req, params);

    if ( !wellFormed ){

        let res_str = JSON.stringify({ "success": false, "message": message, data: data_format ?? {} });
        res.status(201).send( res_str );

    } else {

        var inputs = body;        
        const vendorID = vendor.vendorID;
        inputs['vendorID'] = vendorID;
        inputs['full'] = true;

        let response = await fn(inputs);
        res.status(201).send(JSON.stringify(response));

    }
}



/**
 * @Use: parse request.body and redact vendor secret
 *
*/ 
function safeParseBody(body){
	if (illValued(body)){
		return ""
	} 
	body['vendorSecret'] = "[RECACTED]";
	let str = JSON.stringify(body);
	return str;
}


/**
 * 
 * @use: check if vendor can pay given its secret
 *       when the vendor use sk_test, it can always pay
 *       if the vendor use sk_live, then check if vendor
 *       has stripe credit card on file.
 * @Params:
 *   - vendor: Record
 *   - secret: String
 * 
*/
async function assertVendorCanPay({ vendor, secret }){

	if ( trivialProps(vendor,'vendorID') || trivialProps(vendor,'sk_live') || trivialProps(vendor,'sk_test') || trivialString(secret) ){

		return false

	} else {

		if (vendor.sk_test === secret){

			return true;

		} else if (vendor.sk_live === secret) {

			let stripe_record = await getVendorStripeInfo(vendor.vendorID);
			return vendorCanPay(stripe_record);

		} else {

			return false;
		}

	}
}



exports.assertWellFormedRequest = assertWellFormedRequest
exports.safeParseBody = safeParseBody
exports.assertVendorCanPay = assertVendorCanPay
exports.with_api_response = with_api_response
