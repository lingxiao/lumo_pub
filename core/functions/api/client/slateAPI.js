// /* eslint-disable no-await-in-loop */

// /** 
//  * 
//  * @Package: slate API
//  * @Date   : June 20th, 2022
//  * @Important: must set env. variable for public and private key of admin on local first. 
//         >> see: https://medium.com/firelayer/deploying-environment-variables-with-firebase-cloud-functions-680779413484
//         ```
//             firebase functions:config:set eth.public = "" eth.private = ""
//             firebase functions:config:get
//         ```
//  * @test : firebase serve
//  *
//  *
// */


// // import modules
// const uuid  = require('uuid');
// const fire  = require('./../fire')
// const functions = require('firebase-functions');


// const { 
//     print,
//     swiftNow, 
//     illValued, 
//     trivialProps, 
//     trivialNum, 
//     trivialString,
// } = require('./../utils');


// const { 
//     getUserByVendorID, 
//     getUserByMetamask,
// } = require('./accounts');


// const {
//     DbPaths,    
//     Networks,
//     make_production_web3_account,
//     store_keys_in_lumo_core,
//     network_flow_to_eth,
//     default_fn_response,
//     migrate_data_to,
// } = require('./../core');

// const {
//       getTopProject
//     , getProjects
//     , getProject
//     , getStoryBoard
//     , getStoryboardItem
//     , getFiatPurchasedStoryboardItems
//     , getProjectContracts
//     , is_project_owner    
// } = require('./storyboardRead');


// /******************************************************
//     @read
// ******************************************************/

// /**
//  * 
//  * @Use: get all slates 
//  * 
//  **/
// async function getSlates(){

//     var res = default_fn_response({ data: [] });

//     var slates = []
//     const fetch_slates = await fire.firestore
//         .collection(DbPaths.slate_root)
//         .get();

//     if (!fetch_slates.empty){
//         fetch_slates.forEach(doc => {
//             if ( !trivialProps(doc,'data') ){
//                 slates.push(doc.data())
//             }
//         })
//     }        

//     res['success'] = true;
//     res['message'] = 'fetched slates'
//     res['data'] = slates;
//     return res;    
// }


// /**
//  *
//  * @use: get each slate and all of its items 
//  * 
//  **/
// async function fetch_each_slate({ slate_id, full }){

//     var res = default_fn_response({ root: {}, slots: [] });

//     if ( trivialString(slate_id) ){
//         res['message'] = 'please specify valid slate id'
//         return res;
//     }

//     var slates = []
//     const fetch_slates = await fire.firestore
//         .collection(DbPaths.slate_root)
//         .where('ID', '==', slate_id)
//         .get();

//     if (!fetch_slates.empty){
//         fetch_slates.forEach(doc => {
//             if ( !trivialProps(doc,'data') ){
//                 slates.push(doc.data())
//             }
//         })
//     }       

//     if ( slates.length === 0 ){
//         res['message'] = 'slate dne'
//         return res;
//     }

//     let root = slates[0]

//     var items = []
//     const fetch_items = await fire.firestore
//         .collection(DbPaths.slate_slots)
//         .where('slate_id', '==', slate_id)
//         .get();

//     if (!fetch_items.empty){
//         fetch_items.forEach(doc => {
//             if ( !trivialProps(doc,'data') ){
//                 items.push(doc.data())
//             }
//         })
//     }       

//     res['success'] = true;
//     res['message'] = `found slate and ${items.length} slots`
//     res['slate'] = root;
//     res['slots'] = items;
//     return res;
// }


// /******************************************************
//     @write slate
// ******************************************************/

// /**
//  *
//  * @Use: make a new slate 
//  * 
//  **/
// async function createSlate({ userID, vendorID, network, num_row, num_col, name, about, then }){


//     var res = default_fn_response();

//     if ( trivialString(userID) || trivialString(network) ){
//         return then(res);
//     }    

//     // check user and tree exist
//     let user = await getUserByVendorID({ userID: userID, vendorID: vendorID, withPrivateKey: false });

//     if ( trivialProps(user,'userID') ){
//         res['message'] = 'user dne'
//         return then(res);
//     }       

//     const { address, privateKey } = make_production_web3_account();
//     let id = address; // uuid.v4();

//     let _num_row  = trivialNum(num_row) ? 10 : Number(num_row) 
//     let _num_col  = trivialNum(num_col) ? 10 : Number(num_col)
//     let slate_dim = _num_row * _num_col

//     var blob = {
//         ID       : id,
//         slateID  : id,
//         userID   : userID,
//         network  : network,

//         // eth acct
//         eth_address: address,

//         // project name + about
//         name     : name  ?? "",
//         about    : about ?? "",

//         // dim
//         num_items: trivialNum(slate_dim) ? 100 : Number(slate_dim),
//         num_row  : _num_row,
//         num_col  : _num_col,
        
