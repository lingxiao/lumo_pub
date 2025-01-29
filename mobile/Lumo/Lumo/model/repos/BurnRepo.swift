//
//  BurnRepo.swift
//  Lumo
//
//  Created by lingxiao on 9/15/22.
//




import Foundation
import SwiftUI

//MARK: - protocol

protocol BurnRepoProtocol {
    func fetch_one( id: String, _ then: @escaping(String,BurnModel?) -> Void ) -> Void
    func fetch_all( _ then: @escaping(Bool, String, [BurnModel]) -> Void ) -> Void
    func fetch_all( for userid: String, _ then: @escaping(Bool, String, [BurnModel]) -> Void ) -> Void
    func fetch_recent_rewards(for uid: UserID, _ then: @escaping(Bool, String, [RewardModel], [SendModel]) -> Void) -> Void
}

protocol FirebaseModelProtocol {
    func didSync() -> Void
}


//MARK: - burn API Read

class BurnRepo : ObservableObject, BurnRepoProtocol {
    
    /// @use: fetch one burn model
    /// - Parameters:
    ///   - id: burn id
    ///   - then: if succ, then create model
    func fetch_one( id: String, _ then: @escaping(String,BurnModel?) -> Void ){
        
        guard id != "" else {
            return then("no id provided", nil)
        }
        
        // fetch entire block
        let params = make_post_params(params: [
            URLQueryItem(name: "full", value: "false"),
            URLQueryItem(name: "chain_id", value: id)
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.fetch_chain.str,
            parse: false,
            succ: {(res) in
                guard let data = res["root"] as? [String:Any] else {
                    return then("ill valued data", nil)
                }
                let burn = BurnModel(data);
                return then("created burn", burn);
            },
            succP: {(res) in
                return then( "should not have parsed", nil )
            },
            fail: {(err) in
                return then( "\(err)", nil )
            })
        
    }
        
    /// @use: fetch all burns in db for burn news-feed
    func fetch_all( _ then: @escaping (Bool, String, [BurnModel]) -> Void) {
        let params = make_post_params(params: [
            URLQueryItem(name: "userID", value: "")
        ])
        return go_fetch(params){(succ, msg, burns) in then(succ, msg, burns) }
    }
    
    /// @Use: fetch all burns initiated by current user
    func fetch_all(for userid: String, _ then: @escaping (Bool, String, [BurnModel]) -> Void) {
        let params = make_post_params(params: [
            URLQueryItem(name: "userID", value: userid)
        ])
        return go_fetch(params){(succ, msg, burns) in then(succ, msg, burns) }
    }

    // @use: fetch all burrns that contains me, or have invited me
    func fetch_burns(having uid: UserID, _ then: @escaping(Bool, String, [BurnModel], [NominationModel]) -> Void){
        let params = make_post_params(params: [
            URLQueryItem(name: "userID", value: uid),
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.fetch_chain_containing.str,
            parse: false,
            succ: {(res) in
                let msg = (res["message"] as? String) ?? ""
                guard let mburns = res["chains"] as? [[String:Any]] else {
                    return then(false, "cannot decode tokens", [], [])
                }
                let burns = mburns
                    .map{ self._maybe_parse(from: $0) }
                    .filter{ $0 != nil }
                    .map{ $0! }
                if let mnoms = res["nominations"] as? [[String:Any]] {
                    let noms = mnoms
                        .map{ self._maybe_parse_nom(from: $0) }
                        .filter{ $0 != nil }
                        .map{ $0! }
                    return then(true, msg, burns, noms)
                } else {
                    return then(true, msg, burns, [])
                }
            },
            succP: {(res) in
                return then(false, "should not have parsed", [], [])
            },
            fail: {(err) in
                return then(false, "\(err)", [], [])
            })
    }

    
    
    /// get all reeent inbound rewards
    /// - Parameters:
    ///   - uid: userid
    ///   - then: contineu w/ reward and sends
    func fetch_recent_rewards(for uid: UserID, _ then: @escaping(Bool, String, [RewardModel], [SendModel]) -> Void){
        let params = make_post_params(params: [
            URLQueryItem(name: "userID", value: uid),
            URLQueryItem(name: "num_days", value: "21")
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.fetch_recent_rewards.str,
            parse: false,
            succ: {(res) in
                var sends : [SendModel] = []
                var rewards: [RewardModel] = [];
                if let msends = res["sends"] as? [[String:Any]] {
                    sends = msends.map{ SendModel($0) }
                }
                if let mrewards = res["rewards"] as? [[String:Any]] {
                    rewards = mrewards.map{ RewardModel($0) }
                }
                return then(true, "parsed",  rewards, sends);
            },
            succP: {(res) in
                return then(false, "should not have parsed", [],[])
            },
            fail: {(err) in
                return then(false, "\(err)", [],[])
            })
    }

    func go_fetch(_ params: [URLQueryItem], _ then: @escaping (Bool, String, [BurnModel]) -> Void){
        go_axios_post(
            with: params,
            url: API_Endpoint.fetch_all_chains.str,
            succ: {(res) in
                guard let mburns = res["data"] as? [[String:Any]] else {
                    return then(false, "cannot decode tokens", [])
                }
                let burns = mburns
                    .map{ self._maybe_parse(from: $0) }
                    .filter{ $0 != nil }
                    .map{ $0! }
                return then(true, "found \(burns.count) burns", burns)
            },
            succP: {(res) in
                return then(false, "should not have parsed", [])
            },
            fail: {(err) in
                return then(false, "\(err)", [])
            })
    }
    
    // @use: either make a token or get it from cache
    private func _maybe_parse( from raw: [String:Any]?) -> BurnModel? {
        guard let raw = raw else { return nil }
        return BurnModel(raw)
    }

    private func _maybe_parse_nom( from raw: [String:Any]?) -> NominationModel? {
        guard let raw = raw else { return nil }
        return NominationModel(raw);
    }

}

//MARK: - burn model


class BurnModel: ObservableObject, Equatable, Hashable, Comparable {

    // id info
    var id: String = ""
    var chain_id: String = ""
    var rand_id : String = "\(UUID())"

    var userID  : String = ""
    
    // basic view
    var name : String = ""
    var about: String = ""
    var total_lumo_gifted: Double = 0.0
    var can_receive_payment: Bool = false

    // blocks
    var items   : [ItemModel]   = [];
    var rewards : [RewardModel] = [];
    var gifts   : [GiftModel] = [];
    var nominations: [NominationModel] = [];

    var timeStampLatest   : Int = 0
    var timeStampLatestPP : String = ""
    var timeStampCreated  : Int = 0
    var timeStampCreatedPP: String = ""

    var latest_block_id: String = ""
    var timeStampLatestBlockExpire: Int = 0
    var timeStampLatestBlockExpirePP: String = ""
    
    var didSyncFull: Bool = false;
    var delegate: FirebaseModelProtocol? = nil
    
    static func == (lhs: BurnModel, rhs: BurnModel) -> Bool {
        return rhs.chain_id == lhs.chain_id
    }
    
    // see: https://www.hackingwithswift.com/books/ios-swiftui/adding-conformance-to-comparable-for-custom-types
    static func <(lhs: BurnModel, rhs: BurnModel) -> Bool {
        lhs.timeStampLatest < rhs.timeStampLatest
    }
    
    static func mempty() -> BurnModel {
        let burn = BurnModel([:]);
        burn.name = "Example Burn"
        burn.about = lorem;
        return burn;
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(self.chain_id)
    }
        
    // @use: parse token data
    init( _ mraw: [String:Any]? ){
        self.parse_root(mraw);
        self.items   = [];
        self.rewards = [];
    }
    
    private func parse_root(_ mraw: [String:Any]?){
        guard let raw = mraw else { return }

        let _id = raw["chain_id"] as? String ?? ""
        self.id       = _id;
        self.chain_id = _id;
        self.userID   = raw["userID"] as? String ?? "";

        self.name  = raw["name"] as? String ?? "";
        self.about = raw["about"] as? String ?? "";
        self.total_lumo_gifted = raw["total_lumo_gifted"] as? Double ?? 0.0;
        self.can_receive_payment = raw["can_receive_payment"] as? Bool ?? false;
        
        self.timeStampCreated   = raw["timeStampCreated"] as? Int ?? 0
        self.timeStampCreatedPP = raw["timeStampCreatedPP"] as? String ?? ""
        self.timeStampLatest    = raw["timeStampLatest"] as? Int ?? 0
        self.timeStampLatestPP  = raw["timeStampLatestPP"] as? String ?? ""
        
        self.latest_block_id = mparseString(mraw, at: "latest_block_id");
        self.timeStampLatestBlockExpire   = mparseInt(mraw, at: "timeStampLatestBlockExpire");
        self.timeStampLatestBlockExpirePP = mparseString(mraw, at: "timeStampLatestBlockExpirePP");
        
    }
    
    
    /// load all blocks, rewards, items
    /// - Parameter then: continue after loading
    public func sync(
        full: Bool,
        reload: Bool = false,
        _ then: @escaping ( Bool, String ) -> Void
    ){
        
        if self.didSyncFull && !reload {

            return then(true, "parsed")
            
        } else {
            
            // fetch entire block
            let params = make_post_params(params: [
                URLQueryItem(name: "full", value: full ? "true" : "false"),
                URLQueryItem(name: "chain_id", value: self.chain_id)
            ])
            go_axios_post(
                with: params,
                url: API_Endpoint.fetch_chain.str,
                parse: false,
                succ: {(res) in
                    
                    if let mroot = res["root"] as? [String:Any] {
                        self.parse_root(mroot);
                    }
                    
                    if let mrewards = res["rewards"] as? [[String:Any]] {
                        let rewards = mrewards
                            .map{ self.parse(reward: $0) }
                            .filter{ $0 != nil }
                            .map{ $0! }
                        self.rewards = rewards;
                    }
                    
                    if let mitems = res["items"] as? [[String:Any]] {
                        let items = mitems
                            .map{ self.parse(item: $0) }
                            .filter{ $0 != nil }
                            .map{ $0! }
                        self.items = items;
                    }
                    
                    if let mnoms = res["nominations"] as? [[String:Any]] {
                        let noms = mnoms
                            .map{ self.parse(nom: $0) }
                            .filter{ $0 != nil }
                            .map{ $0! }
                        self.nominations = noms;
                    }
                    
                    if let mgifts = res["gifts"] as? [[String:Any]] {
                        let gifts = mgifts
                            .map{ self.parse(gift:$0) }
                            .filter{ $0 != nil}
                            .map{ $0! }
                        self.gifts = gifts;
                    }
                    
                    self.match_items_with_nomination();
                    
                    if full {
                        self.syncFull(){
                            self.delegate?.didSync()
                            return
                        }
                    } else {
                        self.delegate?.didSync();
                    }
                    
                    self.didSyncFull = true;
                    return then(true, "parsed")
                },
                succP: {(res) in
                    return then(false, "should not have parsed")
                },
                fail: {(err) in
                    return then(false, "\(err)")
                })
        }
    }
        
    
    /// load all media in each item and cache image/video
    /// - Parameter then: contineue after syncing
    public func syncFull( _ then: @escaping () -> Void ){
        let _ = self.items.map{ $0.sync(){_ in return} }
        then()
    }

    
    /// @use: match block items with its respective nomination
    private func match_items_with_nomination(){
        self.items.forEach { item in
            let noms = self.nominations.filter{ $0.id == item.nominationID }
            if noms.count > 0 {
                item.nomination = noms[0]
            }
        }
    }
    
    // MARK: - read block
        
    // @use: get total lumo gifted
    public func read_total_lumo_gifted() -> Double {
        var num : Double = 0
        if self.gifts.count > 0 {
            num = gifts.map{ $0.amt_in_lumo }.reduce(0, +)
            self.total_lumo_gifted = num;
        } else {
            num = self.total_lumo_gifted
        }
        return num;
    }

    // @use: see if this card is for the burn manifesto author
    public func is_author_card(_ item: ItemModel?) -> Bool {
        guard let item = item else {
            return false
        }
        if self.items.contains(item) {
            return item.userID == self.userID
        } else {
            return false
        }
    }

    // @use: get the author card
    public func get_author_card() -> ItemModel? {
        let authors = self.items.filter{ $0.userID == self.userID }
        return authors.count > 0 ? authors[0] : nil
    }
    

    public func current_block_expire() -> Int {
        if self.timeStampLatestBlockExpire != 0 {
            return self.timeStampLatestBlockExpire
        } else {
            return 0;
        }
    }
        
    
    /// @use: summzrie stats for this chain
    /// - Returns: (# of gifts sent, total amt of lumo sent, # of invites sent)
    public func summarize_chain() -> (Int,Double,Int,Int) {
        let datasource = self.gifts.sorted{ $0.timeStampLatest > $1.timeStampLatest }
        let amt_in_lumo = roundToTwo(self.gifts.map{ $0.amt_in_lumo }.reduce(0, +))
        let num_invites = self.gifts.filter{ $0.amt_in_lumo == 1.0 }.count
        let num_signatures = self.rewards.filter{ $0.event == "sign_manifesto" }.count
        return ( datasource.count, amt_in_lumo, num_invites, num_signatures )
    }

    // @Use: get summary statisitcs for this block
    /// - Parameter bid: block id
    /// - Returns: summary stats
    public func summarize_burn() -> (Int,Int, CGFloat) {
        let total_gift_value = gifts.map{ $0.amt_in_lumo }.reduce(0, +)
        let gift_users = Array(Set(gifts.map{ $0.srcUserID }))
        return ( items.count, gift_users.count + items.count, total_gift_value + CGFloat(items.count) )
    }
    

    
    //MARK: - read block items/gifts
    

    public func get_all_gifts( for item: ItemModel? ) -> [GiftModel] {
        guard let item = item else { return [] }
        let gs = self.gifts
                .filter{ $0.tgtItemID == item.id }
                .sorted{ $0 > $1 }
        return gs;
    }
    
    
    /// @use: get all items in this current block
    /// - Returns: all items in history
    public func get_all_items() -> [ItemModel] {
        let res = items.sorted{ $0.timeStampCreated > $1.timeStampCreated }
        if let card = get_author_card() {
            var reshuffled = res.filter{ $0 != card }
            reshuffled.insert(card, at: 0);
            return reshuffled;
        } else {
            return res
        }
    }
    

    //MARK: - parse

    private func parse( item raw: [String:Any]?) -> ItemModel? {
        guard let raw = raw else { return nil }
        return ItemModel(raw)
    }

    private func parse( reward raw: [String:Any]?) -> RewardModel? {
        guard let raw = raw else { return nil }
        return RewardModel(raw)
    }
    
    private func parse( gift raw: [String:Any]?) -> GiftModel? {
        guard let raw = raw else { return nil }
        return GiftModel(raw);
    }

    private func parse( nom raw: [String:Any]?) -> NominationModel? {
        guard let raw = raw else { return nil }
        return NominationModel(raw)
    }

}

// MARK: - item model

class ItemModel: ObservableObject, Equatable, Hashable, Comparable {

    // id info
    var id      : ItemID = ""
    var item_id : ItemID = ""
    var chain_id: String = ""
    var block_id: BlockID = ""
    var userID  : String = ""
    
    var nominationID: String = "";
    var nomination: NominationModel? = nil
    var permission: Permission = .none;
    
    var name: String = ""
    var about: String = ""
    var image_url: String = ""
    var image_preview_url: String = ""

    // stats
    var initiation_userIds : [UserID] = [];
    var initiation_names: [String] = [];
    var num_tabs_gifted: Double = 0.0;

    
    var isTrivial: Bool = false;
    var isTrivial2: Bool = false;

    var timeStampLatest   : Int = 0
    var timeStampLatestPP : String = ""
    var timeStampCreated  : Int = 0
    var timeStampCreatedPP: String = ""
    
    // image of submitted user

    static func == (lhs: ItemModel, rhs: ItemModel) -> Bool {
        return rhs.id == lhs.id
    }
    
    static func <(lhs: ItemModel, rhs: ItemModel) -> Bool {
        lhs.timeStampLatest < rhs.timeStampLatest
    }
    
    static func mempty() -> ItemModel {
        let m = ItemModel([:]);
        m.name = "Alice"
        m.about = "hello alice"
        let urls = ["https://pbs.twimg.com/profile_images/1460861458552655872/kTGArRS3_400x400.jpg",
                   "https://pbs.twimg.com/profile_banners/1183170193318694912/1619732641/1500x500"]
        m.image_url = urls[0]
        m.image_preview_url = urls[0]
        return m;
    }
    
    static func trivial() -> ItemModel {
        let m = ItemModel([:])
        m.isTrivial = true;
        return m;
    }

    static func trivial2() -> ItemModel {
        let m = ItemModel([:])
        m.isTrivial2 = true;
        return m;
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(self.chain_id)
    }
        
    // @use: parse token data
    init( _ mraw: [String:Any]? ){

        guard let raw = mraw else { return }
        
        self.id       = mparseString(mraw, at: "ID")
        self.item_id  = mparseString(mraw, at: "item_id")
        self.chain_id = mparseString(mraw, at: "chain_id")
        self.block_id = mparseString(mraw, at: "block_id")
        self.userID   = mparseString(mraw, at: "userID")
        self.nominationID = mparseString(mraw, at: "nominationID");
        self.permission = permission.parse(mparseString(mraw, at: "permission"));

        self.name  = mparseString(mraw, at: "title");
        self.about  = mparseString(mraw, at: "about");
        self.image_url  = mparseString(mraw, at: "image_url");
        self.image_preview_url  = mparseString(mraw, at: image_preview_url);
        
        // stats
        self.initiation_names = raw["initiation_names"] as? [String] ?? [];
        self.initiation_userIds = raw["initiation_userIds"] as? [String] ?? [];
        self.num_tabs_gifted = raw["num_tabs_gifted"] as? Double ?? 1.0;
        
        self.timeStampCreated   = raw["timeStampCreated"] as? Int ?? 0
        self.timeStampCreatedPP = raw["timeStampCreatedPP"] as? String ?? ""
        self.timeStampLatest    = raw["timeStampLatest"] as? Int ?? 0
        self.timeStampLatestPP  = raw["timeStampLatestPP"] as? String ?? ""

    }
    
    // download media
    func sync( _ then: @escaping ([Media]) -> Void ){
    }

    func get_image_url () -> URL? {
        let str = image_url == "" ? image_preview_url : image_url;
        return URL(string: str);
    }
}


//MARK: - gift model

class GiftModel: ObservableObject, Equatable, Hashable, Comparable {

    // id info
    var id      : String = ""
    var rand_id : String = "\(UUID())"

    var chain_id: String = ""
    var block_id: BlockID = ""

    var srcUserID: String = ""
    var tgtUserID: String = ""
    var tgtItemID: String = ""

    var srcUser: UserModel? = nil;
    var tgtUser: UserModel? = nil;

    var amt_in_lumo: Double = 0.10;
    
    var timeStampLatest   : Int = 0
    var timeStampLatestPP : String = ""
    var timeStampCreated  : Int = 0
    var timeStampCreatedPP: String = ""
    
    // image of submitted user
    // social of submitted user

    static func == (lhs: GiftModel, rhs: GiftModel) -> Bool {
        return rhs.id == lhs.id
    }
    
    static func <(lhs: GiftModel, rhs: GiftModel) -> Bool {
        lhs.timeStampLatest < rhs.timeStampLatest
    }
    
    static func mempty() -> GiftModel {
        let m = GiftModel([:])
        return m
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(self.chain_id)
    }
        
    init( _ mraw: [String:Any]? ){

        guard let raw = mraw else { return }
        
        self.id = raw["ID"] as? String ?? "";
        self.chain_id = raw["tgtChainID"] as? String ?? "";
        self.block_id = raw["tgtBlockID"] as? String ?? "";
        self.srcUserID = mparseString(mraw, at: "srcUserID");
        self.tgtUserID = mparseString(mraw, at: "tgtUserID");
        self.tgtItemID = mparseString(mraw, at: "tgtItemID");

        self.amt_in_lumo = raw["amt_in_lumo"] as? Double ?? 0;
        
        self.timeStampCreated   = raw["timeStampCreated"] as? Int ?? 0
        self.timeStampCreatedPP = raw["timeStampCreatedPP"] as? String ?? ""
        self.timeStampLatest    = raw["timeStampLatest"] as? Int ?? 0
        self.timeStampLatestPP  = raw["timeStampLatestPP"] as? String ?? ""
        
    }
        
    // load src and target users
    func sync(with appService: AppService? ){
        guard let ap = appService else { return }
        ap.get_user(at: self.srcUserID){um in
            self.srcUser = um;
        }
        ap.get_user(at: self.tgtUserID){um in
            self.tgtUser = um;
        }
    }

}

//MARK: - reward model

class RewardModel: ObservableObject, Equatable, Hashable, Comparable {

    // id info
    var id      : RewardID = ""
    var item_id : RewardID = ""
    var chain_id: String = ""
    var block_id: BlockID = ""
    var userID  : String = ""
    var rand_id: String = "\(UUID())"

    var amt_in_lumo: Double = 0;
    var event : String = ""
    
    var timeStampLatest   : Int = 0
    var timeStampLatestPP : String = ""
    var timeStampCreated  : Int = 0
    var timeStampCreatedPP: String = ""
    
    // image of submitted user
    // social of submitted user

    static func == (lhs: RewardModel, rhs: RewardModel) -> Bool {
        return rhs.id == lhs.id
    }
    
    static func <(lhs: RewardModel, rhs: RewardModel) -> Bool {
        lhs.timeStampLatest < rhs.timeStampLatest
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(self.chain_id)
    }
        
    init( _ mraw: [String:Any]? ){

        guard let raw = mraw else { return }
        
        self.id = raw["ID"] as? String ?? "";
        self.item_id = raw["ID"] as? String ?? "";
        self.chain_id = raw["chain_id"] as? String ?? "";
        self.block_id = raw["block_id"] as? String ?? "";
        self.userID = raw["userID"] as? String ?? "";
                
        self.amt_in_lumo = raw["amt_in_lumo"] as? Double ?? 0;
        self.event = mparseString(mraw, at: "event")
        
        self.timeStampCreated   = raw["timeStampCreated"] as? Int ?? 0
        self.timeStampCreatedPP = raw["timeStampCreatedPP"] as? String ?? ""
        self.timeStampLatest    = raw["timeStampLatest"] as? Int ?? 0
        self.timeStampLatestPP  = raw["timeStampLatestPP"] as? String ?? ""
        
    }

}



/// @use: model a send transaction
class SendModel: ObservableObject, Equatable, Hashable, Comparable {
    
    // id info
    var id      : RewardID = ""
    var srcUserID: UserID = ""
    var tgtUserID: UserID = ""
    var rand_id: String = "\(UUID())"

    var tgtChainID : ChainID = ""
    var tgtBlockID: BlockID = ""
    var tgtItemID: ItemID = ""

    var amt_in_lumo: Double = 0;
    
    var timeStampLatest   : Int = 0
    var timeStampLatestPP : String = ""
    var timeStampCreated  : Int = 0
    var timeStampCreatedPP: String = ""
    
    // image of submitted user
    // social of submitted user

    static func == (lhs: SendModel, rhs: SendModel) -> Bool {
        return rhs.id == lhs.id
    }
    
    static func <(lhs: SendModel, rhs: SendModel) -> Bool {
        lhs.timeStampLatest < rhs.timeStampLatest
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(self.id)
    }
        
    init( _ mraw: [String:Any]? ){

        guard let raw = mraw else { return }
        
        self.id = raw["ID"] as? String ?? "";
        self.srcUserID  = raw["srcUserID"] as? String ?? "";
        self.tgtUserID  = raw["tgtUserID"] as? String ?? "";
        self.tgtChainID = raw["tgtChainID"] as? String ?? "";
        self.tgtBlockID = raw["tgtBlockID"] as? String ?? "";
        self.tgtItemID  = raw["tgtItemID"] as? String ?? "";
        
        self.amt_in_lumo = raw["amt_in_lumo"] as? Double ?? 0;
        
        self.timeStampCreated   = raw["timeStampCreated"] as? Int ?? 0
        self.timeStampCreatedPP = raw["timeStampCreatedPP"] as? String ?? ""
        self.timeStampLatest    = raw["timeStampLatest"] as? Int ?? 0
        self.timeStampLatestPP  = raw["timeStampLatestPP"] as? String ?? ""
        
    }

}



