//
//  UserRepo.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//




import Foundation
import Firebase
import Combine

//MARK: - protocol

protocol userRepoProtocol {
    func fetch( at uid: String, _ then: @escaping(Bool, String, UserModel?) -> Void ) -> Void
}


//MARK: - non-fungible API Read

class UserRepo : ObservableObject, userRepoProtocol {
    
    func fetch(at uid: String, _ then: @escaping (Bool, String, UserModel?) -> Void) {
        let params = make_post_params(params: [
            URLQueryItem(name: "userID", value: uid)
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.get_user.str,
            succ: {(res) in return },
            succP: {(res) in
                return then(false, "should not have parsed", UserModel(res.data))
            },
            fail: {(err) in
                return then(false, "\(err)", nil)
            })
    }
    
}

//MARK: - User Model

struct UserModel: Identifiable, Decodable, Hashable {

    // id info
    var id     : String = ""
    var userID : String = ""
    var rand_id: String = "\(UUID())"
    
    // basic view
    var name   : String = ""
    var email  : String = ""
    var about  : String = ""
    
    // twitter
    var twitterUserID: String = ""
    var twitterUserName: String = ""
        
    // payment + alt id
    var metamask_pk: String = ""
    var custodial_ethereum_address: String = ""
    var firebase_user_token: String = ""
    var stripeCustomerId: String = ""

    // images
    var image_url: String = ""
    var profile_image: String = ""
    
    // social media
    var tikTok   : String = ""
    var instagram: String = ""
    var twitter  : String = ""
    var youtube  : String = ""
    var website  : String = ""

    var pushNotificationToken: String = ""
    
    var timeStampLatest: Int = 0
    var timeStampLatestPP: String = ""
    var queries  : [String] = [];
    
    var isTrivial: Bool = false
    
    static func == (lhs: UserModel, rhs: UserModel) -> Bool {
        let e1 = rhs.userID == lhs.userID
        let e2 = rhs.metamask_pk == lhs.metamask_pk
        let e3 = rhs.custodial_ethereum_address == rhs.custodial_ethereum_address;
        return e1 || e2 || e3;
    }
    
    static func trivial() -> UserModel {
        var m = UserModel([:]);
        m.name="iamtrivial"
        m.isTrivial = true
        return m;
    }
    
    
    init( _ mraw: [String:Any]? ){

        guard let raw = mraw else { return }

        self.id     = raw["userID"] as? String ?? ""
        self.userID = raw["userID"] as? String ?? ""
        self.twitterUserID = raw["twitterUserID"] as? String ?? "";
        
        self.name   = raw["name"] as? String   ?? ""
        self.email  = raw["email"] as? String  ?? ""
        self.about  = raw["about"] as? String  ?? ""
        self.image_url = raw["image_url"] as? String ?? ""
        self.profile_image = raw["profile_image"] as? String ?? ""
        self.twitterUserName = mparseString(mraw, at: "twitterUserName")

        self.metamask_pk         = raw["metamask_pk"] as? String ?? ""
        self.firebase_user_token = raw["firebase_user_token"] as? String ?? ""
        self.stripeCustomerId    = raw["stripeCustomerId"] as? String ?? ""
        self.custodial_ethereum_address = raw["custodial_ethereum_address"] as? String ?? ""

        self.timeStampLatest   = raw["timeStampLatest"] as? Int ?? 0;
        self.timeStampLatestPP = raw["timeStampLatestPP"] as? String ?? "";
    }
    
    func get_name() -> String {
        if name != "" {
            return name;
        } else {
            return twitterUserName
        }
    }
    
    func profile_url() -> URL? {
        if let url = URL(string: image_url) {
            return url
        } else {
            return URL(string: profile_image)
        }
    }
        
    
    /// get twitter user correspondong this this user
    /// - Parameters:
    ///   - ap: appService
    ///   - then: continue wi tiwtter user
    func get_twitter_user( with ap: AppService?, _ then: @escaping (TwitterModel?) -> Void){
        guard let ap = ap else { return then(nil) }
        ap.get_twitter_user(for: self){um in then(um) }
    }
    
    
    /// @use: open twitter profile for this user
    /// - Returns: effect: navigation
    func nav_to_twitter_profile() -> Void {
        let screenName = self.twitterUserName;
        let url_raw = "twitter://user?screen_name=\(screenName)"
        guard let appURL = URL(string: url_raw) else {
            return;
        }
        DispatchQueue.main.async {
            if UIApplication.shared.canOpenURL(appURL as URL) {
                if #available(iOS 10.0, *) {
                    UIApplication.shared.open(appURL)
                } else {
                    UIApplication.shared.openURL(appURL)
                }
            } else {
                guard let webURL = URL(string: "https://twitter.com/\(screenName)") else {
                    return;
                }
                if #available(iOS 10.0, *) {
                    UIApplication.shared.open(webURL)
                } else {
                    UIApplication.shared.openURL(webURL)
                }
            }
        }
    }
}

