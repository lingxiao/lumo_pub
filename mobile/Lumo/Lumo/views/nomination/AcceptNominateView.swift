//
//  AcceptNominateView.swift
//  Lumo
//
//  Created by lingxiao on 9/16/22.
//

import Foundation
import SwiftUI

struct AcceptNominateView : View {

    @EnvironmentObject var viewModel  : AlertViewModel
    @EnvironmentObject var appService: AppService
    @Environment(\.presentationMode) var presentationMode

    public var showBack: Bool
    @State public var showEnterCode: Bool = false
        
    @State private var name: String = ""
    @State private var inviteCode: String = "";
    @FocusState private var focusedField: FocusField?

    @State private var recentNominaton: NominationModel? = nil
    @State private var recentReward: RewardModel? = nil
    @State private var burn: BurnModel? = nil;

    @State private var btn_str = "confirm invite code"
    @State private var rwd_btn_str = "Claim reward"
    @State private var btnison = true
        
    // upload image
    @State var profile_url: URL? = nil
    @State var picked_image: Image? = nil
    @State var showImagePicker : Bool = false
    @State private var showProfileImage: Bool = false

    // navigation
    @State private var goToApp: Bool = false

    enum FocusField: Hashable {
      case field
    }
    
    func componentDidMount(){
        let user = appService.get_admin_user();
        self.name = user?.name ?? ""
        self.profile_url = user?.profile_url()
        let noms = Array(appService.nominations.values);
        if noms.count > 0 {
            let nom = noms[0]
            recentNominaton = nom;
            inviteCode = nom.inviteCode;
        } else {
            let rewards = self.appService.recentRewards
                .filter{ $0.event == "sign_manifesto" || $0.event == "write_manifesto" }
                .sorted{$0.timeStampLatest > $1.timeStampLatest};
            if rewards.count > 0 {
                self.recentReward = rewards[0];
                self.appService.fetch_burn(at: self.recentReward?.chain_id ?? ""){burn in
                    self.burn = burn;
                }
            }
        }
    }
    
    func has_nom() -> Bool {
        return recentNominaton != nil;
    }
    
    func has_reward() -> Bool {
        return recentReward != nil;
    }
    
    func onClaimReward(){
        appService.claim_reward(with: recentReward){_ in
            self.goToApp = true;
        }
    }
    
    func onConfirmCode(){
        if showEnterCode {
            btn_str = "confirming code...";
            btnison = false;
            appService.accept_nomination(with: inviteCode){(res,chain_id) in
                if (res.success){
                    self.focusedField = nil;
                    ///self.showProfileImage = true;
                    self.goToApp = true;
                } else {
                    self.btnison = true
                    self.btn_str = "try again"
                    viewModel.showFail( h1:"Failed!", h2: res.message)
                }
            }
        }
    }
    
    func onUseThisPicture(){
        if let img = picked_image {
            let uiimage = img.asUIImage()
            appService.updateAuthedUserPofileImage(to: uiimage)
            viewModel.showSuccess(
                h1: "Confirmed!",
                h2: "Click on the smiley face on the top right to see the new burn tab you earned!"
            )
            self.goToApp = true;
        } else {
            self.goToApp = true
        }
    }
    
    //MARK: - view

