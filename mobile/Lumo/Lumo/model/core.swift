//
//  core.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//



import Foundation
import SwiftUI
import Firebase

//MARK: - define global staging or production env.

//@Use: read GoogleService-info file and check if it's production
func GLOBAL_STAGING() -> Bool {
    if let infoPlistPath = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"){
        if let dict = NSDictionary(contentsOfFile: infoPlistPath) as? [String: Any] {
            if let current_project_id = dict["PROJECT_ID"] as? String {
                return current_project_id != "lumoproductionclient";
            } else {
                return true;
            }
        } else {
            return true;
        }
    } else {
        return true;
    }
}


//MARK: - web3 params

enum Networks {
    case mainnet
    case goerli
    case flow_testnet
    case flow_mainnet
    
    var description: String {
        switch self {
        case .mainnet       : return "0x1"
        case .goerli        : return "0x5"
        case .flow_testnet  : return "flow_testnet"
        case .flow_mainnet  : return "flow_mainnet"
        }
    }
}

func FLOW_NETWORK() -> String {
    if ( GLOBAL_STAGING() ){
        return String(describing: Networks.flow_testnet)
    } else {
        return String(describing: Networks.flow_mainnet)
    }
}

func ETH_NETWORK() -> String {
    if ( GLOBAL_STAGING() ){
        return String(describing: Networks.goerli)
    } else {
        return String(describing: Networks.mainnet)
    }
}


//MARK: - typealias + enums

typealias UserID       = String
typealias ChainID      = String
typealias BlockID      = String
typealias ItemID       = String
typealias RewardID     = String
typealias TwitterID    = String
typealias NominationID = String

typealias TokenID   = String
typealias FullURL   = String
typealias MediumURL = String
typealias SmallURL  = String
typealias Message   = String

enum Permission {
    case admin
    case t1
    case t2
    case t3
    case none
    
    var str: String {
        switch self {
        case .admin: return "admin";
        case .t1: return "t1";
        case .t2: return "t2";
        case .t3: return "t3";
        case .none: return "none"
        }
    }
    
    func parse(_ str: String) -> Permission {
        if str == Permission.admin.str {
            return .admin
        } else if str == Permission.t1.str {
            return .t1
        } else if str == Permission.t2.str {
            return .t2
        } else if str == Permission.t3.str {
            return .t3
        } else {
            return .none;
        }
    }
}


//MARK: - upload file queue object

class TokenMediaUpload : NSObject {
    
    var tokenID: String
    var images : [UIImage?]
    var videos : [String?]
    var collabs: [User?]
    
    var did_upload_images  = false
    var did_upload_videos  = false
    var did_upload_collabs = false
    
    init( with tokID: String, images: [UIImage?], videos: [String?], collabs: [User?]){
        self.tokenID = tokID
        self.images  = images
        self.videos  = videos
        self.collabs = collabs
    }
    
}



//MARK: - upload image to firebase storage
 

func uploadImageToFireStore( to path: String,  with data: Data?, _ then: @escaping (Bool, String) -> Void ){
    
    guard let data = data else { return then(false,"") }
    
    let storageRef = Storage.storage().reference().child(path)

    storageRef.putData( data, metadata:nil){ (metadata,error) in

        guard let _ = metadata else {
            return then(false,"")
        }
        
        storageRef.downloadURL { (url, error) in
            guard let downloadURL = url else {
                return then(false, "")
            }
            let url = String(describing: downloadURL)
            return then( true, url )
        }
    }
}


func uploadVideoToFireStore( to path: String, with url: String, _ then: @escaping(Bool,String) -> Void){
    
    // File located on disk
    if let localFile = URL(string: url) {
        
        // Create a reference to the file you want to upload
        let storageRef = Storage.storage().reference().child(path)
        
        storageRef.putFile(from: localFile, metadata: nil) { metadata, error in
            
            guard let _ = metadata else {
                return then(false,"")
            }
                        
            storageRef.downloadURL { (url, error) in
                guard let downloadURL = url else {
                    return then(false, "")
                }
                let url = String(describing: downloadURL)
                return then( true, url )
            }
        }
    } else {
        
        then(false, "invalid URL")
    }
}


//MARK: - POST endpoints


// @use: standard API response
struct API_Response {
    let success: Bool
    let message: String
    let data   : [String:Any]
}

