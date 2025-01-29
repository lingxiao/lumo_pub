//
//  AppService+mint.swift
//  Lumo
//
//  Created by lingxiao on 11/13/22.
//



import Foundation
import Firebase
import Combine



//MARK: - write/read
    
extension AppService {
    
    /// @use: fetch all merch contracts
    /// - Parameters:
    ///   - burn: burm model
    ///   - then: return contracts
    public func fetch_contracts( for burn: BurnModel?, reload: Bool, _ then: @escaping([ContractModel]) -> Void ){
        guard let burn = burn else { return then([]) }
        let cs = self.contracts.values.filter{ $0.chain_id == burn.chain_id }
        if cs.count > 0 && !reload {
            return then(cs)
        } else {
            merchRepo.fetch_all_contracts(for: burn.chain_id){_,_,cs in
                DispatchQueue.main.async {
                    let _ = cs.map{
                        self.contracts[$0.id] = $0
                    }
                }
                return then(cs)
            }
        }
    }
    
    /// fetch all tokens for chain
    /// - Parameters:
    ///   - burn: burn model
    ///   - reload: if true, then fetch from server
    ///   - then: contineu w/ toks
    public func fetch_all_toks(
        for burn: BurnModel?,
        reload: Bool,
        _ then: @escaping([NonfungibleTok]) -> Void
    ){
        guard let burn = burn else { return then([]) }
        let toks = self.toks.values.filter{ $0.chain_id == burn.chain_id }
        if toks.count > 0 && !reload {
            return then(toks)
        } else {
            merchRepo.fetch_all_toks(for: self.authed_uid, at: burn.chain_id){_,_,_toks in
                DispatchQueue.main.async {
                    let _ = _toks.map{
                        self.toks[$0.id] = $0;
                    }
                }
                return then(_toks)
            }
        }
    }
        
    
    /// @use: drop merch contract
    /// - Parameters:
    ///   - burn: burn model
    ///   - ticker: ticker
    ///   - price: price
    ///   - editions: # of editions
    ///   - then: continue
    public func drop_merch(
        for burn: BurnModel?,
        ticker: String,
        price: String,
        editions: String,
        image: UIImage?,
        _ then: @escaping(Bool,String, ContractModel?) -> Void
    ){
        guard let burn = burn else {
            return then(false,"no burn specified", nil);
        }        
        guard let img = image else {
            return then(false, "please upload an image", nil);
        }

        let large  = img.jpegData(compressionQuality: 1.00);
        let price_usd = Double(price) ?? 1;
        let price_cents = price_usd * 100;
        
        uploadImageToFireStore(
            to: "\(self.authed_uid)/\(burn.chain_id)/\(UUID()).jpg",
            with: large
        ){(succ,url) in
            if (!succ){
                return then(false, "image cannot be uploaded", nil)
            }
            let params = make_post_params(params: [
                URLQueryItem(name: "chain_id", value: burn.chain_id),
                URLQueryItem(name: "userID", value:self.authed_uid),
                URLQueryItem(name: "title", value: ticker),
                URLQueryItem(name: "sym", value: ticker),
                URLQueryItem(name: "about", value: burn.about),
                URLQueryItem(name: "num_frees", value: "0"),
                URLQueryItem(name: "num_editions", value: editions),
                URLQueryItem(name: "num_editions_presale", value: editions),
                URLQueryItem(name: "price_in_eth", value: "0.1"),
                URLQueryItem(name: "price_in_cents", value: "\(price_cents)"),
                URLQueryItem(name: "presale_price_in_cents", value: "\(price_cents)"),
                URLQueryItem(name: "exchange_rate", value: "50"),
                URLQueryItem(name: "image_url", value: url),
                URLQueryItem(name: "drop_timestamp", value:"\(NSDate().timeIntervalSince1970)"),
                URLQueryItem(name: "metamask_address", value:"")
            ]);
            print(params)
//            return;
            go_axios_post(
                with: params,
                url: API_Endpoint.write_social_chain_drop_root.str,
                parse: false,
                succ: {(res) in
                    let _succ = res["success"] as? Bool ?? false;
                    let msg = res["message"] as? String ?? "error";
                    return then( _succ, msg, nil)
                },
                succP: {(res) in
                    return then(false, "should not have parsed", nil)
                },
                fail: {(err) in
                    return then(false, "\(err)", nil)
                    
                })
        }
    }

    
    /// @use: buy token
    /// - Parameters:
    ///   - contract: token contract
    ///   - then: continue
    public func buy_token( for contract: ContractModel?, _ then: @escaping(Bool,String,String,Bool,String) -> Void ){
        guard let contract = contract else {
            return then(false,"", "", false, "no collection specified")
        }
        let params = make_post_params(params: [
            URLQueryItem(name: "collection_id", value: contract.id),
            URLQueryItem(name: "userID", value:self.authed_uid),
            URLQueryItem(name: "is_presale", value: "true")
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.buy_nft_offchain.str,
            parse: false,
            succ: {(res) in
                let _succ = res["success"] as? Bool ?? false;
                let msg = res["message"] as? String ?? "error";
                let paymentId = res["paymentId"] as? String ?? "";
                let tok_id = res["tok_id"] as? String ?? ""
                let no_payment = res["no_payment"] as? Bool ?? true;
                return then( _succ, paymentId, tok_id, no_payment, msg )
            },
            succP: {(res) in
                return then(false,"", "",false, "should not have parsed")
            },
            fail: {(err) in
                return then(false,"", "", false, "\(err)")

            })
    }
    
}



//MARK: - qr code
    
extension AppService {
    
    
    /// @read qr code
    /// - Parameters:
    ///   - tok: token
    ///   - then: continue
    public func gen_token_qr_code_seed( for tok: NonfungibleTok?, _ then: @escaping(Bool, String, String) -> Void ){
        guard let tok = tok else {
            return then(false,"No token found", "")
        }
        let params = make_post_params(params: [
            URLQueryItem(name: "tok_id", value: tok.tok_id),
            URLQueryItem(name: "collection_id", value: tok.contract_id),
            URLQueryItem(name: "userID", value:self.authed_uid),
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.gen_token_qr_code_seed.str,
            parse: false,
            succ: {(res) in
                let _succ = res["success"] as? Bool ?? false;
                let msg   = res["message"] as? String ?? "error";
                let seed  = res["seed"] as? String ?? "";
                return then( _succ, msg, seed );
            },
            succP: {(res) in
                return then(false,"", "")
            },
            fail: {(err) in
                return then(false,"\(err)", "");
                
            })
    }
    

    /// read qr cde and confirm token eixsts
    /// - Parameters:
    ///   - seed: qr code seed phrase
    ///   - then: continue
    public func read_token_qr_code( for seed: String, _ then: @escaping(Bool, String, Bool,String) -> Void ){
        let params = make_post_params(params: [
            URLQueryItem(name: "userID", value:self.authed_uid),
            URLQueryItem(name: "seed", value: seed)
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.read_token_qr_code.str,
            parse: false,
            succ: {(res) in
                let _succ   = res["success"] as? Bool ?? false;
                let msg     = res["message"] as? String ?? "error";
                let exists  = res["exists"] as? Bool ?? false;
                let tok     = res["tok"] as? [String:Any] ?? [:];
                let img_url = tok["image_preview_url"] as? String ?? "";
                return then( _succ, msg, exists, img_url );
            },
            succP: {(res) in
                return then(false,"", false, "")
            },
            fail: {(err) in
                return then(false,"\(err)", false, "")                
            })
    }
    
}
