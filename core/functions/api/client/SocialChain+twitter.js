/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: mine twitter graph 
 * @Date   : 9/18/2022
 * @DOc    : https://github.com/plhery/node-twitter-api-v2/blob/master/doc/v2.md#Followers
 * @Doc    : https://github.com/PLhery/node-twitter-api-v2/blob/77f48eb5e06e2a15fd0f6906adecc1678801f75d/doc/helpers.md
 * @Doc    : https://developer.twitter.com/en/support/twitter-api/error-troubleshooting
 * @Doc    : https://github.com/twitterdev/Twitter-API-v2-sample-code/blob/main/User-Lookup/get_users_with_bearer_token.js#L32
 * 
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
// const axios = require('axios')
const uuid  = require('uuid');
const { getStorage, ref, uploadBytesResumable, getDownloadURL } = require('firebase-admin/storage');

const {
    fetch_all,
    fetch_many,
    fetch_one,
    write_to_db,
    update_db,
    storageRef,
} = require('./../fire');


const { 
    swiftNow, 
    trivialProps, 
    trivialNum, 
    trivialString,
    ppSwiftTime,
} = require('./../utils');

const {
    DbPaths, 
    default_fn_response,
    twitter_client,
    default_db_blob,
    twitter_developer_account,
} = require('./../core');


const { 
    getUserByVendorID, 
} = require('./accounts');

const needle = require('needle');
const client = require('https');


/******************************************************/
// @update user info


// main();
// async function main(){
//     let { following, followers } = await get_twitter_graph({ userID:'Sp5DX3SsRJhmLELxBd2i52ueuDy1' });
//     // console.log( await get_twitter_graph({ userID: 'Sp5DX3SsRJhmLELxBd2i52ueuDy1' }) )
//     // await sync_twitter_following({
//         // twitterUserID:'ling_xiao_ling'
//     // })
// }


/**
 * 
 * @use: update user info w/ twitter's user profile info
 * 
**/
async function sync_twitter_profile({ userID, twitterUserName }){

    if ( trivialString(userID) || trivialString(twitterUserName) ){
        return
    }

    let user = await fetch_twitter_profile(twitterUserName);
    if ( trivialProps(user,'id') ){
        return;
    }

    const {
        id,
        username,
        verified,
        profile_image_url,
        name,
        public_metrics,
        url,
        description,
    } = user;

    await update_db({
        ID: userID,
        path: DbPaths.users,
        blob: { 
            twitterUserID          : id,
            twitterUserName        : twitterUserName,
            name                   : (username ?? name) ?? twitterUserName, 
            twitter_followers_count: public_metrics.followers_count ?? 0,
            twitter_following_count: public_metrics.following_count ?? 0,
            twitter_tweet_count    : public_metrics.tweet_count ?? 0,
            twitter_verified       : verified ?? false,                
            profile_image          : profile_image_url ?? "", 
            about                  : description ?? "",
            website_url            : url ?? ""
        }
    });

    // upddate follower/following edge;
    await sync_twitter_followers({ twitterUserID: id });
    await sync_twitter_following({ twitterUserID: id });
    return;

}


// @use: get 1st 100 profiles twitterUserID is followed by
//       log profile and following edge
async function sync_twitter_followers({ twitterUserID }){   

    if ( trivialString(twitterUserID) ){
        return;
    }

    try {

        const client = twitter_client();
        const readOnlyClient = client.readOnly;

        const followers  = await client.v2.followers(twitterUserID)

        if ( trivialProps(followers,'data') ){
            return;
        }

        // get the first 100 followers;
        const { data, meta } = followers;

        let log_all = await (data ?? []).map(async (data) => {
            if ( trivialProps(data,'id') ){
                return false;
            }

            const{  id, name, username } = data;

            let existing_user = await get_twitter_account({ twitter_id: id });
            if ( trivialProps(existing_user,'ID') ){
                var user_blob = default_db_blob({
                    userID: "",
                    twitterUserID: id,
                    name: name,
                    twitterUserName: username,
                });
                user_blob["ID"] = `${id}`
                await write_to_db({
                    ID: user_blob.ID,
                    path: DbPaths.twitter_accounts,
                    blob: user_blob,
                });            
            }

            var edge_blob = default_db_blob({
                follower: id,
                following: twitterUserID,                
            })
            let eid = `${twitterUserID}_${id}`;
            edge_blob['ID'] = eid;
            await write_to_db({
                ID: eid,
                path: DbPaths.twitter_edges,
                blob: edge_blob,
            });            
            return true;
        });

        await Promise.all(log_all);

    } catch (e) {

        console.log("failed to instantiate twitter-client: ", e.message)
        return;
    } 
}