// @use: trivial api_response with failure message
func api_res_fail( _ xs: String ) -> API_Response {
    return API_Response(success: false, message: xs, data: [:]);
}


/**
 *
 * @Use: set staging and production endpoints
**/
let API_root_production = "https://us-central1-lumoproductionserver.cloudfunctions.net/app/api/v1";
let API_root_staging    = "https://us-central1-staginglumoserver.cloudfunctions.net/app/api/v1";

/**
 *
 * @use: Get correct API end point per
 *       depending on which env. you are in
 *
**/
func API_ROOT() -> String {
    if ( GLOBAL_STAGING() ){
        return API_root_staging;
    } else {
        return API_root_production;
    }
}

let vendorID_production     = "0xD5E0379964ec3ae2fd51F62D7B3F92d8Cc0F5300";
let vendorSecret_production = "0x5598c4ac92af90fe8f21301010547da44c37266a3a1fbc2781f6df8e6c598029";

let vendorID_staging     = "0xD446DDb1a51bAc81E959fFE8441f712a248e6047";
let vendorSecret_staging = "0x259a54ddb5790379735f66466bbd0ee8a189123096fe74a0a3ed7541d98d9cdb";

// @use: vendorID for post
func vendorID() -> String {
    if ( GLOBAL_STAGING() ){
        return vendorID_staging;
    } else {
        return vendorID_production;
    }
}

// @use: vendorID for post
func vendorSecret() -> String {
    if ( GLOBAL_STAGING() ){
        return vendorSecret_staging;
    } else {
        return vendorSecret_production;
    }
}


// @Use: firebase db endpoints
enum API_Endpoint {
    
    // accounts
    case create_user
    case get_user
    case edit_user
    case try_auth_on_mobile
    case did_auth_on_mobile
    case offchain_balance_of_lumo
    
    // stripe
    case create_user_stripe_account
    case does_user_have_stripe_customer_id
    
    // burn events
    case create_chain
    case update_chain_root
    
    // proscial actions
    case sign_manifesto
    case make_invite_code
    case nominate_leader
    case gift_lumo_to_nominee
    case accept_nomination
    case buy_lumo_token_on_polygon

    // read
    case fetch_chain
    case fetch_all_chains
    case fetch_all_nominations_for
    case fetch_my_signatures
    case fetch_chain_items
    case fetch_recent_rewards
    case fech_nomination
    case fetch_chain_containing
    
    // read web3
    case fetch_all_tokens
    case fetch_all_tokens_by
    
    // qr
    case gen_token_qr_code_seed
    case read_token_qr_code
    
    // merch
    case get_all_contracts_for_burn
    case buy_nft_offchain
    case write_social_chain_drop_root
    
    // twitter graph
    case get_twitter_graph
    case get_twitter_account
        
