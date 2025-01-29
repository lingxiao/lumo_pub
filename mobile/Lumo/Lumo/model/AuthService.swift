//
//  AuthService.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//
//  @reference:
//      - https://www.alfianlosari.com/posts/building-authentication-in-swiftui-using-firebase-auth-sdk-and-sign-in-with-apple/
//      - https://benmcmahen.com/authentication-with-swiftui-and-firebase/
//  @reference combine:
//      - https://medium.com/ios-os-x-development/learn-master-%EF%B8%8F-the-basics-of-combine-in-5-minutes-639421268219
//


import Foundation
import Firebase
import Combine

class AuthService : ObservableObject {
    
    // if true, then the user opend this app
    // w/o auth
    public var openedWithoutAuth : Bool = false

    // authed user instance
    @Published var firebase_user: String? {
        didSet {
            self.sink.send(self)
        }
    }
    
    // twitter auth provider
    let provider = OAuthProvider(providerID: "twitter.com")

    // attach listener
    var sink = PassthroughSubject<AuthService, Never>()
    var handle: AuthStateDidChangeListenerHandle?
    
    
    //MARK: - subscribe
    
    //@Use: monitor authentication changes using firebase
    func listenForAuthedUser ( _ then: @escaping (Bool,String) -> Void ) {
        self.handle = Auth.auth().addStateDidChangeListener { (auth, user) in
            if let user = user {
                self.firebase_user = user.uid
                then(true, user.uid)
            } else {
                self.firebase_user = nil
                then(false, "")
            }
        }
    }
    
    //@use: unsub to firebase
    func unsubscribe () {
        if let handle = self.handle {
            Auth.auth().removeStateDidChangeListener(handle)
        }
    }
    
    //MARK: - auth with twitter    
    
    /// @Use: sign in with twitter
    /// - Doc: https://firebase.google.com/docs/auth/ios/twitter-login
    /// - Parameter then: on susccess sign in continue fn
    /// @Important, make sure you do:
    ///
    /// - add custom url link for info.list
    /// Add custom URL schemes to your Xcode project:
    /// Open your project configuration: double-click the project name in the left tree view. Select your app from the TARGETS section, then select the Info tab, and expand the URL Types section.
    /// Click the + button, and add a URL scheme for your reversed client ID. To find this value, open the GoogleService-Info.plist configuration file, and look for the REVERSED_CLIENT_ID key. Copy the value of that key, and paste it into the URL Schemes box on the configuration page. Leave the other fields blank.
    ///
    /// - Register your app as a developer application on Twitter and get your app's OAuth API key and API secret.
    /// Make sure your Firebase OAuth redirect URI (e.g. my-app-12345.firebaseapp.com/__/auth/handler) is set as your Authorization callback URL
    ///  in your app's settings page on your Twitter app'sconfig.
    ///
    ///@issues: https://github.com/firebase/firebase-ios-sdk/issues/4414
    //
    func auth_with_twitter( then: @escaping(API_Response) -> Void ){
        
        openedWithoutAuth = true;

        provider.getCredentialWith(nil) { credential, error in
            
            if let err = error {

                then(API_Response(success: false, message: "\(err.localizedDescription)", data: [:]))

            } else {

                if let cred = credential {

                    Auth.auth().signIn(with: cred) { authResult, error in

                        if let err = error {

                            then(API_Response(success: false, message: "\(err.localizedDescription)", data: [:]))

                        } else if let authResult = authResult {

                            if let profile = authResult.additionalUserInfo?.profile as? [String:Any] {

                                let userid = authResult.user.uid
                                self.firebase_user = userid
                                
                                var screen_name : String = ""
                                if let str = profile["screen_name"] as? String {
                                    screen_name = str;
                                }
                                
                                let params = make_post_params(params: [
                                    URLQueryItem(name:"userID", value: userid),
                                    URLQueryItem(name:"twitterUserName", value: screen_name),
                                ])

                                go_axios_post(
                                    with : params,
                                    url  : API_Endpoint.create_user.str,
                                    succ : {(res) in return},
                                    succP: {(res) in return},
                                    fail : {(err) in return}
                                )

                                then(API_Response(success: true, message: "authenticated!", data: [:]))

                            } else {
                                then(API_Response(success: false, message: "we cannot locate your twitter profile", data: [:]))
                            }
                        } else {
                            then(API_Response(success: false, message: "failed to parse auth result", data: [:]))
                        }
                    }
                } else {
                    
                    then(API_Response(success: false, message: "no authentication credential found", data: [:]))
                }
            }
        }
    }
    
