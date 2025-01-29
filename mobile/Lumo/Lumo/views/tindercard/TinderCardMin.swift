//
//  TinderCardMin.swift
//  Lumo
//
//  Created by lingxiao on 9/27/22.
//

import Foundation
import SwiftUI



//MARK: - view

struct TinderCardMin : View {
    
    public var padh : CGFloat
    public var padv : CGFloat
    public var isEmpty: Bool = false
    
    // responders
    var onMaximize: () -> Void
        

    var body: some View {

        let fr = UIScreen.main.bounds
        let w  = fr.width  - 2*padh
        let h  = fr.height - 2*padv
        
        let ws = w*0.8
        let hs = h*0.95

        ZStack {
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.red2)
                .softInnerShadow(
                    RoundedRectangle(cornerRadius: 20),
                    darkShadow: Color.red2d,
                    lightShadow: Color.red3
                )
            ZStack {
                Image("fire1")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: ws, height: hs)
                    .padding([.leading],-20)
            }
            .frame(width: ws/4, height: hs, alignment: .center)
            .modifier(AppCardCorners())
            .shadow(
                color: Color.red2d.opacity( 0.8),
                radius: 5,
                x: 10,
                y: 10
            )
        }
        .frame(width: w/4, height: h, alignment: .center)
        .modifier(AppCardCorners())
        .onTapGesture {
            self.onMaximize()
        }
        .modifier(WithHorizontalSwipeGesture(swipeRightToLeft: {_ in}, swipeLeftToRight: {_ in
            self.onMaximize()
        }))
    }
    

    
    
}

//MARK: - preview

#if DEBUG
struct TinderCardMin_Previews: PreviewProvider {
    static var previews: some View {
        let fr = UIScreen.main.bounds
        VStack {
            HStack {
                Spacer()
                TinderCardMin(
                    padh: 20,
                    padv: 120,
                    isEmpty: false,
                    onMaximize: {}
                )
                Spacer()
                TinderCardMin(
                    padh: 20,
                    padv: 120,
                    isEmpty: true,
                    onMaximize: {}
                )
                Spacer()
            }
        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .edgesIgnoringSafeArea(.all)
        .modifier(AppBurntPage())
        .environmentObject(AppService())
    }
}

#endif




