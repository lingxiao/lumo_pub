//
//  AppService+User.swift
//  Lumo
//
//  Created by lingxiao on 9/23/22.
//


import Foundation
import Firebase
import Combine

//MARK: - read/write user

extension AppService {
    
    
    // @use: get admin user
    func get_admin_user() -> UserModel? {
        if let user = self.user_cache[self.authed_uid] {
            return user
        } else {
            return nil
        }
    }    

    // @use: get user from cache or server
    func get_user(at uid: UserID?, _ then: @escaping(UserModel?) -> Void ){
        guard let id = uid else { return then(nil) }
         self._cache( uid: id ){mu in then(mu) }
    }

    // get user from cache
    func get_user(at uid: UserID?) -> UserModel? {
        if let uid = uid {
            return self.user_cache[uid]
        } else {
            return nil
        }
    }

    // @use: get balance for admin user
    func off_chain_authed_balance_lumo(_ then: @escaping(CGFloat) -> Void ) {
        let user = self.user_cache[authed_uid]
        return offchain_balance_of_lumo(for: user){b in
            self.setCurrentBalance(to: b)
            then(b)
        }
    }

    
    // @Use: get balance of lumo for user from db
    /// - Parameters:
    ///   - user: user
    ///   - then: continue w/ balance
    func offchain_balance_of_lumo(for user: UserModel?, _ then: @escaping(CGFloat) -> Void ){
        let params = make_post_params(params: [
            URLQueryItem(name: "userID", value: user?.userID ?? "")
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.offchain_balance_of_lumo.str,
            parse: false,
            succ: {(res) in
                guard let bal = res["balance"] as? Double else {
                    return then(0)
                }
                return then(bal)
            },
            succP: {(res) in
                return then(0)
            },
            fail: {(err) in
                return then(0)
            })
    }
        

    // @use: update user's profile image
    func updateAuthedUserPofileImage(to img: UIImage? ) {

        guard let img = img else { return }
        
        let large  = img.jpegData(compressionQuality: 1.00)
        
        uploadImageToFireStore( to: "\(self.authed_uid)/profileImageFull.jpg",  with: large){(succ,url) in
            if succ && url != "" {
                let params = make_post_params(params: [
                    URLQueryItem(name: "userID"    , value: self.authed_uid),
                    URLQueryItem(name: "image_url" , value: url)
                ]);
                go_axios_post(
                    with: params,
                    url: API_Endpoint.edit_user.str,
                    succ: {(res) in },
                    succP: {(res) in },
                    fail: {(err) in })
            }
        }

    }
    
}

//MARK: - admin user payment

extension AppService {
    
    /// @Use: check fi admin userhave stripe
    /// - Parameter then: return true if yes
    func does_admin_user_have_stripe( _ then: @escaping(Bool) -> Void){
        let params = make_post_params(params: [
            URLQueryItem(name: "userID", value: authed_uid),
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.does_user_have_stripe_customer_id.str,
            parse: true,
            succ: {(res) in
                return then(false)
            },
            succP: {(res) in
                return then(res.success)
            },
            fail: {(err) in
                then(false);
            })
    }
    
    
    /// @Use: save admin user
    /// - Parameters:
    ///   - number: card number
    ///   - exp_mo: expiration month
    ///   - exp_yr: expiration year
    ///   - cvc: cvc
    ///   - then: continue
    func create_user_stripe_account(
        number: String,
        exp_mo: String,
        exp_yr: String,
        cvc: String,
        _ then: @escaping (API_Response) -> Void
    ){
        let params = make_post_params(params: [
            URLQueryItem(name: "userID", value: authed_uid),
            URLQueryItem(name: "number", value: number),
            URLQueryItem(name: "exp_mo", value: exp_mo),
            URLQueryItem(name: "exp_yr", value: exp_yr),
            URLQueryItem(name: "cvc"   , value: cvc)
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.create_user_stripe_account.str,
            parse: true,
            succ: {(res) in
                guard let str = res["message"] as? String else {
                    return then(api_res_fail("Oh no! An error occured"))
                }
                return then(api_res_fail(str));
            },
            succP: {(res) in
                return then(res);
            },
            fail: {(err) in
                return then(api_res_fail("\(err)"))
            })
    }
    
    
}
