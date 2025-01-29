//
//  AppButtons.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//
//
//  Created by lingxiao on 8/14/22.
//  Referece:https://www.appcoda.com/swiftui-buttons/
//

import Foundation
import SwiftUI


//MARK: - basic materialUI button

// @reference: https://sarunw.com/posts/swiftui-animation/
struct MaterialUIButton: View {
    
    var label : String = ""
    var radius: CGFloat = 16
    var hpad  : CGFloat = 20
    var vpad  : CGFloat = 10
    var width : CGFloat = 80
    var height: CGFloat = 50

    var isOn  : Bool = true
    var background: Color = Color.surface1
    var color: Color = Color.red2
    var borderColor: Color = Color.red2
    var fontSize: CGFloat = FontSize.body.sz

    var action : () -> Void

    var body: some View {
        Button(action: {
            if isOn {
                action()
            }
        }) {
            
            HStack {
                AppTextH1(label, size: fontSize)
                    .foregroundColor( isOn ? color : Color.surface3 )
                    .frame(minWidth: 0, maxWidth: width)
            }
            .padding([.vertical],vpad)
            .padding([.horizontal],hpad)
            .background( background )
            .cornerRadius( radius )
            .overlay(
                RoundedRectangle(cornerRadius: radius)
                    .stroke( isOn ? borderColor : Color.surface3, lineWidth: 1)
            )

        }
    }
}



//MARK: - rounded icon button

struct IconButton : View {
        
    var kind : IconButtonKind
    var color: Color
    var bkColor: Color = Color.surface2
    var radius: CGFloat = 50
    var image_name: String? = nil
    var onTap: () -> Void

    var body: some View {
        
        IconButtonView(kind: kind, color: color, image_name: image_name, onTap: onTap )
            .frame(width: radius, height: radius)
            .background(bkColor)
            .cornerRadius(radius/2)
            .shadow(color: Color(UIColor.black).opacity(0.9), radius: 2)
        
    }
}

//MARK: - gradient button

struct GradientButton : View {
    
    var label : String = ""
    var radius: CGFloat = 20
    var hpad  : CGFloat = 20
    var vpad  : CGFloat = 10
    var width : CGFloat = 80
    var isOn  : Bool = true
    var action : () -> Void
    
    private let gradOn  = Gradient(colors: [Color.red1, Color.red2, .red3, .red2, .red1])
    private let gradOff = Gradient(colors: [Color.surface2, Color.surface3])

    var body: some View {
        Button(action: {
            action()
        }) {
            HStack {
                AppTextH4(label.uppercased(), size: FontSize.body.sz)
                    .foregroundColor( .text1 )
                    .frame(minWidth: 0, maxWidth: width)
            }
            .padding([.vertical],vpad)
            .padding([.horizontal],hpad)
            .foregroundColor(.white)
            .background(LinearGradient(gradient: isOn ? gradOn : gradOff, startPoint: .leading, endPoint: .trailing))
            .cornerRadius( radius )
        }
    }
}




//MARK: - preview

#if DEBUG
struct SolidButton_Previews: PreviewProvider {
    static var previews: some View {
        
        let fr = UIScreen.main.bounds

        VStack {

            IconButton(kind: .alert, color: Color.white, onTap: {})
            
            Spacer()
            
            MaterialUIButton(label: "on", radius: 20, hpad:50, isOn: true, action: { return })
            MaterialUIButton(label: "on", radius: 20, hpad:50, isOn: false, action: { return })
            MaterialUIButton(label: "on-wt", radius: 20, hpad:50, isOn: true, color: Color.text1, action: { return })
            
            Spacer()

            GradientButton(label: "on", radius: 20, hpad:50, isOn: true, action: { return })
            GradientButton(label: "off", radius: 20, hpad:50, isOn: false, action: { return })

        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .background(Color.surface1.edgesIgnoringSafeArea(.all))
    }
}
#endif
