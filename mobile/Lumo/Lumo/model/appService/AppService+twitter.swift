//
//  AppService+twitter.swift
//  Lumo
//
//  Created by lingxiao on 9/19/22.
//



import Foundation
import Firebase
import Combine

//MARK: - read

extension AppService {
    
    /// Get twitter model given user model
    /// - Parameters:
    ///   - user: usermodel
    ///   - then: contineu with tiwtter
    public func get_twitter_user( for user: UserModel?, _ then: @escaping(TwitterModel?) -> Void ){
        guard let id = user?.twitterUserID else {
            return then(nil)
        }
        get_twitter_user(at: id){tu in
            then(tu)
        }
    }

    /// Get twitter model given twitter id
    /// - Parameters:
    ///   - user: usermodel
    ///   - then: contineu with tiwtter
    public func get_twitter_user( at id: TwitterID, _ then: @escaping(TwitterModel?) -> Void ){
        if let tuser = twitter_graph[id] {
            return then(tuser)
        } else {
            let params = make_post_params(params: [
                URLQueryItem(name: "twitter_id", value: id)
            ])
            go_axios_post(
                with: params,
                url: API_Endpoint.get_twitter_account.str,
                parse: false,
                succ: {(res) in
                    guard let tid = res["twitterUserID"] as? String else {
                        return then(nil)
                    }
                    let tuser = TwitterModel(res);
                    DispatchQueue.main.async {
                        self.twitter_graph[tid] = tuser;
                    }
                    then(tuser)
                },
                succP: {(res) in return then(nil) },
                fail: {(err) in
                    then(nil)
                })
        }
    }
        
    
    /// @use: get twitter user given Lumo-app userID
    /// - Parameters:
    ///   - uid: userID
    ///   - then: output twitter user
    public func get_twitter_user( with uid: UserID?, _ then: @escaping (TwitterModel?, UserModel?) -> Void ){
        guard let uid = uid else {
            return then(nil,nil)
        }
        get_user(at: uid){muser in
            guard let muser = muser else {
                return then(nil,nil)
            }
            self.get_twitter_user(for: muser){tuser in
                return then(tuser,muser)
            }
        }
    }
    
    /// fetch twitter graph from cache, if reload then fetch from server
    /// - Parameters:
    ///   - reload: if true, then hard refetch from server
    ///   - then: continue w/ parsed twitter graph
    public func get_twitter_graph( reload: Bool, then: @escaping([TwitterModel]) -> Void ) {
        let graph = Array(twitter_graph.values)
            .sorted{ $0 > $1 }
        if graph.count == 0 || reload {
            fetch_twitter_graph(){(res,ms) in
                return then(ms);
            }
        } else {
            return then(graph)
        }
    }

    
    /// @Use: filter twitter graph by searchin name
    /// - Parameter str: search param
    public func filter_twitter_graph( with str: String ) -> [TwitterModel] {
        let graph = Array(twitter_graph.values)
            .filter{ $0.contains(str) }
        return graph
    }
    
    // @use: get the first burn to show
    // the user
    private func fetch_twitter_graph(then: @escaping(API_Response, [TwitterModel]) -> Void ) {

        guard authed_uid != "" else {
            return then(api_res_fail("user has not authenticated"), [])
        }

        let params = make_post_params(params: [
            URLQueryItem(name: "userID", value: authed_uid)
        ])
       
        go_axios_post(
            with: params,
            url: API_Endpoint.get_twitter_graph.str,
            parse: false,
            succ: {(res) in
                var graph : [TwitterModel] = []
                if let followers = res["followers"] as? [[String:Any]] {
                    let ms = followers.map{ TwitterModel($0) }
                    graph += ms
                }
                if let following = res["following"] as? [[String:Any]] {
                    let ms = following.map{ TwitterModel($0) }
                    graph += ms
                }
                DispatchQueue.main.async {
                    let _ = graph.map{
                        self.twitter_graph[$0.id] = $0
                    }
                }
                return then(
                    API_Response(
                        success: true,
                        message: "found \(graph.count) followers and following",
                        data: [:]),
                    graph
                )
            },
            succP: {(res) in return },
            fail: {(err) in
                then(api_res_fail("\(err)"),[])
            })
    }
    
}

