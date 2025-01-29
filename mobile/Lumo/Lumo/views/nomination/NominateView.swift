//
//  NominateView.swift
//  Lumo
//
//  Created by lingxiao on 9/16/22.
//

import Foundation
import SwiftUI

struct NominateView : View {
        
    @Environment(\.presentationMode) var presentationMode
    @EnvironmentObject var appService: AppService
    
    @State private var name: String = ""
    @State private var goToTwitterGraph: Bool = false
        
    func componentDidMount(){
        let user = appService.get_admin_user();
        name = user?.name ?? ""
    }
        
    func onNominate(){
        goToTwitterGraph = true
    }
    
    //mark:- views

    var body: some View {

        let fr = UIScreen.main.bounds

        ZStack {

            ShareViaTwitter()
            
            AppHeader(name: "initiate new burners".uppercased(), goBack: {
                presentationMode.wrappedValue.dismiss()
            })
            .position(x: fr.width/2, y: HEADER_HEIGHT)

        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .modifier(AppBurntPageAlt())
        .navigate(
            to: TwitterGraphView(preview:false),
            when: $goToTwitterGraph
        )
        .modifier(WithHorizontalSwipeGesture(
            swipeRightToLeft: {_ in },
            swipeLeftToRight: {_ in
                presentationMode.wrappedValue.dismiss();
            }
        ))
        .onAppear{
            componentDidMount()
        }
    }
    
    @ViewBuilder private func ShareViaTwitter() -> some View {

        let fr = UIScreen.main.bounds
        let wd = fr.width-40;

        ScrollView {
                
            InstructionRowTop("Share a tab", "Grow the movement", wd)
                .padding([.bottom],20);
        
            InstructionRow("Initiate new".uppercased(), wd);
            InstructionRow("burner by sharing".uppercased(), wd);
            InstructionRow("one tab".uppercased(), wd);
            InstructionRow("".uppercased(), wd);

            Image("acidbag")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: fr.width*1.5)
                .padding([.top,],20)
                .padding([.bottom],-25);
                
            HStack {
                MaterialUIButton(
                    label : "Initiate with 1 tab".uppercased(),
                    width : fr.width-80,
                    isOn  : true,
                    background: Color.white.opacity(0.0),
                    color : Color.red3,
                    borderColor: Color.red3,
                    fontSize   : FontSize.body.sz,
                    action: {
                        onNominate()
                    })
            }
            .frame(width: fr.width, height:50)
            .padding([.bottom],20)
            .background(Color.black)
            
            AuthenticFooter(
                h1: "Certificate of authentic initiation",
                flu: "You will be sharing the tab",
                fld: "via twitter DM",
                fru: "Issuer:",
                frd: "\(name)",
                width: wd
            )
                .padding([.bottom, .top],20)
            
            Spacer()

        }
        .frame(width: fr.width, height: fr.height-HEADER_HEIGHT)
        .padding([.top],HEADER_HEIGHT)
    }

    
    @ViewBuilder private func InstructionRowTop(_ xs : String, _ ys: String, _ wd: CGFloat ) -> some View {
        HStack {
            AppTextBody(xs, size: FontSize.footer2.sz*2/3, isLeading: true)
                .foregroundColor(Color.text2)
            Spacer()
            AppTextBody(ys, size: FontSize.footer2.sz*2/3, isLeading: true)
                .foregroundColor(Color.text2)
        }
        .overlay(
            Line()
                .padding([.top],25)
        )
        .frame(width: wd, alignment: .leading)
        .padding([.top, .leading,.trailing],20)
    }

    @ViewBuilder private func InstructionRow(_ xs : String, _ wd: CGFloat ) -> some View {
        HStack {
            AppTextH2(xs, size: FontSize.h4.sz, isLeading: true)
                .foregroundColor(Color.surface1)
        }
        .frame(width: wd, alignment: .leading)
        .overlay(Line().padding([.top, .leading, .trailing],25))
        .padding([.top],5)
    }
    
    @ViewBuilder private func Line() -> some View {
        let fr = UIScreen.main.bounds
        Divider()
            .frame(width: fr.width-40, height: 1)
            .padding( [.leading, .trailing], 20 )
            .background(Color.surface1)
    }

    
}




//MARK: - preview

#if DEBUG
struct NominateView_Previewse: PreviewProvider {
    static var previews: some View {
        NominateView()
            .environmentObject(AppService())
    }
}
#endif