// @use: get 1st 100 profiles twitterUserID is following
//       log profile and following edge
async function sync_twitter_following({ twitterUserID }){    

    if ( trivialString(twitterUserID) ){
        return;
    }    

    try {

        const client = twitter_client();
        const readOnlyClient = client.readOnly;

        const following  = await client.v2.following(twitterUserID);

        if ( trivialProps(following,'data') ){
            return;
        }

        // get the first 100 followers;
        const { data, meta } = following;

        let log_all = await (data ?? []).map(async (data) => {

            if ( trivialProps(data,'id') ){
                return false;
            }

            const{  id, name, username } = data;

            let existing_user = await get_twitter_account({ twitter_id: id });

            if ( trivialProps(existing_user,'ID') ){
                var user_blob = default_db_blob({
                    userID: "",
                    twitterUserID: id,
                    name: name,
                    twitterUserName: username,
                });
                user_blob["ID"] = `${id}`
                await write_to_db({
                    ID: user_blob.ID,
                    path: DbPaths.twitter_accounts,
                    blob: user_blob,
                });            
            }          

            var edge_blob = default_db_blob({
                follower: twitterUserID,
                following: id,
            })
            let eid = `${id}_${twitterUserID}`;
            edge_blob['ID'] = eid;
            await write_to_db({
                ID: eid,
                path: DbPaths.twitter_edges,
                blob: edge_blob,
            });            
            return true;
        });

        await Promise.all(log_all);

    } catch (e) {

        console.log("failed to instantiate twitter-client: ", e.message)
        return;
    } 
}


/**
 * 
 * @use: when orphaned profile created, fetch twitter for profile image
 *       and donwload here, this way the user has soemthing to look
 *       at when they decide who to send tab to.
 * 
 **/
async function sync_twitter_orphan_profile({ ID, twitterUserName}){

    if ( trivialString(ID) || trivialString(twitterUserName) ){
        return
    }

    let user = await fetch_twitter_profile(twitterUserName);

    if ( trivialProps(user,'id') ){
        return;
    }

    const {
        id,
        username,
        verified,
        profile_image_url,
        name,
        public_metrics,
        url,
        description,
    } = user;

    await update_db({
        ID: ID,
        path: DbPaths.twitter_accounts,
        blob: { 
            twitterUserID          : id,
            twitterUserName        : twitterUserName,
            name                   : (username ?? name) ?? twitterUserName, 
            twitter_followers_count: public_metrics.followers_count ?? 0,
            twitter_following_count: public_metrics.following_count ?? 0,
            twitter_tweet_count    : public_metrics.tweet_count ?? 0,
            twitter_verified       : verified ?? false,                
            profile_image          : profile_image_url ?? "", 
            about                  : description ?? "",
            website_url            : url ?? ""
        }
    });

}


/******************************************************/
// @read


// @use: get acct info for twitter id
async function get_twitter_account({ twitter_id }){
    let data = await fetch_one({ path: DbPaths.twitter_accounts, field: 'ID', value: twitter_id ?? "" });
    return data;
}

    
// @use: get all following/followers of userid
async function get_twitter_graph({ userID }){

    var res = default_fn_response({ following: [], followers: [] });
    let user = await getUserByVendorID({ userID: userID, vendorID: "", withPrivateKey: false });
    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return res
    }       

    if ( trivialProps(user,'twitterUserID') ){
        res['message'] = 'user does not have twitter profile';
        return res;
    }

    const { twitterUserID } = user;

    let followers_edge = await fetch_many({ path: DbPaths.twitter_edges, field: "following", value: twitterUserID });
    let following_edge = await fetch_many({ path: DbPaths.twitter_edges, field: "follower", value: twitterUserID });

    var followers = [];
    var followings = [];

    const fetch_all_followers = ( followers_edge ?? [] ).map(async ({ follower }) => {
        let acct = await get_twitter_account({  twitter_id: follower });
        followers = followers.concat([acct])
    })
    await Promise.all(fetch_all_followers);

    const fetch_all_following =( following_edge ?? [] ).map(async ({ following }) => {
        let acct = await get_twitter_account({  twitter_id: following });
        followings = followings.concat([acct]);
    })
    await Promise.all(fetch_all_following);

    // @TODO: fetch the next 100 twitter users

    return {
        success: true,
        message: `found ${followings.length} following, and ${followers.length} followers`,
        following: followings, 
        followers: followers,
    }

}


/******************************************************/
// @utils


/**
 * 
 * @use: lookup full user data
 * @Doc: https://developer.twitter.com/en/docs/twitter-api/users/lookup/introduction
 * @Doc; https://developer.twitter.com/en/docs/twitter-api/v1/data-dictionary/object-model/user
 * @Doc: https://github.com/twitterdev/Twitter-API-v2-sample-code/blob/77f58d0977ebb7504ec7b4d16300cfad217d5043/List-lookup/List-follows-lookup/list-followers-lookup.py
 * 
 **/
async function fetch_twitter_profile(username){

    const endpointURL = "https://api.twitter.com/2/users/by?usernames="
    let { bearer_token } = twitter_developer_account();

    if ( trivialString(username) || trivialString(bearer_token) ){
        return {}
    }

    const params = {
        usernames: username, 
        "user.fields": "created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,withheld",
        "expansions": "pinned_tweet_id"
    }

    const res = await needle('get', endpointURL, params, {
        headers: {
            "User-Agent": "v2UserLookupJS",
            "authorization": `Bearer ${bearer_token}`
        }
    })

    if ( !trivialProps(res,'body') && !trivialProps(res.body, 'data') ){
        let data = res.body.data;
        return data.length > 0 ? data[0]: {}
    } else {
        return {}
    }
}


/******************************************************/
// @export


exports.sync_twitter_profile = sync_twitter_profile;
exports.sync_twitter_followers = sync_twitter_followers;
exports.sync_twitter_following = sync_twitter_following;
exports.sync_twitter_orphan_profile = sync_twitter_orphan_profile;

exports.get_twitter_account = get_twitter_account
exports.get_twitter_graph   = get_twitter_graph




