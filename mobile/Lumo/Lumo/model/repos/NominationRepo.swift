//
//  NominationRepo.swift
//  Lumo
//
//  Created by lingxiao on 9/20/22.
//


import Foundation

//MARK: - protocol

protocol NominationRepoProtocol {
    func fetch( at nomid: String, _ then : @escaping(NominationModel?) -> Void ) -> Void
    func fetch( for uid: String, _ then: @escaping(Bool, String, [NominationModel]) -> Void ) -> Void
}


//MARK: - non-fungible API Read

class NominationRepo : ObservableObject, NominationRepoProtocol {
    
    func fetch( at inviteCode: String, _ then : @escaping(NominationModel?) -> Void ){
        let params = make_post_params(params: [
            URLQueryItem(name: "inviteCode", value: inviteCode)
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.fech_nomination.str,
            parse: true,
            succ: {(res) in
            },
            succP: {(res) in
                if res.success {
                    let nom = NominationModel(res.data)
                    return then(nom);
                } else {
                    return then(nil)
                }
            },
            fail: {(err) in
                return then(nil)
            });
    }

    func fetch(for tid: String, _ then: @escaping (Bool, String, [NominationModel]) -> Void) {
        let params = make_post_params(params: [
            URLQueryItem(name: "tgtTwitterUserID", value: tid)
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.fetch_all_nominations_for.str,
            parse: false,
            succ: {(res) in
                guard let data = res["data"] as? [[String:Any]] else {
                    let str = res["message"] as? String ?? "Cannot parse nominations";
                    return then(false, str, [])
                }
                let noms = data.map{ NominationModel($0) }
                then(true, "parsed \(noms.count) models", noms)
            },
            succP: {(res) in return },
            fail: {(err) in
                return then(false, "\(err)", [])
            });
    }
    
        
    /// @use: make invite code
    /// - Parameter then: return invite code
    public func make_invite_code( then: @escaping (String) -> Void ){
        go_axios_post(
            with: make_post_params(params: []),
            url: API_Endpoint.make_invite_code.str,
            parse: false,
            succ: {(res) in
                guard let code = res["code"] as? String else {
                    return then("")
                }
                then(code);
            },
            succP: {(res) in return },
            fail: {(err) in
                then("")
            })
    }


    /// @Use: nominate new burn leader by:
    ///     1. creating new invite in db
    ///     2. generate invite code and return .
    /// - Parameters:
    ///   - user: nominee
    ///   - burn: burm event
    ///   - then: continue fn
    public func nominate_burn_leader(
        from authed_uid: String,
        for user: TwitterModel?,
        at burn: BurnModel?,
        with code: String,
        then: @escaping(Bool, String, NominationModel?) -> Void
    ){
        guard let burn = burn else {
            return then(false, "We cannot find this burn", nil)
        }
        guard code != "" else {
            return then(false, "Please provide referral code", nil)
        }
        guard authed_uid != "" else {
            return then(false, "Please authenticate first", nil)
        }
        let is_gen = user == nil;
        let params = make_post_params(params: [
            URLQueryItem(name: "userID"    , value: authed_uid),
            URLQueryItem(name: "chain_id"  , value: burn.chain_id),
            URLQueryItem(name: "block_id"  , value: ""),
            URLQueryItem(name: "clientInviteCode", value: code),
            URLQueryItem(name: "tgtUserID" , value: ""),
            URLQueryItem(name: "tgtTwitterName", value: user?.twitterUserName ?? ""),
            URLQueryItem(name: "tgtTwitterUserID", value: user?.twitter_id ?? ""),
            URLQueryItem(name: "isGeneral", value: is_gen ? "true" : "false")
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.nominate_leader.str,
            parse: false,
            succ: {(res) in
                guard let succ = res["success"] as? Bool else {
                    return then(false, "Failed to create invite", nil)
                }
                guard let message = res["message"] as? String else {
                    return then(false, "Failed to create invite", nil)
                }
                guard let data = res["data"] as? [String:Any] else {
                    return then(false, message, nil)
                }
                if succ {
                    let nom = NominationModel(data);
                    then(true, "\(message)", nom)
                } else {
                    then(false, message, nil)
                }
            },
            succP: {(res) in },
            fail: {(err) in
                then(false, "Failed to confirm code: \(err)",nil)
            })
    }
}



//MARK: - nomination Model

class NominationModel: Identifiable, Decodable, Hashable, Comparable {

    // id info
    var id     : String = ""
    var inviteCode: String = ""
    var chain_id: String = ""
    var block_id: String = ""
    var rand_id : String = "\(UUID())"
    
    var isGeneral: Bool = false
    var claimed: Bool = false
    var claimedUserID: String = ""
    
    var tgtTwitterName: String = ""
    var tgtTwitterUserID: String = ""

    var userID : String = ""
    var hostName: String = ""

    var timeStampLatest: Int = 0
    var timeStampLatestPP: String = ""
    
    static func == (lhs: NominationModel, rhs: NominationModel) -> Bool {
        return lhs.inviteCode == rhs.inviteCode
    }
    
    static func <(lhs: NominationModel, rhs: NominationModel) -> Bool {
        lhs.timeStampLatest < rhs.timeStampLatest
    }
    
    static func mempty() -> NominationModel {
        let m = NominationModel([:]);
        return m;
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(self.id)
    }
    
    init( _ mraw: [String:Any]? ){

        guard let raw = mraw else { return }

        self.id         =  mparseString(mraw, at: "inviteCode");
        self.inviteCode =  mparseString(mraw, at: "inviteCode");

        self.userID        = mparseString(mraw, at: "userID");
        self.hostName      = mparseString(mraw, at: "hostName");
        self.claimedUserID = mparseString(mraw, at: "claimedUserID");

        self.chain_id         = mparseString(mraw, at: "chain_id");
        self.block_id         = mparseString(mraw, at: "block_id");
        self.tgtTwitterName   = mparseString(mraw, at: "tgtTwitterName");
        self.tgtTwitterUserID = mparseString(mraw, at: "tgtTwitterUserID");

        self.isGeneral = raw["isGeneeral"] as? Bool ?? false;
        self.claimed   = raw["claimed"] as? Bool ?? false;

        self.timeStampLatest   = raw["timeStampLatest"] as? Int ?? 0
        self.timeStampLatestPP = raw["timeStampLatestPP"] as? String ?? ""
        
    }
    
    public func setClaimed(){
        self.claimed = true
    }
}

