//
//  LumoApp.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//


import SwiftUI
import Firebase
import Foundation
import AlertToast
import UserNotifications
import FirebaseMessaging

//MARK: - global app entry point


@main
struct LumoApp: App {
    
    ///@UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    // @important: initalize firebase here
    // @Note: whitelist twitter auth redirect URL here: https://stackoverflow.com/questions/61514076/firebase-phone-auth-getting-ios-error-register-custom-url-scheme
    init() {
        FirebaseApp.configure()
    }
    var body: some Scene {
        WindowGroup {
            ContentView( didAuth: false )
                .environmentObject(AuthService())
                .environmentObject(AppService())
                .environmentObject(AlertViewModel())
        }
    }
}

/** MARK: - app delegate for push notification


/// @Source: https://designcode.io/swiftui-advanced-handbook-push-notifications-part-2
/// @pod source: https://firebase.google.com/docs/ios/setup
/// @debug source: https://firebase.blog/posts/2017/01/debugging-firebase-cloud-messaging-on
class AppDelegate: NSObject, UIApplicationDelegate {

    let gcmMessageIDKey = "gcm.message_id"

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
        
        FirebaseApp.configure()

        Messaging.messaging().delegate = self

        if #available(iOS 10.0, *) {
          // For iOS 10 display notification (sent via APNS)
          UNUserNotificationCenter.current().delegate = self

          let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
          UNUserNotificationCenter.current().requestAuthorization(
            options: authOptions,
            completionHandler: { _, _ in }
          )
        } else {
          let settings: UIUserNotificationSettings =
            UIUserNotificationSettings(types: [.alert, .badge, .sound], categories: nil)
          application.registerUserNotificationSettings(settings)
        }

        application.registerForRemoteNotifications()
        
//        Messaging.messaging().token { token, error in
//          if let error = error {
//            print("\n\n\n\nError fetching FCM registration token: \(error)")
//          } else if let token = token {
//            print("\n\n\nFCM registration token: \(token)")
//            //self.fcmRegTokenMessage.text  = "Remote FCM registration token: \(token)"
//          }
//        }

        return true
    }

    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable: Any],
                     fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {

      if let messageID = userInfo[gcmMessageIDKey] {
        //print("Message ID: \(messageID)")
      }

      //print(userInfo)

      completionHandler(UIBackgroundFetchResult.newData)
    }
}

extension AppDelegate: MessagingDelegate {
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        let deviceToken:[String: String] = ["token": fcmToken ?? ""]
        ///print("Device token: \(fcmToken) \n\n\n") // This token can be used for testing notifications on FCM
    }
}


@available(iOS 10, *)
extension AppDelegate : UNUserNotificationCenterDelegate {
    
    // Receive displayed notifications for iOS 10 devices.
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        let userInfo = notification.request.content.userInfo
        
        if let messageID = userInfo[gcmMessageIDKey] {
//            print("UNUserNotificationCenterDelegate-Message ID: \(messageID)")
        }
        
//        print("UNUserNotificationCenterDelegate \(userInfo)")
        
        // Change this to your preferred presentation option
        completionHandler([[.banner, .badge, .sound]])
    }
    
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
//        print("succ: didRegisterForRemoteNotificationsWithDeviceToken: \(deviceToken)")
    }
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
//        print("error: didFailToRegisterForRemoteNotificationsWithError: \(error)")
        
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo
        
        if let messageID = userInfo[gcmMessageIDKey] {
//            print("Message ID from userNotificationCenter didReceive: \(messageID)")
        }
        
//        print(userInfo)
        
        completionHandler()
    }
    
}

 **/


//MARK: - toast model

// @use: global toast
// @doc: https://medium.com/swlh/presenting-apples-music-alerts-in-swiftui-7f5c32cebed6
// @doc: https://github.com/elai950/AlertToast#cocoapods
class AlertViewModel: ObservableObject{
    
    @Published var show = false

    @Published var alertToast = AlertToast(type: .regular, title: ""){
        didSet{
            show.toggle()
        }
    }
    
    func dismissAlert(){
        DispatchQueue.main.async {
            self.show = false
        }
    }

    func showComplete(h1 : String, h2: String?=nil ){
        DispatchQueue.main.async {
            self.alertToast = AlertToast( type: .complete(.green), title: h1, subTitle: h2 ?? "")
        }
    }
    
    func showSuccess(h1: String, h2: String?=nil ){
        DispatchQueue.main.async {
            self.alertToast = AlertToast(type: .complete(.blue), title: h1, subTitle: h2 ?? "")
        }
    }
    
    func showLoading(h1: String, h2: String?=nil){
        DispatchQueue.main.async {
            self.alertToast = AlertToast(type: .loading, title: h1, subTitle: h2)
        }
    }

    func showFail(h1 : String, h2: String?=nil ){
        DispatchQueue.main.async {
            self.alertToast = AlertToast( type: .error(.red1), title: h1, subTitle: h2 ?? "")
        }
    }
}
