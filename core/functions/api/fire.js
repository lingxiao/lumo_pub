/**
 * @Module: Firebase stub
 * @Author: Xiao Ling
 * @Date  : 8/17/2020
 * @DOC: deploy to multiple env: https://firebase.googleblog.com/2016/07/deploy-to-multiple-environments-with.html
*/

const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const { firebaseConfig } = require("firebase-functions");

const ytdl = require('ytdl-core');
const uuid = require('uuid');

const { 
    swiftNow,
    ppSwiftTime, 
    trivialProps, 
    illValued, 
    trivialString
} = require('./utils');

const {
    GLOBAL_BACKUP,
    GLOBAL_PRODUCTION,
    project_id,
} = require("./dbenv");


/******************************************************
    @IMPORTANT: db configs
******************************************************/



/**
 * 
 * @Use: Production
 *  when deloying to production
 *      firebase use --add
 *      firebase use production
 **/
 
const ProductionDatabaseConfig = {    
    databaseURL   : '',
    storageBucket : '',
}

/**
 * @Use: backup production server
 *  when deloying to production
 *      firebase use --add
 *      firebase use production
 **/
 
const BackupProductionDatabaseConfig = {    
    databaseURL   : '',
    storageBucket : '',
}


/**
 * @Staging
 *  when deloying to staging, do: 
 *      firebase use --add
 *      firebase use staging
 */
const StagingDatabaseConfig = {
    databaseURL   : '',
    storageBucket : ''
}


const DatabaseConfig = GLOBAL_BACKUP
    ? BackupProductionDatabaseConfig
    : GLOBAL_PRODUCTION 
        ? ProductionDatabaseConfig
        : StagingDatabaseConfig


/******************************************************
    @Initalize database ad admin
        DOC: https://firebase.google.com/docs/admin/setup
******************************************************/

// make sure you do not initalize the app more than once
const fireAdmin = admin.initializeApp({
      credential   : admin.credential.applicationDefault() 
    , databaseURL  : DatabaseConfig['databaseURL']
    , storageBucket: DatabaseConfig['storageBucket']
});


// database
admin.auth();
const firestore  = fireAdmin.firestore();
const storage    = fireAdmin.storage().bucket();
const bucket = getStorage().bucket();



/******************************************************
    @firebaes read
******************************************************/

// fetch fy field + value
const fetch_many = async ({ path, field, value }) => {
    if ( trivialString(field) || trivialString(value) || trivialString(path) ){
        return []
    } else {
        const matches = await firestore
            .collection(path)
            .where(field, '==', value)
            .get();
        var chains = [];    
        if ( !matches.empty ){
            matches.forEach(doc => {
                if ( !trivialProps(doc,'data') ){
                    chains.push(doc.data())
                }
            });
        }
        return chains
    }
}

exports.fetch_many = fetch_many

const fetch_all = async ({ path }) => {
    if ( trivialString(path) ){
        return []
    } else {
        const matches = await firestore
            .collection(path)
            .get();
        var res = [];    
        if ( !matches.empty ){
            matches.forEach(doc => {
                if ( !trivialProps(doc,'data') ){
                    res.push(doc.data())
                }
            });
        }
        return res
    }
}

exports.fetch_all = fetch_all;


// fetch fy field + value
exports.fetch_one = async ({ path, field, value }) => {
    if ( trivialString(field) || trivialString(value) || trivialString(path) ){
        return {}
    } else {
        let xs = await fetch_many({ path, field, value });
        return xs.length > 0 ? xs[0] : {}
    }
}


// fetch fy field + value on two conditions
exports.fetch_one_2 = async ({ path, field1, value1, field2, value2 }) => {
    let strs = [ field2, value2, field1, value1, path ];
    if  ( strs.map(x => trivialString(x)).includes(true) ){
        return {}
    } else {
        const matches = await firestore
            .collection(path)
            .where(field1, '==', value1)
            .where(field2, '==', value2)
            .get();
        var items = [];    
        if ( !matches.empty ){
            matches.forEach(doc => {
                if ( !trivialProps(doc,'data') ){
                    items.push(doc.data())
                }
            });
        }
        return items.length > 0 ? items[0] : {}
    }
}


