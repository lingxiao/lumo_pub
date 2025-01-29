//
//  coreViews.swift
//  
//
//  Created by lingxiao on 9/10/22.
//

import Foundation
import SwiftUI
import AudioToolbox


//MARK: - constants

public let TABBAR_HEIGHT = CGFloat(120);
public let HEADER_HEIGHT = CGFloat(100);
public let HEADER_HEIGHT_2 = CGFloat(10);


//MARK: - enums

public enum PricingTier {
    case tier1
    case tier2
    case tier3
    var price: Double {
        switch self {
        case .tier1: return 5
        case .tier2: return 50
        case .tier3: return 500
        }
    }
    var volume: Int {
        switch self {
        case .tier1: return 1
        case .tier2: return 10
        case .tier3: return 100
        }
    }
}


public enum SwipeDirection {
    case rightToLeft
    case leftToRight
    case UpToDown
    case DownToUp
    case none
}

//MARK: - media

enum MediaURLKind {
    case mp4
    case png
    case jpg
    case jpeg
    case undefined
    var str : String {
        switch self {
        case .mp4: return "mp4"
        case .png: return "png"
        case .jpg: return "jpg"
        case .jpeg: return "jpeg"
        case .undefined: return "undefined"
        }
    }
}

func parseMediaUrl( _ str: String? ) -> MediaURLKind {
    guard let url = URL(string:str ?? "") else {
        return .undefined
    }
    let ext = url.pathExtension;
    if ext == MediaURLKind.mp4.str {
        return .mp4
    } else if ext == MediaURLKind.png.str {
        return .png
    } else if ext == MediaURLKind.jpg.str || ext == MediaURLKind.jpeg.str {
        return .jpg
    } else {
        return MediaURLKind.undefined;
    }
}

// @use: denote which sized asset
// has been loaded from server
enum AppImageLoadMode {
    case small
    case medium
    case full
}


enum TokenContentKind {
    case png
    case gif
    case mp4
    case mp3
    case url
    case svg
    case other
    
    var str: String {
        switch self {
            case .png: return "png"
            case .gif: return "gif"
            case .mp4: return "mp4"
            case .mp3: return "mp3"
            case .url: return "url"
            case .svg: return "svg"
            case .other: return "other"
        }
    }
}


struct Media : Identifiable, Hashable {
    var id        : String
    var index     : Int
    var kind      : TokenContentKind
    var timeStamp : Int
    var urlFull   : String?
    var urlMedium : String?
    var urlSmall  : String?
}


/// @use: buld tiwtter invite msg
/// - Parameter code: invite code
/// - Returns: return msg with string removed
func invite_message(_ code : String, remove_spaces: Bool) -> String{
    let link = GLOBAL_STAGING()
        ? "https://testnet.studio/burner/\(code)"
        : "https://lumoapp.xyz/burner/\(code)"
    let rmsg = "Join the burn: \(link)"
    let msg = rmsg.replacingOccurrences(of: " ", with: "%20")
    return remove_spaces ? msg : rmsg;
    
}


//MARK: - view utils

func roundToThree(_ m: CGFloat) -> CGFloat {
    return round(m*100)/100.0;
}

func roundToTwo(_ m: CGFloat) -> CGFloat {
    return round(m*10)/10.0;
}

func swiftNow() -> Int {
    let timestamp = NSDate().timeIntervalSince1970
    return Int(timestamp);
}


func rmvWhiteSpace(_ str: String) -> String {
    return String(str.filter { !" \n\t\r".contains($0) })
}

//MARK: - system feedback: tactile

func vibrateConfirm(){
    AudioServicesPlayAlertSoundWithCompletion(SystemSoundID(kSystemSoundID_Vibrate)){
    }
}

func vibrateError(){
    AudioServicesPlayAlertSoundWithCompletion(SystemSoundID(kSystemSoundID_Vibrate)){
    }
}