    //MARK: - auth with email and create user
    
    
    /// @Use: authenticate with email + passowrd
    /// - Parameters:
    ///   - email: user email
    ///   - password: user password
    ///   - then: succ if authed and user record created
    func auth_with_email( email: String, password: String,  then: @escaping(API_Response) -> Void ){
        
        openedWithoutAuth = true;
        
        authenticate(email: email, password: password){(succ,userid,msg) in
            
            guard succ else {
                return then(api_res_fail(msg));
            }
            
            self.firebase_user = userid

            let params = make_post_params(params: [
                URLQueryItem(name:"userID", value: userid),
                URLQueryItem(name:"twitterUserName", value: ""),
            ])

            go_axios_post(
                with : params,
                url  : API_Endpoint.create_user.str,
                succ : {(res) in return},
                succP: {(res) in return},
                fail : {(err) in return}
            )

            then(API_Response(success: true, message: "authenticated!", data: [:]))
            
        }
    }
    
    
    
    //MARK: - fetch (email,password) from db;
    
    /// retrieve QR code and sign in
    /// - Parameter qr_seed: string decoded from qr code
    /// If user found, then parse data and  try loggin in,
    /// else fail
    func auth_with_QR_code_seed(
        qr_seed: String,
        then: @escaping(API_Response) -> Void
    ){

        let params = make_post_params(params: [
            URLQueryItem(name: "decoded_qr_code", value: qr_seed)
        ])
        go_axios_post(
            with: params,
            url: API_Endpoint.try_auth_on_mobile.str,
            succ: {(res) in return},
            succP: {(res) in
                if ( res.success ){
                    guard let email = res.data["email"] as? String else {
                        return then(api_res_fail("we cannot locate a valid email for you"))
                    }
                    guard let password = res.data["password"] as? String else {
                        return then(api_res_fail("we cannot locate a valid auth token for you"))
                    }
                    // try authenticate, then ping firebase auth token to firebase db
                    // to assocate qr code created account with firebase `_uuid` auth token
                    self.authenticate(email: email, password: password){(did_auth, _uuid, _msg) in
                        if ( did_auth ){
                            self.did_auth_on_mobile(res: res, uuid: _uuid)
                            then(API_Response(success: true, message: _msg, data: [:]))
                        }
                    }
                } else {
                    then(res)
                }

            },
            fail: {(err) in
                then(api_res_fail("Failed to read QR code: \(err)"))
            })
    }

    // @use: did authenticate on mobile
    func did_auth_on_mobile( res: API_Response, uuid: String){
        guard let userid = res.data["userID"] as? String else {
            return;
        }
        let params = make_post_params(params: [
            URLQueryItem(name:"userID",value:userid),
            URLQueryItem(name:"firebase_auth_uuid", value:uuid)
        ])
        go_axios_post(
            with : params,
            url  : API_Endpoint.did_auth_on_mobile.str,
            succ : {(res) in return },
            succP: {(res) in return },
            fail : {(err) in return }
        )
    }
    
    //MARK: - auth methods
    
    func signOut () -> Bool {
        do {
            try Auth.auth().signOut()
            self.firebase_user = nil
            return true
        } catch {
            return false
        }
    }
    

