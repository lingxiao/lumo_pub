//
//  TwitterModel.swift
//  Lumo
//
//  Created by lingxiao on 9/19/22.
//


import Foundation
import Firebase
import Combine

//MARK: -  twitter item model

class TwitterModel: ObservableObject, Equatable, Hashable, Comparable {

    // id info
    var id         : RewardID = ""
    var twitter_id : RewardID = ""
    var rand_id    : String = "\(UUID())"

    var name: String = ""
    var about: String = ""
    var twitterUserName : String = ""
    var website_url : String = ""
    var profile_image : String = ""

    var twitter_followers_count : Int = 0
    var twitter_following_count : Int = 0
    
    var timeStampLatest   : Int = 0
    var timeStampLatestPP : String = ""
    var timeStampCreated  : Int = 0
    var timeStampCreatedPP: String = ""
    
    var isTrivial: Bool = false
    
    // image of submitted user
    // social of submitted user

    static func == (lhs: TwitterModel, rhs: TwitterModel) -> Bool {
        return rhs.id == lhs.id
    }
    
    static func <(lhs: TwitterModel, rhs: TwitterModel) -> Bool {
        lhs.twitter_followers_count < rhs.twitter_followers_count
    }
    
    static func mempty() -> TwitterModel {
        let m = TwitterModel([:]);
        m.name = "@Hello";
        m.twitter_followers_count = 234
        m.about = lorem;
        return m;
    }
    
    static func trivial() -> TwitterModel {
        let m = TwitterModel([:]);
        m.isTrivial = true
        return m;
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(self.twitter_id)
    }
        
    init( _ mraw: [String:Any]? ){

        self.id = mparseString(mraw, at: "ID");
        self.twitter_id = mparseString(mraw, at: "ID");

        self.name  = mparseString(mraw, at: "name");
        self.about = mparseString(mraw, at: "about");
        self.twitterUserName = mparseString(mraw, at: "twitterUserName");
        self.website_url   = mparseString(mraw, at: "website_url");
        self.profile_image = mparseString(mraw, at: "profile_image");

        self.twitter_followers_count = mparseInt(mraw, at: "twitter_followers_count");
        self.twitter_following_count = mparseInt(mraw, at: "twitter_following_count");
        
        self.timeStampCreated   = mparseInt(mraw, at: "timeStampCreated");
        self.timeStampCreatedPP = mparseString(mraw, at: "timeStampCreatedPP");
        self.timeStampLatest    = mparseInt(mraw, at: "timeStampLatest");
        self.timeStampLatestPP  = mparseString(mraw, at: "timeStampLatestPP");
    }
    
    /// @Use: search if str is contained in this user's name, bio or username
    /// - Parameter str: search parameter
    /// - Returns: if contains, then return true
    func contains(_ str: String?) -> Bool {
        guard let str = str else {
            return false
        }
        let lstr = str.lowercased()
        let b1 = name.lowercased().contains(lstr)
        let b2 = about.lowercased().contains(lstr)
        let b3 = twitterUserName.lowercased().contains(lstr)
        let b4 = website_url.lowercased().contains(lstr)
        return b1 || b2 || b3 || b4
    }
    
    func pp_name() -> String {
        if self.name != "" {
            return self.name
        } else {
            return self.twitterUserName;
        }
    }

    
    func profile_url() -> URL? {
        if let url = URL(string: profile_image) {
            return url
        } else {
            return nil
        }
    }
        
    
    /// @use: open twitter profile for this user
    /// - Returns: effect: navigation
    func nav_to_profile() -> Void {
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


