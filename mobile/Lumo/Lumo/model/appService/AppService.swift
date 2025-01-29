//
//  AppService.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//
//  @Use: top level app service
//
//  see this for more factored arch.
//     - https://nalexn.github.io/clean-architecture-swiftui/?utm_source=nalexn_github
//


import Foundation
import Firebase
import Combine
import SwiftUI
import CoreMotion


//MARK: - protocol + data

protocol AppServiceProtocol {
    func sync ( at uuid: UserID, _ then: @escaping() -> Void ) -> Void
    func get_admin_user() -> UserModel?
}




//MARK:- global application state + business logic
class AppService : ObservableObject, AppServiceProtocol  {
    
    
    //MARK: - caches + repos
    
    // database repos
    @Published var userRepo  = UserRepo()
    @Published var burnRepo  = BurnRepo()
    @Published var merchRepo = NonfungibleRepo()
    @Published var nominationRepo = NominationRepo()

    // model caches
    @Published var authed_uid: String = ""
    @Published var user_cache     : [UserID:UserModel]       = [:]
    @Published var twitter_graph  : [TwitterID:TwitterModel] = [:]
    @Published var burn_datasource: [ChainID:BurnModel]      = [:]
    @Published var nominations    : [String:NominationModel] = [:]
    @Published var contracts      : [String:ContractModel]   = [:]
    @Published var toks           : [String:NonfungibleTok]  = [:]

    // session states
    @Published var invited_burns: [ChainID] = [];
    @Published var currentBurn  : BurnModel? = nil
    @Published var currentMerch : NonfungibleTok? = nil;
    
    // authed user sessions states
    @Published var recentRewards: [RewardModel] = []
    @Published var recentSends  : [SendModel]   = []
    

    //MARK: - view states
    
    @Published var current_balance: Double = 0;
    @Published var topTinderCard: ItemModel? = nil;
    @Published var session_manifesto: (String,String) = ("","")
    
    // alert all views that video with this
    @Published var thisVideoDidChange: String = ""
    
    //MARK: - init
    
    @Published var app_resume_foregroud: Int = 0

    // @Doc: push notification client: https://firebase.google.com/docs/cloud-messaging/ios/client
    // @Doc: https://designcode.io/swiftui-advanced-handbook-push-notifications-part-1
    init(){
        let notificationCenter = NotificationCenter.default
        notificationCenter.addObserver(self, selector: #selector(appMovedToBackground), name: UIApplication.didEnterBackgroundNotification, object: nil)
        notificationCenter.addObserver(self, selector: #selector(appCameToForeground), name: UIApplication.willEnterForegroundNotification, object: nil)
    }
    
    //MARK: - global view states

    @objc func appMovedToBackground() {
        return;
    }
    
    // @use: on back to foreground, reload hero burn event
    //       and top burn events
    @objc func appCameToForeground() {
        app_resume_foregroud += 1
        //imageCache.onDidResumeForeground()
        fetch_hero_burn(){mburn in
            mburn?.sync(full:true,reload: true){_,_ in }
        }
        self._preload_some_burns();
    }
    
    
    // @Use: set balance to current value
    /// - Parameter bal: current balance of admin user
    public func setCurrentBalance(to bal: Double?){
        guard let bal = bal else { return }
        DispatchQueue.main.async {
            self.current_balance = bal;
        }
    }
    
    // @use: add invite
    public func pushInvitedBurns(_ id: String){
        DispatchQueue.main.async {
            self.invited_burns.append(id);
        }
    }
    
    /// set curent burn model
    /// - Parameter burn: current burn model
    public func setCurrentBurn( to burn: BurnModel?){
        DispatchQueue.main.async {
            self.currentBurn = burn;
        }
    }
        
    /// when navigating away from swipe view, remember origin tinder card
    /// - Parameter data: item for tinder card
    public func setTopTinderCard( to data: ItemModel? ){
        DispatchQueue.main.async {
            self.topTinderCard = data
        }
    }
    
    /// Save editing inprogress maifesto
    /// - Parameters:
    ///   - str: title
    ///   - about: about
    public func setSessionManifesto( with str: String, for about: String){
        DispatchQueue.main.async {
            self.session_manifesto = (str,about)
        }
    }
    
       
    
    // @use: change `thisVideoDidChange` to blast notifications
    // to all subscribed views about the video changing
    public func didChangeVideo(at id: String, load: Bool){
        DispatchQueue.main.async {
            self.thisVideoDidChange = id
        }
    }
    
    // MARK: - global sync fn
    
    // @use: sync to firebase db and load authed, user
    //       as well as authed user's purchased items
    // @Note: this fn is called in `ContentView.componentDidMount`
    func sync(at uuid: UserID, _ then: @escaping () -> Void) {
        
        // fetch authed user and its nominations and lumo balance
        self.authed_uid = uuid;
        self._cache( uid: uuid ){user in
            //self.fetch_all_nominations( reload: true ){(succ,msg,noms) in }
            self.offchain_balance_of_lumo(for: user){bal in
                DispatchQueue.main.async {
                    self.current_balance = bal;
                }
            }
        }
        
        // fetch all burns for current user
        burnRepo.fetch_all(for: uuid){(succ, msg, burns) in
            let _ = burns.map{
                self._cache(burn:$0)
            }
        }

        // fetch burns where i am a member
        burnRepo.fetch_burns(having: uuid){(succ,msg,burns,noms) in
            let _ = burns.map{
                self._cache(burn:$0)
            }
            DispatchQueue.main.async {
                let _ = noms.map{ self.nominations[$0.id] = $0 }
            }
            self._preload_some_burns()
            then();
        }
        
        // fetch twitter graph of authed user
        get_twitter_graph(reload: true){(ms) in
            return
        }
        
        // fetch recent rewards
        burnRepo.fetch_recent_rewards(for: authed_uid){succ,str,rewards,sends in
            DispatchQueue.main.async {
                self.recentSends = sends;
                self.recentRewards = rewards;
            }
        }
    }
    
    //MARK: - caching utils

        /// @Use: preload the first 10 burns
    func _preload_some_burns(){
        let all_burns = Array(burn_datasource.values).sorted{ $0 > $1 }
        let some_burns = all_burns.prefix(2)
        let _ = some_burns.map{ $0.sync(full:true){(_,_) in} }
    }
    
    /// Resparseburn and cache
    /// - Parameter burn: partially loaded BurnModel
    func _cache( burn: BurnModel ){
        self._cache( uid: burn.userID ){_ in }
        if let _ = self.burn_datasource[burn.id] {
            return
        } else {
            DispatchQueue.main.async {
                self.burn_datasource[burn.id] = burn
            }
        }
    }
    
    // @use: cache nomination model client side
    func _cache( _ nom: NominationModel ){
        DispatchQueue.main.async {
            self.nominations[nom.id] = nom;
        }
    }
    
    // @Use: cache user at `uid`
    // cache user's profile image
    func _cache( uid: UserID,  then: @escaping (UserModel?) -> Void ){
        if let euser = self.user_cache[uid] {
            return then(euser)
        } else {
            userRepo.fetch(at: uid){(succ,msg,muser) in
                guard let user = muser else {
                    return then(nil)
                }
                DispatchQueue.main.async {
                    self.user_cache[uid] = user
                    return then(user)
                }
            }
        }
    }

    
}
