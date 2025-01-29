//
//  NominateStoryView.swift
//  Lumo
//
//  Created by lingxiao on 11/20/22.
//


import Foundation
import SwiftUI

struct NominateStoryView : View {
        
    @Environment(\.presentationMode) var presentationMode
    @EnvironmentObject var appService: AppService
    
    public var code: String
    @State private var name: String = ""
        
    func componentDidMount(){
        let user = appService.get_admin_user();
        name = user?.name ?? ""
    }
        
    //mark:- views

    var body: some View {

        let fr = UIScreen.main.bounds

        ZStack {

            TextBox()
            
            AppHeader(name: "Join \(name) on Lumo".uppercased(), goBack: {
                presentationMode.wrappedValue.dismiss()
            })
            .position(x: fr.width/2, y: HEADER_HEIGHT)

        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .modifier(AppBurntPageAlt())
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
    
    @ViewBuilder private func TextBox() -> some View {

        let fr = UIScreen.main.bounds
        let wd = fr.width-40;

        ScrollView {
                
            InstructionRowTop("Take a screenshot", "Share in stories", wd)
                .padding([.bottom],20);
        
            InstructionRow("1. Get theRedapp on iOS", wd);
            InstructionRow("2. Enter code: \(code)", wd);
            InstructionRow("3. Claim your tab", wd);
            InstructionRow("4. Initiate others with same code", wd);

            Image("acidbag")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: fr.width*1.5)
                .padding([.top,],20)
                .padding([.bottom],-25);
            
            HStack {
                AppTextH2(code, size: FontSize.h2.sz, isLeading: true)
                    .foregroundColor(Color.red2)
            }
            .frame(width: fr.width, height:50)
            .padding([.bottom],20)
            .background(Color.black)

            AuthenticFooter(
                h1: "Certificate of authentic invitation",
                flu: "You will claim one tab",
                fld: "with invite code \(code)",
                fru: "Dealer:",
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
            AppTextH2(xs, size: FontSize.h4.sz*2/3, isLeading: true)
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
struct NominateStoryView_Previews: PreviewProvider {
    static var previews: some View {
        NominateStoryView(code: "hello")
            .environmentObject(AppService())
    }
}
#endif

