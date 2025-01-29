//
//  View+Animations.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//


import Foundation
import SwiftUI

//MARK: - animations

// source: https://www.hackingwithswift.com/quick-start/swiftui/how-to-start-an-animation-immediately-after-a-view-appears
// Create an immediate animation.
extension View {
    func animate(using animation: Animation = .easeInOut(duration: 1), _ action: @escaping () -> Void) -> some View {
        onAppear {
            withAnimation(animation) {
                action()
            }
        }
    }
}

// Create an immediate, looping animation
extension View {
    
    func animateForever(using animation: Animation = .easeInOut(duration: 1), autoreverses: Bool = false, _ action: @escaping () -> Void) -> some View {

        let repeated = animation.repeatForever(autoreverses: autoreverses)
        return onAppear {
            withAnimation(repeated) {
                action()
            }
        }
    }
    
    func animateOnce( using animation: Animation = .easeInOut(duration: 1), autoreverses: Bool = false, _ action: @escaping () -> Void) -> some View {
        
        let ntimes = animation.repeatCount(1)
        return onAppear {
            withAnimation(ntimes){
                action()
            }
        }
    }

    func animateRepeat( n times: Int, using animation: Animation = .easeInOut(duration: 1), autoreverses: Bool = false, _ action: @escaping () -> Void) -> some View {
        
        let ntimes = animation.repeatCount(times)
        return onAppear {
            withAnimation(ntimes){
                action()
            }
        }
    }

}
