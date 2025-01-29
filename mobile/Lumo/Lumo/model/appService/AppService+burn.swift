//
//  AppService+burn.swift
//  Lumo
//
//  Created by lingxiao on 9/18/22.
//



import Foundation
import Firebase
import Combine

//MARK: - read

extension AppService {
    
    /// @Use: get how much rewards the user has latestly
    /// - Returns: ( rewards, gifts )
    func get_user_rewards_summary () -> (Double,Double) {
        let rs = self.recentRewards.map{ $0.amt_in_lumo }.reduce(0, +)
        let ss = self.recentSends.map{ $0.amt_in_lumo }.reduce(0, +)
        return (rs,ss);
    }        
    
    // @Use: get my burn if i have one, if `showbackup`, then show top burn
    //       otherwise hard-refetch from the server
    /// - Parameters:
    ///   - then: continuw w/ burn model
    public func fetch_hero_burn( have_backup: Bool = false, _ then: @escaping(BurnModel?) -> Void ){
        let all_burns = Array(burn_datasource.values).sorted{ $0 > $1 }
        let my_burns = self.authed_uid == ""
            ? []
            : all_burns.filter{ $0.userID == self.authed_uid }
        if my_burns.count > 0 {
            self.setCurrentBurn(to:my_burns[0])
            return then(my_burns[0])
        } else if have_backup && all_burns.count > 0 {
            return then(all_burns[0]);
        } else {
            // fetch all burns for current user
            burnRepo.fetch_all(for: self.authed_uid){(_, _, burns) in
                let _ = burns.map{
                    self._cache(burn:$0)
                }
                if burns.count > 0 {
                    let sburns = burns.sorted{ $0 > $1 };
                    self.setCurrentBurn(to:sburns[0])
                    return then(sburns[0])
                } else if have_backup {
                    return then(all_burns.count > 1 ? all_burns[0] : nil)
                } else {
                    return then(nil)
                }
            }
        }
    }
    
    /// fetch burn given burn model id
    /// - Parameters:
    ///   - id: burn id
    ///   - then: burn model
    public func fetch_burn( at id: String, _ then: @escaping( (BurnModel?) -> Void )){
        if let burn = self.burn_datasource[id] {
            return then(burn)
        } else {
            burnRepo.fetch_one(id: id){(str,mburn) in
                guard let mburn = mburn else {
                    return then(nil)
                }
                DispatchQueue.main.async {
                    self.burn_datasource[id] = mburn;
                }
                then(mburn);
            }
        }
    }
    
    //@use: get newfeed of burns, break into ones started by me vs ones not.
    /// - Parameter then: return newsfeed
    public func fetch_burn_newsfeed( reload: Bool, _ then: @escaping([BurnModel], [BurnModel]) -> Void) {
        let noms = Array(self.nominations.values).map{ $0.chain_id }
        let burns = Array(burn_datasource.values)
            .filter{ noms.contains($0.chain_id) == false }
        let not_my_burns = burns.filter{ $0.userID != self.authed_uid }
        return then(self._sort_burns((burns)), self._sort_burns(not_my_burns));
    }
    
    private func _sort_burns(_ _burns: [BurnModel]) -> [BurnModel] {
        let burns = _burns.sorted{ $0 > $1 }
        let my_burns = burns.filter{ $0.userID == authed_uid }
        let not_my   = burns.filter{ $0.userID != authed_uid };
        let newsfeed = my_burns + not_my;
        return newsfeed;
    }
        
    
    /// check if i have been invited here
    /// - Parameters:
    ///   - burn: burn event that may have invited me
    ///   - then: true if have pending invite
    public func have_pending_invite( to burn: BurnModel?, _ then: @escaping (NominationModel?) -> Void ){
        guard let burn = burn else {
            return then(nil)
        }
        if (burn.userID == authed_uid){
            return then(nil)
        } else {
            let noms = self.nominations.values;
            let relevant_noms = noms.filter{ $0.chain_id == burn.id };
            then( relevant_noms.count > 0 ? relevant_noms[0] : nil )
        }
    }
    
    
    
