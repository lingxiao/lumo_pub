//
//  AuthenticFooter.swift
//  Lumo
//
//  Created by lingxiao on 9/16/22.
//


import Foundation
import SwiftUI

struct AuthenticFooter : View {
    
    var h1: String
    var flu: String
    var fld: String
    var fru: String
    var frd: String
    var width: Double

    var body: some View {
        let sz = FontSize.body.sz*2/3
        VStack {
            HStack {
                AppTextH3(h1.uppercased(), size: sz, isLeading: true)
                    .foregroundColor(Color.surface1)
                    .opacity(0.50)
                Spacer()
                Image("lumoCube4")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: sz*3/2,height:sz*3/2)
                    .padding([.bottom],4)
            }
            .frame(width: width, alignment: .leading)
            .overlay(Line().padding([.top, .leading, .trailing],25))
            HStack {
                VStack {
                    HStack {
                        AppTextH4(flu, size: FontSize.footer2.sz*2/3, isLeading: true)
                            .foregroundColor(Color.surface1)
                            .opacity(0.50)
                        Spacer()
                    }
                    .frame(width:width*2/3)
                    HStack {
                        AppTextH4(fld, size: FontSize.footer2.sz*2/3, isLeading: true)
                            .foregroundColor(Color.surface1)
                            .opacity(0.50)
                        Spacer()
                    }
                    .frame(width:width*2/3)
                }
                Spacer()
                VStack {
                    HStack {
                        Spacer()
                        AppTextH4(fru, size: FontSize.footer2.sz*2/3, isLeading: true)
                            .foregroundColor(Color.surface1)
                            .opacity(0.50)
                    }
                    HStack {
                        Spacer()
                        AppTextH4(frd, size: FontSize.footer2.sz*2/3, isLeading: true)
                            .foregroundColor(Color.surface1)
                            .opacity(0.50)
                    }
                }
            }
            .padding([.top],5)
        }
        .frame(width: width, alignment: .leading)
        .padding([.top, .leading,.trailing],20)
    }
    
    @ViewBuilder private func Line() -> some View {
        let fr = UIScreen.main.bounds
        Divider()
            .frame(width: fr.width-40, height: 1)
            .padding( [.leading, .trailing], 20 )
            .background(Color.surface1)
    }

    
}



