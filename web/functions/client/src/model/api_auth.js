
/**
 * 
 * @Module: auth api
 * @Author: Xiao Ling
 * @Date  : 12/16/2021
 * @TODO  : see escrow contract: https://docs.replit.com/tutorials/33-escrow-contract-with-solidity
 * 
*/


import axios from "axios";

import { 
	getAuth, 
	signOut as firebaseSignOut, 
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	TwitterAuthProvider,
	signInWithPopup,
} from "firebase/auth";


const { 
	trivialString, 	
	trivialProps,
	validateLoginData,
} = require('./utils')


const { 
	  vendorID
	, vendorSecret
	, POST_ENDPOINTS
	, FLOW_NETWORK
	, go_axios_post_preset
} = require('./core');

const { makeRawUserBlob } = require('./userModel');

const auth = getAuth();
const twitter_provider = new TwitterAuthProvider();


/******************************************************
	@User Auth by twitter
******************************************************/	

/**
 * 
 * @Use: auth by twitter sign up
 * @Doc: https://firebase.google.com/docs/auth/web/twitter-login#web-version-9_3
 * @Doc: Make sure you whitelist the domain: https://github.com/firebase/firebase-tools/issues/4789
 * @DOC: whitelist domain: https://stackoverflow.com/questions/48076968/firebase-auth-unauthorized-domain-domain-is-not-authorized
 * 
 **/
function authenticate_user_with_twitter({ then }){

	var res = { 
		success  : false,
		message  :"", 
		errorCode: 0, 
		uid      : "", 
		email    : "" ,
		data     : {}, 
	};

	signInWithPopup(auth, twitter_provider)
		.then( async (result) => {

		// This gives you a the Twitter OAuth 1.0 Access Token and Secret.
		// You can use these server side with your app's credentials to access the Twitter API.
		const credential = TwitterAuthProvider.credentialFromResult(result);
		const token = credential.accessToken;
		const secret = credential.secret;
		// The signed-in user info.
		const user = result.user;

		if ( trivialProps(user,'uid') ){
			res['message'] = 'mal formed user from twitter authentication';
			return then(res);
		}

		const { displayName, email, photoURL, reloadUserInfo, providerData  } = user;

		let twitterUserName = trivialProps(reloadUserInfo,'screenName')
			? ""
			: (reloadUserInfo.screenName ?? "");

		let blob = makeRawUserBlob({
			userID   : user.uid,
			email    : email ?? "",
			password : "",
			name     : displayName,
			metamask_ethereum_address: "",
			twitterUserName: twitterUserName,
		});

		res['uid'] = user.uid;
		res['data'] = blob;

		return await go_axios_post_preset({
			fn_name: "createUserAccount",
			params: blob,
			then: (response) => {
				let _res = { ...res, ...response }
				return then(_res)
			}
		})

		// ...
	}).catch((error) => {
		// Handle Errors here.
		const errorCode = error.code;
		const errorMessage = error.message;
		// The email of the user's account used.
		const email = error.customData.email;
		// The AuthCredential type that was used.
		const credential = TwitterAuthProvider.credentialFromError(error);

		res["email"]     = email;
		res['message']   = errorMessage;
		res['errorCode'] = errorCode;
		return then(res)
	});	
}



/******************************************************
	@User Auth by email
******************************************************/	



/**
 * 
 * @Use: signout of current account
 * 
 **/ 
const signOut = () => {
	firebaseSignOut(auth).then(() => {
		console.log("\n\nsigned out")
	}).catch((error) => {
		console.log("\n\nfailed to signout")
	});
}

/**
 * 
 * @use: try login using these credentials, if fail then sign up new user
 * @Doc: https://firebase.google.com/docs/auth/web/password-auth
 * @Params:
 *  email :: String
 * 
 **/ 
async function authenticate_user({email, password, then}){

    const newUser = {
        email    : email,
		password : password,
		confirmPassword: password
    };

    const { valid, errors } = validateLoginData(newUser); 

	if (!valid){

		return then({ success: false, message: errors, uid:""})

	} else {

		// try signing in first
		signInWithEmailAndPassword(auth, email, password)
	        .then( async (userCredential) => {
			    const user = userCredential.user;
			    let uid = user.uid ?? "";
				then({ success: true, message: 'logged in user', uid:uid})
	        })
	        .catch((error) => {


	        	if ( error.code === 'auth/wrong-password' ){

					return then({ success: false, message: 'wrong email or password', uid: "" })					        		


	        	} else {

					createUserWithEmailAndPassword(auth,email,password)
					  .then( async (userCredential) => {

					    // Signed in 
					   	const user = userCredential.user;

					   	let blob = makeRawUserBlob({
					   		userID: user.uid,
					   		email : email ?? "",
					   		password: password ?? "",
					   		metamask_ethereum_address: "",
					   	})


						// create user
						if ( !trivialString(user.uid) ){

							// create server side user
							axios.post(POST_ENDPOINTS.createUserAccount, {
								userID       : user.uid,
								vendorID     : vendorID(),
								vendorSecret : vendorSecret,
								email        : email ?? "",
								password     : password ?? "",
								metamask_ethereum_address: "",
								network      : FLOW_NETWORK(),
							})
							.then(async res => {

								if (trivialProps(res,'data')){
									return then({ success: false, message: `created new user, created client db blob, but not core db blob`, uid: user.uid })
								}

								const { success, message } = res.data;

								if ( success ){
									return then({ success: true, message: 'created new user, created client db blob, created core db blob', uid:user.uid})
								} else {
									return then({ success: false, message: `created new user, created client db blob, but not core db blob: ${message}`, uid: user.uid })
								}
							})	
							.catch(e => {
								return then({ success: false, message: `authenticate_user success but failed to create user data`, uid: user.uid })
							})


						} else {

							return then({ success: false, message: `created user but its user id is null: ${user.uid}`, uid: user.uid})
						}

					  })
					  .catch((error) => {
							const errorCode = error.code;
							const errorMessage = error.message;
							return then({ success: true, message: `failed to create user ${errorCode}: ${errorMessage}`, uid:""})
					  });	        	
				}
	        })
	        .then((data) => {

	        	// new user has been created, create corresponding data in db
	        	if (  !trivialProps(data,'user') && !trivialProps(data.user,'uid') && !trivialString(data.user.uid) ){
	        		let token = data.user.uid
					then({ success: true, message: 'logged in user', uid:token})
		        // else user already exists and you just signed in
		        } else {
		        	// if ( !illValued(data) ){
			        	// let token = data
						// then({ success: true, message: 'logged in user', uid:token});
					// } else {
						// then({ success: false, message: 'user dne or mismatched password', uid: "" })
					// }
		        }
	        })
	}

}


/******************************************************
	@export
******************************************************/	



export {

	// auth
	signOut,
	authenticate_user,
	authenticate_user_with_twitter,
}










