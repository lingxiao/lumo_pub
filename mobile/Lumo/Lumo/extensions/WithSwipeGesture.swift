//
//  WithSwipeGesture.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//




import Foundation
import SwiftUI


//MARK:- swipes

public func trivialSwipe(_ x : CGFloat){}

struct WithHorizontalSwipeGesture: ViewModifier {

    // hof
    var swipeRightToLeft : (CGFloat) -> Void
    var swipeLeftToRight : (CGFloat) -> Void

    func body(content: Content) -> some View {
        
        VStack {
            content
        }
        .highPriorityGesture(
            DragGesture(minimumDistance: 25, coordinateSpace: .local)
            .onEnded({ value in
                if abs(value.translation.height) < abs(value.translation.width) {
                    if abs(value.translation.width) > 50.0 {
                        if value.translation.width < 0 {
                            self.swipeRightToLeft(abs(value.translation.width))
                        } else if value.translation.width > 0 {
                            self.swipeLeftToRight(abs(value.translation.width))
                        }
                    }
                
                }
            })
        )
    }

}

struct WithVerticalSwipeGesture: ViewModifier {

    // hof
    var swipeUp  : (CGFloat) -> Void
    var swipeDown: (CGFloat) -> Void
    
    func body(content: Content) -> some View {
        
        VStack {
            content
        }
        .highPriorityGesture(
            DragGesture(minimumDistance: 25, coordinateSpace: .local)
            .onEnded({ value in
                if abs(value.translation.height) > abs(value.translation.width) {
                    if abs(value.translation.height) > 50.0 {
                        if value.translation.height < 0 {
                            self.swipeUp(abs(value.translation.height))
                        } else if value.translation.height > 0 {
                            self.swipeDown(abs(value.translation.height))
                        }
                    }
                }
            })
            
        )
       
    }

}



struct WithSwipeGesture: ViewModifier {

    // hof
    var swipeRightToLeft : (CGFloat) -> Void
    var swipeLeftToRight : (CGFloat) -> Void
    var swipeUp  : (CGFloat) -> Void
    var swipeDown: (CGFloat) -> Void
        
    func body(content: Content) -> some View {
        
        VStack {
            content
        }
        .highPriorityGesture(
            DragGesture(minimumDistance: 25, coordinateSpace: .local)
            .onEnded({ value in
                if abs(value.translation.height) < abs(value.translation.width) {
                    if abs(value.translation.width) > 50.0 {
                        if value.translation.width < 0 {
                            self.swipeRightToLeft(abs(value.translation.width))
                        } else if value.translation.width > 0 {
                            self.swipeLeftToRight(abs(value.translation.width))
                        }
                    }
                
                }
                else if abs(value.translation.height) > abs(value.translation.width) {
                    if abs(value.translation.height) > 50.0 {
                        if value.translation.height < 0 {
                            self.swipeUp(abs(value.translation.height))
                        } else if value.translation.height > 0 {
                            self.swipeDown(abs(value.translation.height))
                        }
                    }
                }
            })
            
        )
       
    }

}
