//
//  NonfungibleRepo.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//



import Foundation
import SwiftUI


//MARK: - non-fungible API Read

class NonfungibleRepo : ObservableObject {
        
    // @use: fetch all contracts
    func fetch_all_contracts( for chain_id: String, _ then: @escaping(Bool,String,[ContractModel]) -> Void){
        let params = make_post_params(params: [
            URLQueryItem(name: "chain_id", value: chain_id)
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.get_all_contracts_for_burn.str,
            parse: false,
            succ: {(res) in
                guard let mconts = res["data"] as? [[String:Any]] else {
                    return then(false, "cannot decode tokens", [])
                }
                let contracts = mconts
                    .map{ self._maybe_parse(from: $0) }
                    .filter{ $0 != nil }
                    .map{ $0! }
                return then(true, "found \(contracts.count) tokens", contracts)
            },
            succP: {(res) in
                return then(false, "should not have parsed", [])
            },
            fail: {(err) in
                return then(false, "\(err)", [])
            })
    }
        
    // @use: get all tokens
    func fetch_all_toks(for userid: String, at chain_id: String, _ then: @escaping (Bool, String, [NonfungibleTok]) -> Void) {
        let params = make_post_params(params: [
            URLQueryItem(name: "chain_id", value: chain_id),
            URLQueryItem(name: "userID", value: userid)
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.fetch_all_tokens_by.str,
            parse: false,
            succ: {(res) in
                guard let mtoks = res["data"] as? [[String:Any]] else {
                    return then(false, "cannot decode tokens", [])
                }
                let toks = mtoks
                    .map{ self._maybe_parse_toks(from: $0) }
                    .filter{ $0 != nil }
                    .map{ $0! }
                return then(true, "found \(toks.count) tokens", toks)
            },
            succP: {(res) in
                return then(false, "should not have parsed", [])
            },
            fail: {(err) in
                return then(false, "\(err)", [])
            })
    }
    
    // @use: either make a token or get it from cache
    private func _maybe_parse( from raw: [String:Any]?) -> ContractModel? {
        guard let raw = raw else { return nil }
        return ContractModel(raw)
    }
    
    // @use: either make a token or get it from cache
    private func _maybe_parse_toks( from raw: [String:Any]?) -> NonfungibleTok? {
        guard let raw = raw else { return nil }
        return NonfungibleTok(raw)
    }
}

//MARK: - merch model (contract)

/// @use: model a send transaction
class ContractModel: ObservableObject, Equatable, Hashable, Comparable {
    
    // id info
    var id : String = ""
    var user_id: UserID = ""
    var rand_id: String = "\(UUID())"

    var title : String = ""
    var symbol: String = ""
    var about : String = ""
    var chain_id : String = ""
    var image_url: String = ""
    var twitter  : String = ""

    var is_paused: Bool = false
    var is_general_sale: Bool = false

    var num_editions: Int = 0
    var num_editions_presale : Int = 0;
    
    var presale_price_in_cents: Int = 0
    var price_in_cents: Int = 0;

    var timeStampLatest   : Int = 0
    var timeStampLatestPP : String = ""
    var timeStampCreated  : Int = 0
    var timeStampCreatedPP: String = ""
    var isTrivial: Bool = false;

    // purchased toks
    var toks: [NonfungibleTok] = [];
    
    static func == (lhs: ContractModel, rhs: ContractModel) -> Bool {
        return rhs.id == lhs.id
    }
    
    static func <(lhs: ContractModel, rhs: ContractModel) -> Bool {
        lhs.timeStampLatest < rhs.timeStampLatest
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(self.id)
    }
    
    static func trivial() -> ContractModel {
        let m = ContractModel([:])
        m.isTrivial = true;
        return m;
    }

        
    init( _ mraw: [String:Any]? ){

        guard let raw = mraw else { return }
        
        self.id        = mparseString(mraw, at: "ID");
        self.user_id   = mparseString(mraw, at: "userID");
        self.symbol    = mparseString(mraw, at: "token_sym");
        self.title     = mparseString(mraw, at: "title");
        self.about     = mparseString(mraw, at: "about");
        self.chain_id  = mparseString(mraw, at: "chain_id");
        self.image_url = mparseString(mraw, at: "image_url");
        self.twitter   = mparseString(mraw, at: "twitter");

        self.is_paused = raw["is_paused"] as? Bool ?? false;
        self.is_general_sale = raw["is_general_sale"] as? Bool ?? false;
        
        self.num_editions = mparseInt(mraw, at: "num_editions");
        self.num_editions_presale = mparseInt(mraw, at: "num_editions");
        self.presale_price_in_cents = mparseInt(mraw, at: "presale_price_in_cents");
        self.price_in_cents = mparseInt(mraw, at: "price_in_cents");

        self.timeStampCreated   = raw["timeStampCreated"] as? Int ?? 0
        self.timeStampCreatedPP = raw["timeStampCreatedPP"] as? String ?? ""
        self.timeStampLatest    = raw["timeStampLatest"] as? Int ?? 0
        self.timeStampLatestPP  = raw["timeStampLatestPP"] as? String ?? ""

    }
    
    func price_in_usd() -> Double {
        return Double(Double(price_in_cents)/100);
    }
    
    func media_url() -> URL? {
        let url =  URL(string: image_url)
        return url;
    }

}


//MARK: - token model


// @Use: basic `NonfungibleTok`en model
class NonfungibleTok: ObservableObject, Equatable, Hashable, Comparable {

    // id info
    var id : String = ""
    var tok_id: String = ""
    var chain_id: String = ""
    var contract_id: String = ""
    var user_id: UserID = ""
    var rand_id: String = "\(UUID())"

    var title : String = ""
    var symbol: String = ""
    var about : String = ""
    var image_url: String = ""
    var twitter  : String = ""
    var num_qr_scans: Int = 0

    var timeStampLatest   : Int = 0
    var timeStampLatestPP : String = ""
    var timeStampCreated  : Int = 0
    var timeStampCreatedPP: String = ""

    var isTrivial: Bool = false;

    // video + heavy media
    @Published var local_preview_img: Image? = nil
    
    static func == (lhs: NonfungibleTok, rhs: NonfungibleTok) -> Bool {
        lhs.timeStampLatest < rhs.timeStampLatest
    }
    
    // see: https://www.hackingwithswift.com/books/ios-swiftui/adding-conformance-to-comparable-for-custom-types
    static func <(lhs: NonfungibleTok, rhs: NonfungibleTok) -> Bool {
        lhs.timeStampLatest < rhs.timeStampLatest
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(self.id)
    }
    
    
    static func trivial() -> NonfungibleTok {
        let m = NonfungibleTok([:])
        m.isTrivial = true;
        return m;
    }

        
    // @use: parse token data
    init( _ mraw: [String:Any]? ){

        guard let raw = mraw else { return }
        
        self.id          = mparseString(mraw, at: "ID");
        self.tok_id      = mparseString(mraw, at: "tok_id");
        self.contract_id = mparseString(mraw, at: "collection_id");
        self.user_id   = mparseString(mraw, at: "userID");
        self.symbol    = mparseString(mraw, at: "token_sym");
        self.title     = mparseString(mraw, at: "title");
        self.about     = mparseString(mraw, at: "about");
        self.chain_id  = mparseString(mraw, at: "chain_id");
        self.image_url = mparseString(mraw, at: "image");
        self.twitter   = mparseString(mraw, at: "twitter");
        
        self.num_qr_scans = raw["num_qr_scans"] as? Int ?? 0;

        self.timeStampCreated   = raw["timeStampCreated"] as? Int ?? 0
        self.timeStampCreatedPP = raw["timeStampCreatedPP"] as? String ?? ""
        self.timeStampLatest    = raw["timeStampLatest"] as? Int ?? 0
        self.timeStampLatestPP  = raw["timeStampLatestPP"] as? String ?? ""
    }
    
    func get_contract( from appservice: AppService ) -> ContractModel? {
        return appservice.contracts[self.contract_id]
    }
    
}