// fetch fy field + value on two conditions
exports.fetch_many_2 = async ({ path, field1, value1, field2, value2 }) => {
    let strs = [ field2, value2, field1, value1, path ];
    if  ( strs.map(x => trivialString(x)).includes(true) ){
        return {}
    } else {
        const matches = await firestore
            .collection(path)
            .where(field1, '==', value1)
            .where(field2, '==', value2)
            .get();
        var items = [];    
        if ( !matches.empty ){
            matches.forEach(doc => {
                if ( !trivialProps(doc,'data') ){
                    items.push(doc.data())
                }
            });
        }
        return items;
    }
}




/******************************************************
    @firebase write
******************************************************/

exports.write_to_db = async ({ path, ID, blob }) => {
    if ( trivialString(path) || trivialString(ID) || trivialProps(blob,"ID") ){
        return false
    }
    let did = await firestore
        .collection(path)
        .doc( ID )
        .set( blob )
        .then(_ => true)
        .catch(e => false)
    return did;
}

exports.remove_from_db = async ({ path, ID }) => {
    if ( trivialString(path) || trivialString(ID) ){
        return false
    }
    let did = await firestore
        .collection(path)
        .doc( ID )
        .delete()
    return did;
}

exports.update_db = async ({ path, ID, blob }) => {
    if ( trivialString(path) || trivialString(ID) || illValued(blob) ){
         return false
    } else {
        try {
            let _blob = { 
                ...blob,
                timeStampLatest: swiftNow(),
                timeStampLatestPP: ppSwiftTime(swiftNow()) 
            };
             let did = await firestore
                .collection(path)
                .doc( `${ID}` )
                .update( _blob )
                .then(_ => true)
                .catch(e => false)
            return did;
        }  catch (e) {
             return false
        }
    }
}


/******************************************************
    @youtube mp4 link to bucket file fn
******************************************************/

/**
 * 
 * @Use: save youtube link from `url` to storage 
 *       bucket, 
 * @Source: https://stackoverflow.com/questions/62666032/how-to-createwritestream-to-gcs
 * @Source: https://github.com/pprathameshmore/youtube-downloader-app
 *          https://medium.com/@svdoever/convert-youtube-url-to-mp4-url-f371d9574b7
 *          https://javascript.plainenglish.io/how-to-create-a-youtube-downloader-with-node-js-and-react-a86d7586fcc8
 * @Source: how to getDownLoadURL on the server side:
 *  https://www.sentinelstand.com/article/guide-to-firebase-storage-download-urls-tokens
 * 
 * @Source: temp access:
 *  https://cloud.google.com/storage/docs/samples/storage-generate-signed-url-v4
 * 
 **/ 
async function youtubeLinkToBucket({ url, then }){

    var response = { success: false, message: 'illvalued inputs', downloadURL: "" }

    if ( trivialString(url) ){
        return then(response);
    }

    const filepath = `${uuid.v4()}.mp4`;

    // create storge blob and mp4 file stream
    let blob = bucket.file(filepath);
    let stream = await ytdl(url, { filter: format => format.container === 'mp4' })

    stream
        .pipe(blob.createWriteStream()) 
        .on("finish", async (b) => {

            // make file public and get donwload url
            const pub_res  = await blob.makePublic();
            const metadata = await blob.getMetadata();

            if ( metadata.length === 0 ){
                response['message'] = 'could not save data'
                return then(response);
            }

            const downloadURL = metadata[0].mediaLink

            if ( !trivialString(downloadURL) ){

                return then({ success: true, message: 'success', downloadURL: downloadURL });

            } else {

                response['message'] = 'could not save data and get valid downloadURL'
                return then(response);

            }


        })
        .on("ready", (b) => {
        })
        .on("error", (error) => {
            response['message'] = `could not save data ${error}`
            return then(response);
        });

}



/******************************************************
    @Export
******************************************************/

// write
exports.firestore = firestore
exports.storageRef = storage

exports.youtubeLinkToBucket = youtubeLinkToBucket;



