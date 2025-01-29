/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: slate API
 * @Date   : June 20th, 2022
 * @Important: must set env. variable for public and private key of admin on local first. 
        >> see: https://medium.com/firelayer/deploying-environment-variables-with-firebase-cloud-functions-680779413484
        ```
            firebase functions:config:set eth.public = "" eth.private = ""
            firebase functions:config:get
        ```
 * @test : firebase serve
 *
 *
*/


// import modules
const uuid  = require('uuid');
const fire  = require('./../fire')
const functions = require('firebase-functions');
const { firebaseConfig } = require("firebase-functions");


const { 
    print,
    swiftNow, 
    illValued, 
    trivialProps, 
    trivialNum, 
    trivialString,
} = require('./../utils');


const { 
    getUserByVendorID, 
    getUserByMetamask,
} = require('./accounts');



const {
    DbPaths, 
    Networks,
    make_production_web3_account,
    store_keys_in_lumo_core,
    network_flow_to_eth,
    default_fn_response,
    migrate_data_to,
    GLOBAL_PRODUCTION,
    GLOBAL_BACKUP,
    project_id,
} = require('./../core');


/******************************************************
    @migrate
******************************************************/


const valid_paths = Object.values(DbPaths);

async function MigrateAll(){

    if ( !GLOBAL_PRODUCTION ){
        return false;
    }

    async function migrateEach(path){

        var data = []
        const fetch_data = await fire.firestore
            .collection(path)
            .get();

        if (!fetch_data.empty){
            fetch_data.forEach(async doc => {
                if ( !trivialProps(doc,'data') ){
                    let blob = doc.data();
                    data.push(doc.data())
                    let id_1 = blob['ID']
                    let id_3 = blob['hash']
                    let id_4 = blob['blockHash']
                    var id = id_1 || id_3 || id_4;
                    if ( path === DbPaths.users ){
                        id = blob['userID']
                    } else if ( path === DbPaths.stories_top ){
                        id = blob['singelton']
                    }
                    let post_params = {
                        id: id,
                        collection_name: path,
                        data: JSON.stringify(blob),
                    }
                    await migrate_data_to({ post_params: post_params, then: (res) => {
                        console.log('response', res)
                    }})
                }
            })
        }               

        return data;
    }

    let migrate_all_data = await valid_paths.map(async(p) => {
        await migrateEach(p)
    })


    await Promise.all(migrate_all_data);

    return true;
}


async function acceptMigration({ collection_name, id, data }){

    var res = default_fn_response({ data: {} })

    if ( trivialString(collection_name) || trivialString(id) || illValued(data) ){
        res['message'] = 'case 1'
        return res
    }
    if ( valid_paths.includes(collection_name) === false ){
        res['message'] = 'case 2'
        return res
    }

    if ( !GLOBAL_BACKUP || project_id !== 'backupmainnet' ){
        res['message'] = 'can only migrate to GLOBAL_BACKUP'
        return res;
    }

    if ( project_id === 'mainnetendpoint' ){
        res['message'] = 'cannot migrate to mainnetendpoint'
        return res;
    }

    try {

        let project_id = firebaseConfig().projectId ;
        let _collection_name = project_id === 'backupmainnet' ?  `_${collection_name}` : collection_name

        let _data = JSON.parse(data)

        let did =  await fire.firestore.collection(_collection_name).doc(id).set(_data).then(_ => true).catch(e => false);
        res['success'] = did;
        res['data'] = _data;
        res['message'] = did ? "succ" : 'failed';
        return res;

    } catch (e) {
        res['message'];
        return res
    }
}



/******************************************************
    @export
******************************************************/



exports.acceptMigration = acceptMigration;
exports.MigrateAll = MigrateAll;








