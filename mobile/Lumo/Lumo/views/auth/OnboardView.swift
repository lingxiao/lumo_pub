//
//  OnboardView.swift
//  Lumo
//
//  Created by lingxiao on 9/18/22.
//


import Foundation
import SwiftUI

struct OnboardView : View {
        
    @State private var goToClaimTab: Bool = false

    func componentDidMount(){
        return;
    }

    var body: some View {
        
        let fr = UIScreen.main.bounds
        let header_pad_top : CGFloat = UIDevice.current.hasNotch ? 25 : 10

        ZStack {
            
                
            Image("MATCHBOX")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width:fr.width*3)
                .position(x:fr.width+20,y:fr.height/2)
            
            ScrollView (.vertical, showsIndicators: false) {
                
                VStack (alignment: .leading){
                    HStack {
                        AppTextH1("** What is a burn event", size: FontSize.h2.sz, isLeading: true)
                            .foregroundColor(Color.surface1)
                            .padding([.bottom],2)
                            Spacer()
                    }
                    HStack {
                        AppTextH1("and what is this tab?", size: FontSize.body.sz, isLeading: true)
                            .foregroundColor(Color.surface2)
                            .padding([.bottom],10)
                        Spacer()
                    }
                }
                .padding([.leading],25)

                AppTextH4(about_burn1, size:FontSize.footer2.sz, isLeading: true)
                    .lineSpacing(5)
                    .padding([.leading, .trailing,.bottom],25)
                    .foregroundColor(.text1)
                
                AppTextH4(about_burn2, size:FontSize.footer2.sz, isLeading: true)
                    .lineSpacing(5)
                    .padding([.leading, .trailing, .bottom],25)
                    .foregroundColor(.text1)

                AppTextH4(about_burn3, size:FontSize.footer2.sz, isLeading: true)
                    .lineSpacing(5)
                    .padding([.leading, .trailing, .bottom],25)
                    .foregroundColor(.text1)
                
                VStack{}.frame(height:50)

            }
            .frame(width:fr.width-80, height:fr.height-HEADER_HEIGHT*2)
            .coordinateSpace(name: "PTR_ManifestosView")
            .position(x:fr.width/2-35,y:fr.height/2+HEADER_HEIGHT/2)
            .modifier(AppPageFade(top: 0.25, bottom: 0.75))
            
            VStack {
                HStack (alignment: .center){
                    Image("flame")
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: fr.width/2-20)
                        .padding([.leading,.top],25)
                    Spacer()
                }
                .frame(width: fr.width, height: HEADER_HEIGHT, alignment: .leading)
                .padding([.top],header_pad_top)

                Spacer()
                
                PillConvex(
                    label: "claim burn tab".uppercased(),
                    color:Color.text1,
                    fontSize: FontSize.footer3.sz,
                    disabled: .constant(false),
                    action: {
                        self.goToClaimTab = true
                })
                .padding([.bottom],35)
            }
            .frame(width: fr.width,height:fr.height)

        }
        .frame(width:fr.width, height:fr.height)
        .modifier(AppBurntPage(src: "lumoRed3"))
        .navigate(
            to: AcceptNominateView(showBack: false, showEnterCode: true),
            when: $goToClaimTab
        )
        .onAppear{
            componentDidMount()
        }
    }
}


let about_burn1 = "A burn event is a communal initiation ritual for change and manifestation, empowering you and your community to will the world towards your collective purpose."

let about_burn2 = "The burn tab is the communal reward for all prosocial actions: attending burn events, signing manifestos, and voting for future burn leaders. It can be shared with other burners and is the social currency for all burn events on Lumo."
let about_burn3 = "You can keep the tab for memory sake, or pass it forward to the next burn leader of your choosing."


//MARK: - preview

#if DEBUG
struct OnboardView_Previewse: PreviewProvider {
    static var previews: some View {
        OnboardView()
            .environmentObject(AppService())
    }
}
#endif

