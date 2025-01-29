//
//  PreviewFonts.swift
//  parc
//
//  Created by lingxiao on 8/14/22.
//
// @Doc: add Font: https://codewithchris.com/swiftui/swiftui-custom-fonts/
//

import Foundation
import SwiftUI

struct PreviewFonts : View {
    
    // read env. variables
    @EnvironmentObject var appService: AppService;
    @EnvironmentObject var authService: AuthService;
    
    // qr scanner modal
    @State private var isPresentingScanner = false
    @State private var scannedCode: String?

    @State private var str: String = ""
    
    private func componentDidMount(){
        /*
        for family in UIFont.familyNames {
             print(family)
             for names in UIFont.fontNames(forFamilyName: family){
                 print("== \(names)")
             }
        }
        */
    }
        
    var body: some View {
        VStack(spacing: 10) {

            Text("NeueMachina-Black")
                .font(.custom("NeueMachina-Black", size: 20))

            Text("NeueMachina-UltraBold")
                .font(.custom("NeueMachina-UltraBold", size: 20))

            Text("NeueMachina-Bold")
                .font(.custom("NeueMachina-Bold", size: 20))

            Text("NeueMachina-Medium")
                .font(.custom("NeueMachina-Medium", size: 20))

            Text("NeueMachina-Regular")
                .font(.custom("NeueMachina-Regular", size: 20))

            Text("NeueMachina-Light")
                .font(.custom("NeueMachina-Light", size: 20))

            Text("NeueMachina-UltraLight")
                .font(.custom("NeueMachina-UltraLight", size: 20))


        }
        .onAppear{
            self.componentDidMount()
        }
    }
}


struct PreviewFonts_Previews: PreviewProvider {
    static var previews: some View {
        PreviewFonts()
    }
}
