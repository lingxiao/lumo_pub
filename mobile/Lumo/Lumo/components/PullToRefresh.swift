//
//  PullToRefresh.swift
//  Lumo
//
//  Created by lingxiao on 9/27/22.
//
// @Doc: https://stackoverflow.com/questions/56493660/pull-down-to-refresh-data-in-swiftui/65100922#65100922
//

import Foundation
import SwiftUI


struct PullToRefresh: View {
    
    var coordinateSpaceName: String
    var onRefresh: ()->Void
    
    @State var needRefresh: Bool = false
    
    var body: some View {
        GeometryReader { geo in
            if (geo.frame(in: .named(coordinateSpaceName)).midY > 50) {
                Spacer()
                    .onAppear {
                        needRefresh = true
                    }
            } else if (geo.frame(in: .named(coordinateSpaceName)).maxY < 10) {
                Spacer()
                    .onAppear {
                        if needRefresh {
                            needRefresh = false
                            onRefresh()
                        }
                    }
            }
            HStack {
                Spacer()
                if needRefresh {
                    ProgressView()
                } else {
                    AppTextFooter2("pull to refresh".uppercased(), size: FontSize.footer3.sz)
                        .foregroundColor(Color.text1.opacity(0.50))
                }
                Spacer()
            }
        }.padding(.top, -50)
    }
}