//         timeStampCreated : swiftNow(),
//         timeStampLatest  : swiftNow(),       

//     }

//     // @Important: store keys on seraprate server
//     let key_blob = {
//         address    : address,
//         privateKey : privateKey,
//         network    : network_flow_to_eth(network),
//     }

//     // store keys, if fail then fail
//     await store_keys_in_lumo_core({
//         post_params: key_blob,
//         then: async ({ success, message, data }) => {

//             if ( !success ){

//                 return then({ 
//                     success: false,
//                     message: 'failed to initiate an eth address',
//                     data: blob, 
//                 });

//             } else {

//                 let did = await fire.firestore
//                     .collection(DbPaths.slate_root)
//                     .doc( id )
//                     .set( blob )
//                     .then(_ => true)
//                     .catch(e => false)

//                 if ( !did ){

//                     res['message'] = 'failed to write to db'
//                     return then(res);

//                 } else {                    

//                     // instantiate the entire grid
//                     let x_idx = Array.from({length: _num_col}, (v,i) => i);
//                     let y_idx = Array.from({length: _num_row}, (v,i) => i);

//                     await _make_slots({ slate_id: id, userID: userID, num_row: _num_row, num_col: _num_col });

//                     return then({ success: true, message: 'created project', data: blob });
//                 }
//             }
//         }});
// }


// /**
//  * 
//  * @use: make all slots in slate 
//  * 
//  **/
// async function _make_slots({ slate_id, userID, num_row, num_col }){

//     // instantiate the entire grid
//     let x_idx = Array.from({length: num_col}, (v,i) => i);
//     let y_idx = Array.from({length: num_row}, (v,i) => i);

//     let outer_product = (a, b) => [].concat(...a.map(a => b.map(b => [].concat(a, b))));
//     let matrix = outer_product(x_idx,y_idx);

//     let _items = matrix.map(([ a, b ]) => {
//         let blob = {
//             ID              : `${slate_id}_${a}_${b}`,
//             slate_slot_id   : `${slate_id}_${a}_${b}`,
//             slate_id        : slate_id,
//             x_idx           : a,
//             y_idx           : b,
//             creatorUserID   : userID,
//             bookingUserID   : "",
//             projectID       : "",
//             storyboardID    : "",
//             in_production   : false,
//             timeStampLatest : swiftNow(),
//             timeStampCreated: swiftNow(),
//         }
//         return blob;
//     });

//     let log_all = await _items.map(async (blob) => {
//         let did = await fire.firestore
//             .collection(DbPaths.slate_slots)
//             .doc( blob.ID )
//             .set( blob )
//             .then(_ => true)
//             .catch(e => false)
//         return did;
//     })
//     await Promise.all(log_all);

//     return true;
// }


// /******************************************************
//     @write slate-slot
// ******************************************************/

// /**
//  *
//  * @use: determine  if slot is occup9ed or not
//  * 
//  **/
// async function can_book_slot({ project_address, slate_id, slate_seed_idx_x, slate_seed_idx_y }){

//     var res = default_fn_response({ slot: {}, did_book: false, can_book: false, alt_slot: {} });

//     if ( trivialNum(slate_seed_idx_y) || trivialNum(slate_seed_idx_x) ){
//         res['message'] = 'please specify slate index'
//         return res;
//     }

//     let { slate, slots } = await fetch_each_slate({ slate_id: slate_id, full: true });
//     let booking_items = slots.filter(s => 
//         Number(s.x_idx) === Number(slate_seed_idx_x) && Number(s.y_idx) === Number(slate_seed_idx_y) 
//     );

//     let free_slots = slots
//         .filter(s => trivialString(s.bookingUserID) && trivialString(s.projectID))
//         .sort((s,t) => {
//             let ds = Math.abs(s.x_idx - slate_seed_idx_x) + Math.abs(s.y_idx - slate_seed_idx_y)
//             let dt = Math.abs(t.x_idx - slate_seed_idx_x) + Math.abs(t.y_idx - slate_seed_idx_y);
//             return ds - dt;
//         })


//     let alt_slot   = free_slots.length > 0 ? free_slots[0] : {};
//     let did_book_already = slots.filter(s => s.projectID === project_address)

//     if (  trivialProps(slate,'ID') ){
//         res['message'] = 'slate dne'
//         return res;
//     }

//     if (booking_items.length === 0){
//         res['message'] = 'slot at specified index dne';
//         return res;
//     }

//     if ( did_book_already.length > 0){
//         res['did_book'] = true;
//         res['message'] = 'you already booked'
//         return res;
//     }

//     let _booking_item = booking_items[0];    

