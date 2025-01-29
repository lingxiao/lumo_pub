/**
 * @Module: top level proj. env.
 * @Author: Xiao Ling
 * @Date  : 8/27/2022
 * @DOC: deploy to multiple env: https://firebase.googleblog.com/2016/07/deploy-to-multiple-environments-with.html
*/

const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const { firebaseConfig } = require("firebase-functions");

/******************************************************
    @set 
******************************************************/


/**
 * 
 * @Use: define which config to use in ./fire.js
 * @Important:   make sure you do:
 *  ```
 *      firebase projects:list
 *      firebase use production-lumo-core
 *  ```
 *      when deploying to production
 * 
**/ 
const GLOBAL_PRODUCTION = firebaseConfig().projectId === '' 
const GLOBAL_BACKUP = firebaseConfig().projectId === ''

exports.GLOBAL_BACKUP     = GLOBAL_BACKUP;
exports.GLOBAL_PRODUCTION = GLOBAL_PRODUCTION;
exports.project_id = firebaseConfig().projectId;

