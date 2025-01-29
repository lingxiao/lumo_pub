//
//  AppHeader+Nav.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//

import Foundation
import SwiftUI




struct AppHeader : View {
    
    var name: String
    var color: Color = Color.text1
    var hideButton: Bool = false
    var goBack: () -> Void

    var body: some View {
        
        let fr = UIScreen.main.bounds
        let header_pad : CGFloat = UIDevice.current.hasNotch ? 25 : 10

        VStack {
            HStack (alignment: .firstTextBaseline){
                AppTextH2(name, size: FontSize.body.sz, isLeading: true)
                    .foregroundColor(color)
                    .padding([.leading],15)
                    .padding([.bottom], hideButton ? 0 : 15)
                Spacer()
                if hideButton {
                    Button(action: {
                        goBack()
                    }) {
                        Image(systemName: "face.smiling")
                            .frame(width:10,height:10)
                    }
                    .softButtonStyle(
                        Circle(),
                        mainColor: Color.red2,
                        textColor: Color.text1,
                        darkShadowColor: Color.red2d,
                        lightShadowColor:Color.red3
                    )
                    .padding([.trailing],15)
                    .offset(y:-5)

                } else {
                    IconButton(
                        kind   : .back,
                        color  : .white,
                        bkColor: .surface1.opacity(0.0),
                        radius : FontSize.body.sz,
                        onTap: {
                            goBack()
                        }
                    )
                    .padding([.trailing,.bottom],15)
                    .offset(y:-2)
                }
            }
            .padding([.bottom],5)
        }
        .frame(width: fr.width, height: HEADER_HEIGHT_2, alignment: .bottomLeading)
        .padding([.top], header_pad)

    }
}

//MARK: - preview

#if DEBUG
struct AppHeader_Preview: PreviewProvider {
    static var previews: some View {
        let fr = UIScreen.main.bounds
        VStack {
            Spacer()
            AppHeader(name: "header", hideButton: true, goBack: {})
            Spacer()
            AppHeader(name: "header", hideButton: false, goBack: {})
            Spacer()
        }
        .modifier(AppBurntPage())
        .frame(width: fr.width, height: fr.height, alignment: .center)
    }
}

#endif