    var body: some View {

        let fr = UIScreen.main.bounds

        ZStack {

            ShareViaTwitter()
            
            if showBack {
                AppHeader(name: "Become a burn leader".uppercased(), goBack: {
                    presentationMode.wrappedValue.dismiss()
                })
                .position(x: fr.width/2, y: HEADER_HEIGHT)
            }

        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .modifier(AppBurntPage())
        .modifier( WithSwipeToGoBack( disabled: !showBack ) )
        .onTapGesture {
            hideKeyboard()
        }
        .navigate(
            to: ContentView( didAuth: true ),///AppView(isHome:true),
            when: $goToApp
        )
        .onAppear{
            componentDidMount()
        }
    }
    
    @ViewBuilder private func ShareViaTwitter() -> some View {

        let fr = UIScreen.main.bounds
        let wd = fr.width-40;

        ScrollView {

            VStack {
                InstructionRowTop(
                    has_nom() ? "Accept the tab" : "Claim the tab",
                    "Join the movement",
                    wd)
                    .padding([.bottom],20);
                InstructionRow(
                    "\( has_reward() ? "accept your tab" : "claim your tab")".uppercased(),
                    wd
                );
                if let nom = recentNominaton {
                    InstructionRow("from \(nom.hostName)".uppercased(), wd);
                    InstructionRow("with this code:".uppercased(), wd);
                } else if has_reward() {
                    InstructionRow("from your recent".uppercased(), wd);
                    InstructionRow("signature for".uppercased(), wd);
                } else {
                    InstructionRow("by entering the".uppercased(), wd);
                    InstructionRow("invite code below:".uppercased(), wd);
                }
                if has_reward() && !has_nom() {
                    InstructionRow("\(burn?.name ?? "")".uppercased(), wd);
                } else {
                    VStack {
                        TextField("", text: $inviteCode)
                            .focused($focusedField, equals: .field)
                            .foregroundColor(Color.text1)
                            .font(.custom("NeueMachina-Bold", size: FontSize.h1.sz*2/3))
                            .frame(width:wd,alignment: .leading)
                            .onAppear {
                                DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                                    guard let _ = self.recentNominaton else {
                                        self.focusedField = .field
                                        return
                                    }
                                }
                            }
                            .overlay(
                                Line().padding([.top],35)
                            )
                    }
                    .frame(width: fr.width*2/3, height: FontSize.body.sz*3)
                }
            }


            
            if showProfileImage {
                
                VStack {
                    
                    VStack {
                        AppTextH3("This is the picture other buners", size: FontSize.footer3.sz)
                            .foregroundColor(Color.text3)
                            .padding([.bottom],1)
                        AppTextH3("see when they contribute to your", size: FontSize.footer3.sz)
                            .foregroundColor(Color.text3)
                            .padding([.bottom],1)
                        AppTextH3("initiation packet", size: FontSize.footer3.sz)
                            .foregroundColor(Color.text3)
                            .padding([.bottom],1)
                    }
                    .padding([.top],25)
                    
                    if let img = picked_image {
                        img
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: fr.height*0.3, height:fr.height*0.3)
                            .padding([.top,],15)
                    } else if let url = profile_url {
                        AsyncAppImage(url: url, width: fr.height*0.3, height: fr.height*0.3)
                            .padding([.top,],15)
                    } else {
                        HStack{}
                            .frame(width: fr.height*0.3, height: fr.height*0.3)
                            .padding([.top,],15)
                    }
                    
                    MaterialUIButton(
                        label : "Upload new picture",
                        width : fr.width*2/3,
                        isOn  : true,
                        background: Color.white.opacity(0.0),
                        color : Color.red2,
                        borderColor: Color.red2,
                        fontSize: FontSize.body.sz,
                        action: {
                            self.showImagePicker = true;
                        })
                        .padding([.top],10)

                    AppTextFooter1(
                        "Use this picture",
                        size: FontSize.footer2.sz
                    )
                        .foregroundColor( picked_image == nil ? Color.text3 : Color.text1 )
                        .padding([.top],10)
                        .padding([.bottom],25)
                        .onTapGesture{
                            onUseThisPicture()
                        }
                    
                }
                .frame(width: fr.width, height:fr.height*0.5)
                .background(.black)
                
            } else {
                
                Image("acidbag")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: fr.width*1.5)
                    .padding([.top,],20)
                    .padding([.bottom],-25);
                    
                    
                VStack {
                    
                    if has_reward() && !has_nom() {
                        
                        MaterialUIButton(
                            label : rwd_btn_str.uppercased(),
                            width : fr.width-80,
                            isOn  : btnison,
                            background: Color.white.opacity(0.0),
                            color : Color.red2,
                            borderColor: Color.red2,
                            fontSize: FontSize.body.sz,
                            action: {
                                onClaimReward()
                            });
                    } else {
                        
                        MaterialUIButton(
                            label : btn_str.uppercased(),
                            width : fr.width-80,
                            isOn  : btnison,
                            background: Color.white.opacity(0.0),
                            color : Color.red2,
                            borderColor: Color.red2,
                            fontSize: FontSize.body.sz,
                            action: {
                                onConfirmCode()
                            });
                        
                        if showEnterCode {
                            AppTextH3("Click here if you do not have a code".uppercased(), size: FontSize.footer2.sz*2/3)
                                .foregroundColor( Color.text1 )
                                .padding([.top],10)
                                .onTapGesture{
                                    self.goToApp = true
                                }
                        }
                    }
                    
                }
                .frame(width: fr.width)
                .padding([.bottom],20)
                .padding([.top],10)
                .background(Color.black)
            }
            
            AuthenticFooter(
                h1: "digital certificate of an authentic invite",
                flu: "You will receive one tab",
                fld: has_nom() ? "once the code has been confirmed" : "upon verification",
                fru: "Issued to:",
                frd: "\(name)",
                width: wd
            )
            .padding([.bottom, .top],30)
            
            Spacer()
        }
        // image picker
        .sheet(isPresented: $showImagePicker) {
            AppImagePicker(sourceType: .photoLibrary) { image in
                self.showImagePicker = false
                self.picked_image = Image(uiImage: image)
            }
        }
        .frame(width: fr.width, height: showBack ? fr.height-HEADER_HEIGHT : fr.height)
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
struct AcceptNominateView_Previews: PreviewProvider {
    static var previews: some View {
        AcceptNominateView(showBack : false, showEnterCode: true)
            .environmentObject(AppService())
    }
}
#endif

