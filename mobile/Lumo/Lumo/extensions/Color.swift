//
//  Color.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//


import Foundation
import SwiftUI


// @use: color mode
enum ColorMode {
    case DARK
    case LIGHT
}

// @use: app colors
extension Color {
    
    // whites
    static let text1 = Color(UIColor(rgb:0xF2F2F2))
    static let text2 = Color(UIColor(rgb:0xCDCDCD))
    static let text3 = Color(UIColor(rgb:0xABABAB))

    // blacks
    static let offBlack1 = Color(UIColor(rgb:0x0c0c0c))
    static let offBlack2 = Color(UIColor(rgb:0x111111))
    static let offBlack3 = Color(UIColor(rgb:0x161616))

    static let surface1 = Color(UIColor(rgb:0x161616))
    static let surface2 = Color(UIColor(rgb:0x1b1b1b))
    static let surface3 = Color(UIColor(rgb:0x242424))
    
    // accents
    static let red1 = Color(UIColor(red: 55/255, green: 0/255, blue: 0/255, alpha: 1.0))
    static let red2 = Color(UIColor(red: 156/255, green: 28/255, blue: 12/255, alpha: 1.0))
    static let red2d = Color(UIColor(red: 156/255, green: 28/255, blue: 12/255, alpha: 1.0).darker(by: 25))
    static let red3 = Color(UIColor(red: 153/255, green: 45/255, blue: 37/255, alpha: 1.0))

    
    public static var random: Color {
        return Color(UIColor(red: CGFloat(drand48()),
                             green: CGFloat(drand48()),
                             blue: CGFloat(drand48()), alpha: 1.0))
    }
    
}


extension UIColor {

    convenience init(red: Int, green: Int, blue: Int) {
       assert(red >= 0 && red <= 255, "Invalid red component")
       assert(green >= 0 && green <= 255, "Invalid green component")
       assert(blue >= 0 && blue <= 255, "Invalid blue component")

       self.init(red: CGFloat(red) / 255.0, green: CGFloat(green) / 255.0, blue: CGFloat(blue) / 255.0, alpha: 1.0)
    }

    convenience init(rgb: Int) {
       self.init(
           red: (rgb >> 16) & 0xFF,
           green: (rgb >> 8) & 0xFF,
           blue: rgb & 0xFF
       )
    }

    func lighter(by percentage: CGFloat = 10.0) -> UIColor {
        return self.adjust(by: abs(percentage))
    }

    func darker(by percentage: CGFloat = 10.0) -> UIColor {
        return self.adjust(by: -abs(percentage))
    }

    func adjust(by percentage: CGFloat) -> UIColor {
        var alpha, hue, saturation, brightness, red, green, blue, white : CGFloat
        (alpha, hue, saturation, brightness, red, green, blue, white) = (0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)

        let multiplier = percentage / 100.0

        if self.getHue(&hue, saturation: &saturation, brightness: &brightness, alpha: &alpha) {
            let newBrightness: CGFloat = max(min(brightness + multiplier*brightness, 1.0), 0.0)
            return UIColor(hue: hue, saturation: saturation, brightness: newBrightness, alpha: alpha)
        }
        else if self.getRed(&red, green: &green, blue: &blue, alpha: &alpha) {
            let newRed: CGFloat = min(max(red + multiplier*red, 0.0), 1.0)
            let newGreen: CGFloat = min(max(green + multiplier*green, 0.0), 1.0)
            let newBlue: CGFloat = min(max(blue + multiplier*blue, 0.0), 1.0)
            return UIColor(red: newRed, green: newGreen, blue: newBlue, alpha: alpha)
        }
        else if self.getWhite(&white, alpha: &alpha) {
            let newWhite: CGFloat = (white + multiplier*white)
            return UIColor(white: newWhite, alpha: alpha)
        }

        return self
    }
}


//MARK:- color extensions

extension Color {
    static var secondarySystemBackground: Color {
        #if os(iOS)
        return Color(UIColor.secondarySystemBackground)
        #elseif os(macOS)
        return Color(NSColor.controlBackgroundColor)
        #else
        #error("Unsupported Platform")
        #endif
    }
}