    //@Use: get all gifts sent to itemID, load associated user into cache
    /// - Parameter item: item w/ nominee
    /// - Returns: all gifts for this item
    public func fetch_all_gifts( for item: ItemModel?, _ then: @escaping( [GiftModel] ) -> Void ){
        guard let item = item else { return then([]) }
        guard let chain = burn_datasource[item.chain_id] else {
            return then([]);
        }
        if chain.didSyncFull {
            let gs = chain.get_all_gifts(for: item);
            let _ = gs.map{ $0.sync(with: self) }
            return then(gs);
        } else {
            chain.sync(full: true){(succ,str) in
                let gs = chain.get_all_gifts(for: item);
                let _ = gs.map{ $0.sync(with: self) }
                return then(gs)
            }
        }
    }
    
    
    /// @Use: fetch nomination model for item
    /// - Parameters:
    ///   - item: itemModel
    ///   - then: nomination model
    public func fetch_nomination(for item: ItemModel?, _ then: @escaping(NominationModel?) -> Void){
        guard let item = item else {
            return then(nil)
        }
        if let nom = item.nomination {
            return then(nom)
        } else if let nom = self.nominations[item.nominationID] {
            DispatchQueue.main.async {
                item.nomination = nom;
            }
            return then(nom)
        } else {
            nominationRepo.fetch(at: item.nominationID){nom in
                DispatchQueue.main.async {
                    self.nominations[item.nominationID] = nom;
                    item.nomination = nom;
                }
                return then(nom);
            }
        }
    }
    
}
    

//MARK: - write
    
extension AppService {
    
    /// write a manifesto
    /// - Parameters:
    ///   - name: name of it
    ///   - about: the manifesto
    ///   - then: continue to manifesto redirect
    public func post_manifesto(
        name: String,
        about: String,
        then: @escaping(API_Response, BurnModel?) -> Void ){

            let params = make_post_params(params: [
                URLQueryItem(name: "userID"    , value: authed_uid),
                URLQueryItem(name: "name"      , value: name),
                URLQueryItem(name: "about"     , value: about)
            ])
            go_axios_post(
                with: params,
                url: API_Endpoint.create_chain.str,
                parse: true,
                succ: {(res) in },
                succP: {(res) in
                    guard let _ = res.data["chain_id"] as? String else {
                        return then(res,nil)
                    }
                    let mburn = BurnModel(res.data);
                    self._cache(burn: mburn);
                    return then(res, mburn)
                },
                fail: {(err) in
                    return then(api_res_fail(err), nil)
                })
    }
        
    
    /// Edit manifesto for this block
    /// - Parameters:
    ///   - about: new manifesto
    ///   - block: block model
    ///   - then: contination
    public func edit_manifesto(
        about: String,
        burn: BurnModel?,
        _ then: @escaping(API_Response) -> Void){
            
            let params = make_post_params(params: [
                URLQueryItem(name: "userID"    , value: authed_uid),
                URLQueryItem(name: "chain_id"  , value: burn?.chain_id),
                URLQueryItem(name: "about"     , value: about),
                
            ])
            go_axios_post(
                with: params,
                url: API_Endpoint.update_chain_root.str,
                parse: true,
                succ: {(res) in },
                succP: {(res) in
                    return then(res)
                },
                fail: {(err) in
                    return then(api_res_fail(err))
                })
    }
        