//     if ( !trivialString(_booking_item.bookingUserID) || !trivialString(_booking_item.projectID) ){
//         res['success']  = true;
//         res['can_book'] = false;
//         res['alt_slot'] = alt_slot
//         res['message']  = 'this item has been booked!'
//         res['slot']     = _booking_item;
//         return res;
//     } else {
//         return { 
//             success  : true, 
//             can_book : true, 
//             message  : 'can book slate', 
//             slot     : _booking_item, 
//             alt_slot : alt_slot,
//         }
//     }
// }

// /**
//  * 
//  * @Use: book slate at  `(x,y)`
//  * @TODO: test
//  * 
//  **/
// async function bookSlate({ 
//     userID, 
//     vendorID, 
//     slate_id, 
//     project_address, 
//     slate_seed_idx_x, 
//     slate_seed_idx_y, 
//     force_book,
//     num_slots 
// }){

//     var res = default_fn_response({ data: {} });

//     if ( trivialNum(slate_seed_idx_y) || trivialNum(slate_seed_idx_x) ){
//         res['message'] = 'please specify slate index'
//         return res;
//     }

//     let user = await getUserByVendorID({ userID: userID, vendorID: vendorID, withPrivateKey: false });

//     if ( trivialProps(user,'userID') ){
//         res['message'] = 'user dne'
//         return res;
//     }      

//     let { 
//         success, 
//         can_book,
//         did_book, 
//         slot,
//         alt_slot, 
//         message,
//     } = await can_book_slot({ 
//         slate_id, 
//         slate_seed_idx_x, 
//         slate_seed_idx_y, 
//         project_address: project_address, 
//     });

//     if ( !success || did_book ){
//         res['message'] = message;
//         return res;
//     }

//     var update = {
//         bookingUserID: userID,
//         projectID: project_address,
//         timeStampLatest: swiftNow(),
//     }

//     if ( can_book && !trivialProps(slot,'ID') ){    

//         let did = await fire.firestore
//             .collection(DbPaths.slate_slots)
//             .doc( slot.ID )
//             .update(update)
//             .then(_ => true)
//             .catch(e => false)

//         res['success'] = did;
//         res['message'] = did ? 'booked!' : 'server hiccup';
//         return res;

//     } else if ( !can_book && force_book && !trivialProps(alt_slot,'ID') ){
    
//         let did = await fire.firestore
//             .collection(DbPaths.slate_slots)
//             .doc( alt_slot.ID )
//             .update(update)
//             .then(_ => true)
//             .catch(e => false)

//         res['success'] = did;
//         res['message'] = did ? 'booked!' : 'server hiccup';
//         return res;

//     } else {

//         res['message'] = message;
//         return res;
//     }

// }

// /**
//  *
//  * @use: migrate all orphaned projects
//  *       to this slate
//  * 
//  **/
// async function migrate_orphans(){

//     var res = default_fn_response();

//     let { data } = await getSlates();
//     const slate_id = data.length > 0 
//         ? ( data[0].slateID ?? "")
//         : ""

//     if ( trivialString(slate_id) ){
//         res['message'] = `found ${data.length} slates`
//         return res;
//     }

//     var k = 0;
//     var succ_k = 0;

//     const projects = await getProjects();

//     // const book_all = await ([4]).map(async (p) => {
//     //     // const { eth_address, userID } = p
//     //     let res = await bookSlate({
//     //         userID: 'XvXbBfAT4SPoY4zTzClnWdUqs513',
//     //         vendorID: "",
//     //         slate_id: slate_id,
//     //         project_address: '0x0544CFe3Fc9DEe8c2C78953e81fBC1bd775CB99e',
//     //         slate_seed_idx_x: 0,
//     //         slate_seed_idx_y: p,
//     //         force_book: false,
//     //         num_slots: 1,
//     //     })
//     //     k += 1
//     //     succ_k += (res.success ? 1 : 0)
//     // })    

//     // const book_all = await (projects.data ?? []).map(async (p) => {
//     //     const { eth_address, userID } = p
//     //     let res = await bookSlate({
//     //         userID: userID,
//     //         vendorID: "",
//     //         slate_id: slate_id,
//     //         project_address: eth_address,
//     //         slate_seed_idx_x: 0,
//     //         slate_seed_idx_y: k,
//     //         force_book: true,
//     //         num_slots: 1,
//     //     })
//     //     k += 1
//     //     succ_k += (res.success ? 1 : 0)
//     // })

//     // await Promise.all(book_all);

//     res['success'] = true;
//     res['message'] = `booked ${succ_k}/${projects.data.length} projects`
//     return res;

// }

// /******************************************************
//     @export
// ******************************************************/


// exports.createSlate = createSlate;
// exports.bookSlate   = bookSlate;
// exports.can_book_slot = can_book_slot;

// exports.getSlates   = getSlates;
// exports.fetch_each_slate = fetch_each_slate
// exports.migrate_orphans = migrate_orphans;