    // @Use: try to sign in user if account exists.
    //      if no account exists, then sign up user.
    func authenticate(
        email: String,
        password: String,
        then: @escaping (Bool, UserID, Message) -> Void
    ) {

        Auth.auth().signIn(withEmail: email, password: password, completion: {(res,err) in

            if let authed_user = res?.user {
                
                self.firebase_user = authed_user.uid
                then( true, authed_user.uid, "Signed in!" )

            } else if let err = err {
                
                if let errCode = AuthErrorCode(rawValue: err._code) {
                    
                    switch(errCode){

                    case .userNotFound:
                        
                        // sign up user, then init user blob
                        self.signUp(email: email, password: password){ (succ,uid,msg) in
                            
                            //if (succ && uid != ""){
                            //    AppService.createNewUser(at: uid, with: email)
                            //}
                            then(succ,uid,msg)
                        }
                        break;
                    case .accountExistsWithDifferentCredential:
                         then(false,"","accountExistsWithDifferentCredential")
                           //print("0- Indicates account linking is required.")
                     case .adminRestrictedOperation:
                         then(false,"","adminRestrictedOperation")
                           //print("1- Indicates that the operation is admin restricted.")
                     case .appNotAuthorized:
                         then(false,"","appNotAuthorized")
                           //print("2- Indicates the App is not authorized to use Firebase Authentication with the provided API Key.")
                     case .appNotVerified:
                         then(false,"","appNotVerified")
                           //print("3- Indicates that the app could not be verified by Firebase during phone number authentication.")
                     case .appVerificationUserInteractionFailure:
                         then(false,"","appVerificationUserInteractionFailure")
                           //print("4- Indicates a general failure during the app verification flow.")
                     case .captchaCheckFailed:
                         then(false,"","captchaCheckFailed")
                           //print("5- Indicates that the reCAPTCHA token is not valid.")
                     case .credentialAlreadyInUse:
                         then(false,"","credentialAlreadyInUse")
                           //print("6- Indicates an attempt to link with a credential that has already been linked with a different Firebase account")
                     case .customTokenMismatch:
                         then(false,"","customTokenMismatch")
                           //print("7- Indicates the service account and the API key belong to different projects.")
                     case .dynamicLinkNotActivated:
                         then(false,"","dynamicLinkNotActivated")
                           //print("8- Indicates that a Firebase Dynamic Link is not activated.")
                     case .emailAlreadyInUse:
                         then(false,"","emailAlreadyInUse")
                           //print("9- Indicates the email used to attempt a sign up is already in use.")
                     case .emailChangeNeedsVerification:
                         then(false,"","emailChangeNeedsVerification")
                           //print("10- Indicates that the a verifed email is required to changed to.")
                     case .expiredActionCode:
                         then(false,"","expiredActionCode")
                           //print("11- Indicates the OOB code is expired.")
                     case .gameKitNotLinked:
                         then(false,"","gameKitNotLinked")
                           //print("12- Indicates that the GameKit framework is not linked prior to attempting Game Center signin.")
                     case .internalError:
                         then(false,"","internalError")
                           //print("13- Indicates an internal error occurred.")
                     case .invalidActionCode:
                         then(false,"","invalidActionCode")
                           //print("15- Indicates the OOB code is invalid.")
                     case .invalidAPIKey:
                         then(false,"","invalidAPIKey")
                           //print("15- Indicates an invalid API key was supplied in the request.")
                     case .invalidAppCredential:
                         then(false,"","invalidAppCredential")
                           //print("16- Indicates that an invalid APNS device token was used in the verifyClient request.")
                     case .invalidClientID:
                         then(false,"","invalidClientID")
                           //print("17- Indicates that the clientID used to invoke a web flow is invalid.")
                     case .invalidContinueURI:
                         then(false,"","invalidContinueURI")
                           //print("18- Indicates that the domain specified in the continue URI is not valid.")
                     case .invalidCredential:
                         then(false,"","invalidCredential")
                           //print("19- Indicates the IDP token or requestUri is invalid.")
                     case .invalidCustomToken:
                         then(false,"","invalidCustomToken")
                           //print("20- Indicates a validation error with the custom token.")
                     case .invalidDynamicLinkDomain:
                           //print("21- Indicates that the Firebase Dynamic Link domain used is either not configured or is unauthorized for the current project.")
                         then(false,"","invalidDynamicLinkDomain")
                     case .invalidEmail:
                           //print("22- Indicates the email is invalid.")
                         then(false,"","invalidEmail")
                     case .invalidMessagePayload:
                         then(false,"","invalidMessagePayload")
                           //print("23- Indicates that there are invalid parameters in the payload during a 'send password reset email' attempt.")
                     case .invalidMultiFactorSession:
                           //print("24- Indicates that the multi factor session is invalid.")
                         then(false,"","invalidMultiFactorSession")
                     case .invalidPhoneNumber:
                           //print("25- Indicates that an invalid phone number was provided in a call to verifyPhoneNumber:completion:.")
                         then(false,"","invalidPhoneNumber")
                     case .invalidProviderID:
                         then(false,"","invalidProviderID")
                           //print("26- Represents the error code for when the given provider id for a web operation is invalid.")
                     case .invalidRecipientEmail:
                         then(false,"","invalidRecipientEmail")
                           //print("27- Indicates that the recipient email is invalid.")
                     case .invalidSender:
                         then(false,"","invalidSender")
                           //print("28- Indicates that the sender email is invalid during a “send password reset email” attempt.")
                     case .invalidUserToken:
                         then(false,"","invalidUserToken")
                           //print("29- Indicates user’s saved auth credential is invalid, the user needs to sign in again.")
                     case .invalidVerificationCode:
                         then(false,"","invalidVerificationCode")
                           //print("30- Indicates that an invalid verification code was used in the verifyPhoneNumber request.")
                     case .invalidVerificationID:
                         then(false,"","invalidVerificationID")
                           //print("31- Indicates that an invalid verification ID was used in the verifyPhoneNumber request.")
                     case .keychainError:
                         then(false,"","keychainError")
                           //print("32- Indicates an error occurred while attempting to access the keychain.")
                     case .localPlayerNotAuthenticated:
                         then(false,"","localPlayerNotAuthenticated")
                           //print("33- Indicates that the local player was not authenticated prior to attempting Game Center signin.")
                     case .maximumSecondFactorCountExceeded:
                         then(false,"","maximumSecondFactorCountExceeded")
                           //print("34- Indicates that the maximum second factor count is exceeded.")
                     case .malformedJWT:
                         then(false,"","malformedJWT")
                           //print("35- Raised when a JWT fails to parse correctly. May be accompanied by an underlying error describing which step of the JWT parsing process failed.")
                     case .missingAndroidPackageName:
                         then(false,"","missingAndroidPackageName")
                           //print("36- Indicates that the android package name is missing when the androidInstallApp flag is set to true.")
                     case .missingAppCredential:
                         then(false,"","missingAppCredential")
                           //print("37- Indicates that the APNS device token is missing in the verifyClient request.")
                     case .missingAppToken:
                         then(false,"","missingAppToken")
                           //print("38- Indicates that the APNs device token could not be obtained. The app may not have set up remote notification correctly, or may fail to forward the APNs device token to FIRAuth if app delegate swizzling is disabled.")
                     case .missingContinueURI:
                         then(false,"","missingContinueURI")
                           //print("39- Indicates that a continue URI was not provided in a request to the backend which requires one.")
                     case .missingClientIdentifier:
                         then(false,"","missingClientIdentifier")
                           //print("40- Indicates an error for when the client identifier is missing.")
                     case .missingEmail:
                         then(false,"","missingEmail")
                           //print("41- Indicates that an email address was expected but one was not provided.")
                     case .missingIosBundleID:
                           //print("42- Indicates that the iOS bundle ID is missing when a iOS App Store ID is provided.")
                         then(false,"","missingIosBundleID")
                     case .missingMultiFactorSession:
                         then(false,"","missingMultiFactorSession")
                           //print("43- Indicates that the multi factor session is missing.")
                     case .missingOrInvalidNonce:
                           //print("44- Indicates that the nonce is missing or invalid.")
                         then(false,"","missingOrInvalidNonce")
                     case .missingPhoneNumber:
                         then(false,"","missingPhoneNumber")
                           //print("45- Indicates that a phone number was not provided in a call to verifyPhoneNumber:completion.")
                     case .missingVerificationCode:
                           //print("46- Indicates that the phone auth credential was created with an empty verification code.")
                         then(false,"","missingVerificationCode")
                     case .missingVerificationID:
                         then(false,"","missingVerificationID")
                           //print("47- Indicates that the phone auth credential was created with an empty verification ID.")
                     case .missingMultiFactorInfo:
                           //print("48- Indicates that the multi factor info is missing.")
                         then(false,"","missingMultiFactorInfo")
                     case .multiFactorInfoNotFound:
                         then(false,"","multiFactorInfoNotFound")
                           //print("49- Indicates that the multi factor info is not found.")
                     case .networkError:
                           //print("50- Indicates a network error occurred (such as a timeout, interrupted connection, or unreachable host). These types of errors are often recoverable with a retry. The NSUnderlyingError field in the NSError.userInfo dictionary will contain the error encountered.")
                         then(false,"","networkError")
                     case .noSuchProvider:
                         then(false,"","noSuchProvider")
                           //print("51- Indicates an attempt to unlink a provider that is not linked.")
                     case .notificationNotForwarded:
                         then(false,"","notificationNotForwarded")
                           //print("52- Indicates that the app fails to forward remote notification to FIRAuth.")
                     case .nullUser:
                           //print("53- Indicates that a non-null user was expected as an argmument to the operation but a null user was provided.")
                         then(false,"","nullUser")
                      case .operationNotAllowed:
                           //print("54- Indicates the administrator disabled sign in with the specified identity provider.")
                         then(false,"","operationNotAllowed")
                     case .providerAlreadyLinked:
                         then(false,"","providerAlreadyLinked")
                           //print("55- Indicates an attempt to link a provider to which the account is already linked.")
                     case .quotaExceeded:
                           //print("56- Indicates that the quota of SMS messages for a given project has been exceeded.")
                         then(false,"","quotaExceeded")
                     case .rejectedCredential:
                         then(false,"","rejectedCredential")
                           //print("57- Indicates that the credential is rejected because it’s misformed or mismatching.")
                     case .requiresRecentLogin:
                         then(false,"","")
                           //print("58- Indicates the user has attemped to change email or password more than 5 minutes after signing in.")
                     case .secondFactorAlreadyEnrolled:
                           //print("59- Indicates that the second factor is already enrolled.")
                         then(false,"","")
                     case .secondFactorRequired:
                           //print("60- Indicates that the second factor is required for signin.")
                         then(false,"","")
                     case .sessionExpired:
                         then(false,"","")
                           //print("61- Indicates that the SMS code has expired.")
                     case .tooManyRequests:
                           //print("62- Indicates that too many requests were made to a server method.")
                         then(false,"","")
                     case .unauthorizedDomain:
                           //print("63- Indicates that the domain specified in the continue URL is not whitelisted in the Firebase console.")
                         then(false,"","")
                     case .unsupportedFirstFactor:
                         then(false,"","")
                           //print("64- Indicates that the first factor is not supported.")
                     case .unverifiedEmail:
                           //print("65- Indicates that the email is required for verification.")
                         then(false,"","")
                     case .userDisabled:
                           //print("66- Indicates the user’s account is disabled on the server.")
                         then(false,"","")
                     case .userMismatch:
                         then(false,"","")
                           //print("67- Indicates that an attempt was made to reauthenticate with a user which is not the current user.")
                     case .userTokenExpired:
                           //print("69- Indicates the saved token has expired, for example, the user may have changed account password on another device. The user needs to sign in again on the device that made this request.")
                         then(false,"","")
                     case .weakPassword:
                           //print("70- Indicates an attempt to set a password that is considered too weak.")
                         then(false,"","")
                     case .webContextAlreadyPresented:
                         then(false,"","")
                           //print("71- Indicates that an attempt was made to present a new web context while one was already being presented.")
                     case .webContextCancelled:
                         then(false,"","")
                           //print("72- Indicates that the URL presentation was cancelled prematurely by the user.")
                     case .webInternalError:
                         then(false,"","")
                           //print("73- Indicates that an internal error occurred within a SFSafariViewController or WKWebView.")
                     case .webNetworkRequestFailed:
                         then(false,"","")
                           //print("74- Indicates that a network request within a SFSafariViewController or WKWebView failed.")
                     case .wrongPassword:
                         //print("75- Indicates the user attempted sign in with a wrong password.")
                         then(false,"","wrong password!")
                     case .webSignInUserInteractionFailure:
                           //print("76- Indicates a general failure during a web sign-in flow.")
                         then(false,"","internal error!")
                     default:
                           //print("77- Unknown error occurred")
                         then(false,"","Unknown error")
                     }
                     
                 } else {
                     
                     then(false,"", "unknown error!")
                 }
                 

             } else {
                 
                 then(false,"", "unknown error!")
             }
        })
    }
    
    
    // @use: signup user
    func signUp(
        email: String,
        password: String,
        then: @escaping (Bool, UserID, Message) -> Void
    ) {

        Auth.auth().createUser(withEmail: email, password: password, completion: {(res,error) in
            
            // successfully created user
            if let user = res?.user {

                self.firebase_user = user.uid
                then(true, user.uid, "success!")
            
            // error
            } else if let error = error {
                
                if let errCode = AuthErrorCode(rawValue: error._code) {
                    switch(errCode){
                    case .accountExistsWithDifferentCredential:
                        then(false, "", "account already exist with different password")
                        break  //print("0- Indicates account linking is required.")
                    case .adminRestrictedOperation:
                        then(false, "", "you cannot sign up for an account right now")
                        break  //print("1- Indicates that the operation is admin restricted.")
                    case .appNotAuthorized:
                        then(false, "", "this app is closed to new members")
                        break  //print("2- Indicates the App is not authorized to use Firebase Authentication with the provided API Key.")
                    case .appNotVerified:
                        then(false, "", "this app is closed to new members")
                        break  //print("3- Indicates that the app could not be verified by Firebase during phone number authentication.")
                    case .appVerificationUserInteractionFailure:
                        then(false, "", "this app cannot accept new members at this time")
                        break  //print("4- Indicates a general failure during the app verification flow.")
                    case .captchaCheckFailed:
                        then(false, "", "captcha checks failed")
                        break  //print("5- Indicates that the reCAPTCHA token is not valid.")
                    case .credentialAlreadyInUse:
                        then(false, "", "you cannot login to two accounts at a time")
                        break  //print("6- Indicates an attempt to link with a credential that has already been linked with a different Firebase account")
                    case .customTokenMismatch:
                        then(false, "", "your identity token is invalid")
                        break  //print("7- Indicates the service account and the API key belong to different projects.")
                    case .dynamicLinkNotActivated:
                        then(false, "", "dynamic link is not activiated at this time")
                        break  //print("8- Indicates that a Firebase Dynamic Link is not activated.")
                    case .emailAlreadyInUse:
                        then(false, "", "your email correspond to a different user")
                        break  //print("9- Indicates the email used to attempt a sign up is already in use.")
                    case .emailChangeNeedsVerification:
                        then(false, "", "your email has been compromised and you need a new email to authenticate")
                        break  //print("10- Indicates that the a verifed email is required to changed to.")
                    case .expiredActionCode:
                        then(false, "", "the OOB code as expired")
                        break  //print("11- Indicates the OOB code is expired.")
                    case .gameKitNotLinked:
                        then(false, "", "game kit is not linkedin")
                        break  //print("12- Indicates that the GameKit framework is not linked prior to attempting Game Center signin.")
                    case .internalError:
                        then(false, "", "internal error :(")
                        break  //print("13- Indicates an internal error occurred.")
                    case .invalidActionCode:
                        then(false, "", "OOB code is no longer valid")
                        break  //print("15- Indicates the OOB code is invalid.")
                    case .invalidAPIKey:
                        then(false, "", "invalid API key")
                        break  //print("15- Indicates an invalid API key was supplied in the request.")
                    case .invalidAppCredential:
                        then(false, "", "invalid APNS token provided")
                        break  //print("16- Indicates that an invalid APNS device token was used in the verifyClient request.")
                    case .invalidClientID:
                        then(false, "", "invalid client ID")
                        break  //print("17- Indicates that the clientID used to invoke a web flow is invalid.")
                    case .invalidContinueURI:
                        then(false, "", "continuation domain URL is invalid")
                        break  //print("18- Indicates that the domain specified in the continue URI is not valid.")
                    case .invalidCredential:
                        then(false, "", "the IDP token is invalid")
                        break  //print("19- Indicates the IDP token or requestUri is invalid.")
                    case .invalidCustomToken:
                        then(false, "", "the custom token is not valid")
                        break  //print("20- Indicates a validation error with the custom token.")
                    case .invalidDynamicLinkDomain:
                        then(false, "", "dynamic link domain is invalid")
                        break  //print("21- Indicates that the Firebase Dynamic Link domain used is either not configured or is unauthorized for the current project.")
                    case .invalidEmail:
                        then(false, "", "invalid email!")
                        break  //print("22- Indicates the email is invalid.")
                    case .invalidMessagePayload:
                        then(false, "", "invalid message payload")
                        break  //print("23- Indicates that there are invalid parameters in the payload during a 'send password reset email' attempt.")
                    case .invalidMultiFactorSession:
                        then(false, "", "invalid multifactor session")
                        break  //print("24- Indicates that the multi factor session is invalid.")
                    case .invalidPhoneNumber:
                        then(false, "", "invalid phone number!")
                        break  //print("25- Indicates that an invalid phone number was provided in a call to verifyPhoneNumber:completion:.")
                    case .invalidProviderID:
                        then(false, "", "invalid provider id")
                        break  //print("26- Represents the error code for when the given provider id for a web operation is invalid.")
                    case .invalidRecipientEmail:
                        then(false, "", "invalid receipient invalid!")
                        break  //print("27- Indicates that the recipient email is invalid.")
                    case .invalidSender:
                        then(false, "", "invalid sender address for password reset")
                        break  //print("28- Indicates that the sender email is invalid during a “send password reset email” attempt.")
                    case .invalidUserToken:
                        then(false, "", "invalid credential! please sign in again")
                        break  //print("29- Indicates user’s saved auth credential is invalid, the user needs to sign in again.")
                    case .invalidVerificationCode:
                        then(false, "", "invalid verification code. please check your message again")
                        break  //print("30- Indicates that an invalid verification code was used in the verifyPhoneNumber request.")
                    case .invalidVerificationID:
                        then(false, "", "invalid verification ID")
                        break  //print("31- Indicates that an invalid verification ID was used in the verifyPhoneNumber request.")
                    case .keychainError:
                        then(false, "", "key chain error!")
                        break  //print("32- Indicates an error occurred while attempting to access the keychain.")
                    case .localPlayerNotAuthenticated:
                        then(false, "", "local player is not valid!")
                        break  //print("33- Indicates that the local player was not authenticated prior to attempting Game Center signin.")
                    case .maximumSecondFactorCountExceeded:
                        then(false, "", "you have used the maximum number of sign in attempts")
                        break  //print("34- Indicates that the maximum second factor count is exceeded.")
                    case .malformedJWT:
                        then(false, "", "invalid JWT token")
                        break  //print("35- Raised when a JWT fails to parse correctly. May be accompanied by an underlying error describing which step of the JWT parsing process failed.")
                    case .missingAndroidPackageName:
                        then(false, "", "android package name invalid")
                        break  //print("36- Indicates that the android package name is missing when the androidInstallApp flag is set to true.")
                    case .missingAppCredential:
                        then(false, "", "APNS device token is missing or invalid")
                        break  //print("37- Indicates that the APNS device token is missing in the verifyClient request.")
                    case .missingAppToken:
                        then(false, "", "your APNs token is invalid")
                        break  //print("38- Indicates that the APNs device token could not be obtained. The app may not have set up remote notification correctly, or may fail to forward the APNs device token to FIRAuth if app delegate swizzling is disabled.")
                    case .missingContinueURI:
                        then(false, "", "continuation URL is invalid")
                        break  //print("39- Indicates that a continue URI was not provided in a request to the backend which requires one.")
                    case .missingClientIdentifier:
                        then(false, "", "client id is missing")
                        break  //print("40- Indicates an error for when the client identifier is missing.")
                    case .missingEmail:
                        then(false, "", "email address invalid")
                        break  //print("41- Indicates that an email address was expected but one was not provided.")
                    case .missingIosBundleID:
                        then(false, "", "missing bundle ID")
                        break  //print("42- Indicates that the iOS bundle ID is missing when a iOS App Store ID is provided.")
                    case .missingMultiFactorSession:
                        then(false, "", "multi-factor session is missing")
                        break  //print("43- Indicates that the multi factor session is missing.")
                    case .missingOrInvalidNonce:
                        then(false, "", "invalid nonce")
                        break  //print("44- Indicates that the nonce is missing or invalid.")
                    case .missingPhoneNumber:
                        then(false, "", "invalid phone number")
                        break  //print("45- Indicates that a phone number was not provided in a call to verifyPhoneNumber:completion.")
                    case .missingVerificationCode:
                        then(false, "", "please enter a valid verification code")
                        break  //print("46- Indicates that the phone auth credential was created with an empty verification code.")
                    case .missingVerificationID:
                        then(false, "", "please enter valid phone verification id")
                        break  //print("47- Indicates that the phone auth credential was created with an empty verification ID.")
                    case .missingMultiFactorInfo:
                        then(false, "", "missing multi-factor auth info")
                        break  //print("48- Indicates that the multi factor info is missing.")
                    case .multiFactorInfoNotFound:
                        then(false, "", "multi factor info is not foudn")
                        break  //print("49- Indicates that the multi factor info is not found.")
                    case .networkError:
                        then(false, "", "network error, please check your connection")
                        break  //print("50- Indicates a network error occurred (such as a timeout, interrupted connection, or unreachable host). These types of errors are often recoverable with a retry. The NSUnderlyingError field in the NSError.userInfo dictionary will contain the error encountered.")
                    case.noSuchProvider:
                        then(false, "", "provider cannot be unlinked")
                        break  //print("51- Indicates an attempt to unlink a provider that is not linked.")
                    case .notificationNotForwarded:
                        then(false, "", "we failed to forward the remote notification")
                        break  //print("52- Indicates that the app fails to forward remote notification to FIRAuth.")
                    case .nullUser:
                        then(false, "", "invalid user!")
                        break  //print("53- Indicates that a non-null user was expected as an argmument to the operation but a null user was provided.")
                    case .operationNotAllowed:
                        then(false, "", "sign in is not allowed at the moment")
                        break  //print("54- Indicates the administrator disabled sign in with the specified identity provider.")
                    case .providerAlreadyLinked:
                        then(false, "", "provider is already linked")
                        break  //print("55- Indicates an attempt to link a provider to which the account is already linked.")
                    case .quotaExceeded:
                        then(false, "", "SMS messaging quota exceeded")
                        break  //print("56- Indicates that the quota of SMS messages for a given project has been exceeded.")
                    case .rejectedCredential:
                        then(false, "", "invalid credentials")
                        break  //print("57- Indicates that the credential is rejected because it’s misformed or mismatching.")
                    case .requiresRecentLogin:
                        then(false, "", "you may have tried to change email or password less than 5 minutes after signin up")
                        break  //print("58- Indicates the user has attemped to change email or password more than 5 minutes after signing in.")
                    case .secondFactorAlreadyEnrolled:
                        then(false, "", "second factor is already enrolled")
                        break  //print("59- Indicates that the second factor is already enrolled.")
                    case .secondFactorRequired:
                        then(false, "", "second factor is required for signing in")
                        break  //print("60- Indicates that the second factor is required for signin.")
                    case .sessionExpired:
                        then(false, "", "SMS code has expired")
                        break  //print("61- Indicates that the SMS code has expired.")
                    case .tooManyRequests:
                        then(false, "", "too many requests were made")
                        break  //print("62- Indicates that too many requests were made to a server method.")
                    case .unauthorizedDomain:
                        then(false, "", "the auth URL is not authorized")
                        break  //print("63- Indicates that the domain specified in the continue URL is not whitelisted in the Firebase console.")
                    case .unsupportedFirstFactor:
                        then(false, "", "the first auth factor is unsupported")
                        break  //print("64- Indicates that the first factor is not supported.")
                    case .unverifiedEmail:
                        then(false, "", "invalid email")
                        break  //print("65- Indicates that the email is required for verification.")
                    case .userDisabled:
                        then(false, "", "your account has been disabled")
                        break  //print("66- Indicates the user’s account is disabled on the server.")
                    case .userMismatch:
                        then(false, "", "your account does not match the one we have on record")
                        break  //print("67- Indicates that an attempt was made to reauthenticate with a user which is not the current user.")
                    case .userNotFound:
                        then(false, "", "we cannot find you!")
                        break  //print("68- Indicates the user account was not found.")
                    case .userTokenExpired:
                        then(false, "", "your token has expired")
                        break  //print("69- Indicates the saved token has expired, for example, the user may have changed account password on another device. The user needs to sign in again on the device that made this request.")
                    case .weakPassword:
                        then(false, "", "please enter a stronger password!")
                        break  //print("70- Indicates an attempt to set a password that is considered too weak.")
                    case .webContextAlreadyPresented:
                        then(false, "", "you're going too fast! please slow down")
                        break  //print("71- Indicates that an attempt was made to present a new web context while one was already being presented.")
                    case .webContextCancelled:
                        then (false, "", "you closed the auth page before we can authorize you")
                        break  //print("72- Indicates that the URL presentation was cancelled prematurely by the user.")
                    case .webInternalError:
                        then(false, "", "safari error")
                        break  //print("73- Indicates that an internal error occurred within a SFSafariViewController or WKWebView.")
                    case .webNetworkRequestFailed:
                        then(false, "", "safari network error")
                        break  //print("74- Indicates that a network request within a SFSafariViewController or WKWebView failed.")
                    case .wrongPassword:
                        then(false, "", "invalid password, please try again")
                        break  //print("75- Indicates the user attempted sign in with a wrong password.")
                    case .webSignInUserInteractionFailure:
                        then(false, "", "unknown failure")
                        break  //print("76- Indicates a general failure during a web sign-in flow.")
                    default:
                        then(false, "", "uncaught failure")
                        break  //print("77- Unknown error occurred")
                    }
                    
                } else {
                    
                    then(false, "", "Oh no! Unknown error occured!")
                }

            } else {
                    
                then(false, "", "Oh no! Unknown error occured!")
            }

        })
    }
    

}
