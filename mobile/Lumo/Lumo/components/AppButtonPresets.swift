//
//  AppButtonPresets.swift
//  Lumo
//
//  Created by lingxiao on 9/15/22.
//

import Foundation
import SwiftUI
import Neumorphic


//MARK: - navigation

struct PillConvex: View {
    
    var label : String
    var color = Color.text1
    var fontSize: CGFloat = FontSize.body.sz
    var isLight: Bool = false
    @Binding public var disabled: Bool
    var doNotShowProgress: Bool = false
    
    var action  : () -> Void

    var body: some View {
        Button(action: {
            action()
        }) {
            HStack {
                if disabled && !doNotShowProgress {
                    ProgressView()
                        .padding([.trailing],5)
                }
                AppTextH2(label, size: fontSize)
                    .foregroundColor( color )
            }
        }
        .softButtonStyle(
            Capsule(),
            mainColor: isLight ? Color.red3 : Color.red2,
            textColor: Color.text1,
            darkShadowColor: isLight ? Color.red2 : Color.red2d,
            lightShadowColor:Color.red3
        )
        .disabled(disabled)
    }
}

struct PillConcave: View {

    var label : String
    var color = Color.text1
    var fontSize: CGFloat = FontSize.body.sz
    var action: () -> Void
    
    var body: some View {
        Toggle(isOn: .constant(true), label: {
            AppTextH2(label, size: fontSize)
                .foregroundColor( color )
        })
        .softToggleStyle(
            Capsule(),
            mainColor: Color.red2,
            textColor: Color.text1,
            darkShadowColor: Color.red2d,
            lightShadowColor:Color.red3
        )
        .onTapGesture {
            action()
        }
    }
}


//MARK: - round buttons


//MARK: - preview

#if DEBUG
struct AppButtonPresets_Previews: PreviewProvider {
    static var previews: some View {
        
        let fr = UIScreen.main.bounds

        VStack {

            Spacer()
            PillConvex(label: "pill", disabled: .constant(false), action: {
                print("OK!!!")
            })
            Spacer()
            PillConvex(label: "pill", disabled: .constant(true), action: {
                print("OK!!!")
            })
            Spacer()
            PillConcave(label: "concave", action: {
                print("WORLD")
            })
            Spacer()

        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .background(Color.red2.edgesIgnoringSafeArea(.all))
        .modifier(AppBurntPage())
    }
}
#endif
