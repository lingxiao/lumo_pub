/**
 * @Package: index.js
 * @Date   : Dec 15th, 2021
 * @Author : Xiao Ling   
 * 
*/


const axios = require('axios');
const functions = require("firebase-functions");
const express    = require('express');
const cors       = require('cors')({origin: true});
const path       = require('path');
const bodyParser = require('body-parser');
const { firebaseConfig } = require("firebase-functions");

const fs = require("fs"); 


const GLOBAL_STAGING = firebaseConfig().projectId === 'staging-lumo-web' 

/**
 * 
 * @use: run `python rename.py` to rename the 
 *       `index.html` file so that on each
 *       deployment, the browser fetches the
 *       new index.html file instead of using
 *       the cached version w/ outdated .js
 *       this is the only reliable way of busting the cache
 * 
 **/ 
const version = require('./client/version.json');

function parseVersion(v){
   if ( v === undefined || v === null ){
      return "index.html"
   } else if ( v.version === undefined || v.version === null ){
      return "index.html"
   } else {
      return `index${v.version}.html`;
   }
}


/******************************************************
	@web redirect
	//const path  = __dirname + '/views/';
******************************************************/

/**
 *
 * @use: init express and use `react-build`
 *       when deving: 
 *       		`npm start`
 *       when deploying
 * 
 *         1. open core.js and make sure you're deploying to the right place
 * 
 *		     2. cd to /web and do: `npm run build`
 *
 *		     3. cd to top level and do: `firebase serve` to confirm build is usable, go to localhost:5000
 *
 *         4. cd to functions and do
 *
 *             `firebase use` to check you're deploying to the right server
 *           
 *		     5. cd to functions and do: `firebase deploy`  
 *             
 * 
 *
 *	make sure your firebase.json look like this
 *  or express function will not map to react-app paths
 *  	```
 *		    "rewrites": [
 *  	      {
 *		        "source": "**",
 *		        "function": "app",
 *		      }
 *		    ]
 *		```
 *
 *	 @source:
 *		https://www.freecodecamp.org/news/how-to-build-a-todo-application-using-reactjs-and-firebase/
 *		https://flaviocopes.com/how-to-serve-react-from-same-origin/
 *
*/


/******************************************************
   @Hosted react website
******************************************************/

/**
 *
 * @use: point to web root
 * 
*/
const web_root = `client/build`  

/**
 *
 * `app` is global top level web app entry point
 * `appAPI` serves vendor APIs
 * 
**/ 
const app = express();

app.use(cors);
app.use(express.json()); 
app.use(bodyParser.urlencoded({ extended: false }));

// Serve all static files of react-app
app.use(express.static(path.join(__dirname, web_root)));


/******************************************************
   @Hosted react website
******************************************************/

/**
 *
 * @Use: Serve the privacy policy
 * 
app.get('/privacy', (req, res) => {

   // this doensn't bust the cache
   res.set('Cache-Control', 'no-store, private, max-age=60, s-maxage=60');
   let p  = path.join(__dirname, web_root);
   let fp = path.join(p, "privacy.html");
   res.sendFile(fp);
});

/**
 *
 * @Use: Serve the TOS
 * @Doc: https://firebase.google.com/docs/hosting/manage-cache
 * @Doc: https://blog.logrocket.com/adding-dynamic-meta-tags-react-app-without-ssr/
 * 

app.get('/tos', (req, res) => {

   // this doensn't bust the cache
   res.set('Cache-Control', 'no-store, private, max-age=60, s-maxage=60');
   let p  = path.join(__dirname, web_root);
   let fp = path.join(p, "tos.html");
   res.sendFile(fp);
});
*/


/**
 *
 * @Use: Serve the app 
 * @Doc: https://firebase.google.com/docs/hosting/manage-cache
 * @Doc: https://blog.logrocket.com/adding-dynamic-meta-tags-react-app-without-ssr/
 * 
*/
app.get('*', (req, res) => {

   // this doensn't bust the cache
   res.set('Cache-Control', 'no-store, private, max-age=60, s-maxage=60');

   let p  = path.join(__dirname, web_root);
   let fp = path.join(p, parseVersion(version)); // "index.html");
   res.sendFile(fp);

});




exports.app = functions.https.onRequest(app);













