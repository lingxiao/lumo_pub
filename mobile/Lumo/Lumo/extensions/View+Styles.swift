//
//  View+Styles.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//
//
//  Created by lingxiao on 8/15/22.
//  @Use: https://stackoverflow.com/questions/56760335/round-specific-corners-swiftui
//
//

import Foundation
import SwiftUI


//MARK: - custom corner view

struct AppCardCorners: ViewModifier {

    func body(content: Content) -> some View {
        content
            .cornerRadius(10, corners:.topLeft)
            .cornerRadius(40, corners: .topRight)
            .cornerRadius(40, corners: .bottomLeft)
            .cornerRadius(10, corners: .bottomRight)
    }
}


struct AppBorderBottom: ViewModifier {

    func body(content: Content) -> some View {
        VStack {
            content
            Divider()
             .frame(height: 1)
             .padding(.horizontal, 30)
             .background(Color.surface3)
        }
    }
}

struct AppBurntPage: ViewModifier {
    
    var src : String = "lumoRed1"
    var isOn: Bool = true

    func body(content: Content) -> some View {
        let fr = UIScreen.main.bounds
        ZStack {
            if isOn {
                Image(src)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: fr.width, height: fr.height, alignment: .center)
            }
            content
        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .background(Color.red3)
        .edgesIgnoringSafeArea(.all)
    }
}

struct AppBurntPageAlt: ViewModifier {
    
    var src : String = "lumoRed2"

    func body(content: Content) -> some View {
        let fr = UIScreen.main.bounds
        ZStack {
            Image(src)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: fr.width, height: fr.height, alignment: .center)
            content
        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .background(Color.red3)
        .edgesIgnoringSafeArea(.all)
    }
}


//MARK: - custom fade view

/// @Use: fade top and bottom of a view
/// @Doc; https://stackoverflow.com/questions/59903969/how-do-i-fade-the-top-or-bottom-edge-of-a-sf-symbol-in-swiftui
struct AppPageFade: ViewModifier {
    
    var top: Double
    var bottom: Double
    
    func body(content: Content) -> some View {
        content
            .mask(LinearGradient(gradient: Gradient(stops: [
                .init(color: .clear, location: 0),
                .init(color: .black, location: top),
                .init(color: .black, location: bottom),
                .init(color: .clear, location: 1)
            ]), startPoint: .top, endPoint: .bottom))
    }
    


}


//MARK: - extension

extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape( RoundedCorner(radius: radius, corners: corners) )
    }
}

struct RoundedCorner: Shape {

    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(roundedRect: rect, byRoundingCorners: corners, cornerRadii: CGSize(width: radius, height: radius))
        return Path(path.cgPath)
    }
}


extension UIDevice {
    /// Returns `true` if the device has a notch
    var hasNotch: Bool {
        guard #available(iOS 11.0, *), let window = UIApplication.shared.windows.filter({$0.isKeyWindow}).first else { return false }
        if UIDevice.current.orientation.isPortrait {
            return window.safeAreaInsets.top >= 44
        } else {
            return window.safeAreaInsets.left > 0 || window.safeAreaInsets.right > 0
        }
    }
}