    var str: String {
        switch self {
            
            /// auth users
            case .try_auth_on_mobile: return "\(API_ROOT())/account/try_auth_on_mobile"
            case .did_auth_on_mobile: return "\(API_ROOT())/account/did_auth_on_mobile"

            case .get_user   : return "\(API_ROOT())/account/get_user";
            case .edit_user  : return "\(API_ROOT())/account/edit_user";
            case .create_user: return "\(API_ROOT())/account/createUserAccount";
            
            // stripe
            case .create_user_stripe_account: return "\(API_ROOT())/stripe/create_user_stripe_account";
            case .does_user_have_stripe_customer_id: return "\(API_ROOT())/stripe/does_user_have_stripe_customer_id";
            
            // balance + buy lumo
            case .offchain_balance_of_lumo : return "\(API_ROOT())/burn/offchain_balance_of_lumo";
            case .buy_lumo_token_on_polygon: return "\(API_ROOT())/burn/buy_lumo_token_on_polygon";

            /// burn events
            case .create_chain     : return "\(API_ROOT())/burn/create_chain";
            case .update_chain_root: return "\(API_ROOT())/burn/update_chain_root";
            
            case .fetch_chain        : return "\(API_ROOT())/burn/fetch_chain" ;
            case .fetch_all_chains   : return "\(API_ROOT())/burn/fetch_all_chains";
            case .fetch_chain_items  : return "\(API_ROOT())/burn/fetch_chain_items";
            case .fetch_my_signatures: return "\(API_ROOT())/burn/get_my_signatures";
            case .fetch_chain_containing: return "\(API_ROOT())/burn/fetch_chain_containing";

            case .fetch_recent_rewards: return "\(API_ROOT())/burn/fetch_recent_rewards";
            case .fetch_all_nominations_for: return "\(API_ROOT())/burn/fetch_all_nominations_for";
            case .fech_nomination: return "\(API_ROOT())/burn/fech_nomination";

            case .sign_manifesto   : return "\(API_ROOT())/burn/sign_manifesto";
            case .gift_lumo_to_nominee   : return "\(API_ROOT())/burn/gift_lumo_to_nominee";

            case .make_invite_code : return "\(API_ROOT())/burn/make_invite_code";
            case .nominate_leader  : return "\(API_ROOT())/burn/nominate_leader";
            case .accept_nomination: return "\(API_ROOT())/burn/accept_nomination";
            
            // qr
            case .gen_token_qr_code_seed: return "\(API_ROOT())/burn/gen_token_qr_code_seed";
            case .read_token_qr_code    : return "\(API_ROOT())/burn/read_token_qr_code";
            
            // merch
            case .get_all_contracts_for_burn: return "\(API_ROOT())/burn/get_all_contracts_for_burn";
            case .buy_nft_offchain   : return "\(API_ROOT())/burn/buy_nft_offchain";
            case .fetch_all_tokens   : return "\(API_ROOT())/burn/fetch_all_tokens";
            case .fetch_all_tokens_by: return "\(API_ROOT())/burn/fetch_all_tokens_by";
            case .write_social_chain_drop_root: return "\(API_ROOT())/burn/write_social_chain_drop_root";
            
            // twitter
            case .get_twitter_graph: return "\(API_ROOT())/burn/get_twitter_graph";
            case .get_twitter_account: return "\(API_ROOT())/burn/get_twitter_account";
            
        }
    }
    
}

//MARK: - API call utils


/// make post parameters
/// - Parameter params: params: parameters needed
/// - Returns: a url query list
func make_post_params( params: [URLQueryItem] ) -> [URLQueryItem]{
    let base : [URLQueryItem] = [
        URLQueryItem(name: "vendorID", value: vendorID()),
        URLQueryItem(name: "vendorSecret", value: vendorSecret()),
        URLQueryItem(name: "network", value: FLOW_NETWORK()),
    ];
    return base + params;
}

func go_axios_post(
    with params: [URLQueryItem],
    url:  String,
    parse: Bool = true,
    succ: @escaping ([String:Any]) -> Void,
    succP: @escaping (API_Response) -> Void,
    fail: @escaping (String) -> Void
){

    guard url != "" else {
        return fail("Inavlid URL: cannot be empty string")
    }
    
    guard params.count > 0 else {
        return fail("invalid POST params")
    }
    
    guard let url = URL(string: url) else {
        return fail("invalid url")
    }
    
    guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
        return fail("failed to initalize components")
    }

    components.queryItems = params

    guard let query = components.url?.query else {
        return fail("invalid query: cannot be constructed")
    }
    
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.httpBody = Data(query.utf8)
    
    // create session obj.
    let session = URLSession.shared
    
    //create dataTask using the session object to send data to the server
    let task = session.dataTask(with: request as URLRequest, completionHandler: { data, response, error in

        guard error == nil else {
            return fail("Failed: \(String(describing: error?.localizedDescription))")
        }

        guard let data = data else {
            return fail("POST failed with no data")
        }
        

        do {
            //create json object from data
            //.mutableContainers .allowFragments
            if let json = try JSONSerialization.jsonObject(with: data, options: .allowFragments)
                as? [String: Any] {
                if ( parse ){
                    guard let _succ = json["success"] as? Bool else {
                        return succ(json)
                    }
                    guard let message = json["message"] as? String else {
                        return succ(json)
                    }
                    guard let data = json["data"] as? [String:Any] else {
                        return succ(json)
                    }
                    return succP(API_Response(success: _succ, message: message, data: data))
                } else {
                    return succ(json)
                }
            }
        } catch let error {
            return fail("\(error.localizedDescription)")
        }
    })
    
    // run task
    task.resume()
       
}