    /// sign manifesto
    /// - Parameters:
    ///   - burn: burn-block model for this manifesto
    ///   - then: continue fn
    public func sign_manifesto( at burn: BurnModel?,  then: @escaping(API_Response) -> Void ){
        guard let burn = burn else {
            return then(api_res_fail("No burn event found"));
        }
        let params = make_post_params(params: [
            URLQueryItem(name: "userID"    , value: authed_uid),
            URLQueryItem(name: "chain_id"  , value: burn.chain_id),
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.sign_manifesto.str,
            parse: true,
            succ: {(res) in },
            succP: {(res) in
                then(res)
            },
            fail: {(err) in
                return then(api_res_fail(err))
            })
    }
    
    // @Use: send lumo token to burn leader
    /// - Parameters:
    ///   - item: item of nomination
    ///   - then: continue with new user balance
    public func gift_lumo_to_nominee( at item: ItemModel?,  then: @escaping(Bool, String, Double) -> Void  ){
        guard let item = item else {
            return then(false, "item dne", 0)
        }
        let params = make_post_params(params: [
            URLQueryItem(name: "userID"    , value: authed_uid),
            URLQueryItem(name: "itemID"    , value: item.id)
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.gift_lumo_to_nominee.str,
            parse: false,
            succ: {(res) in
                guard let succ = res["success"] as? Bool else {
                    return then(false, "Failed to create invite", 0)
                }
                guard let message = res["message"] as? String else {
                    return then(false, "Failed to create invite", 0)
                }
                guard let bal = res["balance"] as? Double else {
                    return then(false, message, 0)
                }
                self.setCurrentBalance(to: bal)
                then(succ, message, bal)
            },
            succP: {(res) in },
            fail: {(err) in
                then(false, "Failed to confirm code: \(err)",0)
            })
    }


    /// @Use: buy lumo token,despite the name it's off chain
    /// - Parameters:
    ///   - tier: pricing teir and amount
    ///   - then: continue w/ API response
    public func buy_lumo_token_on_polygon(
        at tier: PricingTier,
        for burn: BurnModel?,
        _ then: @escaping(API_Response) -> Void
    ){
        
        let params = make_post_params(params: [
            URLQueryItem(name: "userID", value: authed_uid),
            URLQueryItem(name: "amt_in_lumo" , value: "\(tier.volume)"),
            URLQueryItem(name: "chain_id", value: burn?.chain_id ?? ""),
            URLQueryItem(name: "aggregate_price_in_USD", value: "\(Int(tier.price))")
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.buy_lumo_token_on_polygon.str,
            parse: true,
            succ: {(res) in
                guard let str = res["message"] as? String else {
                    return then(api_res_fail("An error occured"))
                }
                return then(api_res_fail(str));
            },
            succP: {(res) in
                return then(res)
            },
            fail: {(err) in
                return then(api_res_fail("\(err)"))
            });
    }
    
    
    /// @Use: nominate new burn leader by:
    ///     1. creating new invite in db
    ///     2. generate invite code and return .
    /// - Parameters:
    ///   - user: nominee
    ///   - burn: burm event
    ///   - then: continue fn
    public func nominate_burn_leader(
        for user: TwitterModel?,
        at burn: BurnModel?,
        then: @escaping(Bool, String, NominationModel?) -> Void
    ){
        self.nominationRepo.make_invite_code(){code in
            self.nominationRepo.nominate_burn_leader(
                from: self.authed_uid,
                for: user,
                at: burn,
                with: code
            ){(succ,msg,nom) in
                then(succ,msg, nom)
            }
        }
    }
    
    ///@Use: accept nomination with code, if successful, then push this burn event into invited_burn list
    ///          so it can be shown to the user first
    /// - Parameters:
    ///   - code: nominaton code
    ///   - then: contineu fn
    public func accept_nomination( with code: String, then: @escaping(API_Response, ChainID) -> Void ){
        let params = make_post_params(params: [
            URLQueryItem(name: "inviteCode", value: code),
            URLQueryItem(name: "userID"    , value: "\(authed_uid)")
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.accept_nomination.str,
            parse: true,
            succ: {(res) in return },
            succP: {(res) in
                if ( res.success ){
                    guard let chain_id = res.data["chain_id"] as? String else {
                        return then(api_res_fail("we cannot locate the burn event associated with this code"), "")
                    }
                    self.pushInvitedBurns(chain_id)
                    return then(res,chain_id)
                } else {
                    then(res,"")
                }
            },
            fail: {(err) in
                then(api_res_fail("Failed to confirm code: \(err)"),"")
            })
    }
    

    ///@Use: accept nomination with code, if successful, then push this burn event into invited_burn list
    ///          so it can be shown to the user first
    /// - Parameters:
    ///   - code: nominaton code
    ///   - then: contineu fn
    public func claim_reward( with reward: RewardModel?, then: @escaping(API_Response) -> Void ){
        self.pushInvitedBurns(reward?.chain_id ?? "");
        return then(API_Response(success: true, message: "done", data: [:]))
    }
    

}

