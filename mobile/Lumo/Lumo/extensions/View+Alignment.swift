//
//  View+Alignment.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//


import Foundation
import SwiftUI


struct FlushLeft: ViewModifier {

    func body(content: Content) -> some View {
        HStack {
            content
            Spacer()
        }
    }
}


struct CenterVertical: ViewModifier {

    func body(content: Content) -> some View {
        VStack {
            Spacer()
            content
            Spacer()
        }
    }
}




struct CenterHorizontal: ViewModifier {

    func body(content: Content) -> some View {
        HStack {
            Spacer()
            content
            Spacer()
        }
    }
}




struct FooterAlign: ViewModifier {

    func body(content: Content) -> some View {
        let fr = UIScreen.main.bounds
        VStack {
            content
                .padding([.bottom],30)
        }
        .frame(width: fr.width, height: fr.height)
    }
}


