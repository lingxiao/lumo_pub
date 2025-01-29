//
//  TinderCardView.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//
// @Doc: https://github.com/Volorf/swipeable-cards
// @Doc: https://github.com/Volorf/swipeable-cards/blob/main/Swipeable%20Cards/Swipeable%20Cards/CardView.swift
//

import Foundation
import SwiftUI



//MARK: - view

struct TinderCardView : View {
        
    var data: ItemModel?
    @Binding var burn: BurnModel?
    @EnvironmentObject var appService : AppService;

    var padh : CGFloat
    var padv : CGFloat

    // responders
    var onGoToInitiationPacket: (_ data: ItemModel?) -> Void
        
    // datasource
    @State private var nomination: NominationModel? = nil
    @State private var image_url: URL? = nil
        
    // card gross states
    @State private var goToPacket: Bool = false
    @State private var is_signed: Bool = false;
    @State private var is_host_title: Bool = false;
    
    //MARK: - mount + responders

    func componentDidMount(){
        // check if is signed card
        if let data = data {
            self.is_signed = data.permission == .t3
        }
        self.is_host_title = (burn?.is_author_card(data)) ?? false

        // load nominee profile
        appService.get_user(at: data?.userID){muser in
            if let _url = muser?.profile_url() {
                self.image_url = _url;
            } else {
                // self.image_url = muser?.profile_url();
                self.appService.get_twitter_user(for: muser){ tuser in
                    if let turl = tuser?.profile_url() {
                        self.image_url = turl;
                    } else {
                        self.image_url = URL(string:data?.image_url ?? "")
                    }
                }
            }
        }
        /*/ load initiation packet
        appService.fetch_all_gifts(for: data){ gifts in
            let total = gifts.map{ $0.amt_in_lumo }.reduce(0,+)
            self.gift_datasource = gifts;
            let users = gift_datasource
                .map{ $0.srcUser }
                .filter{ $0 != nil }
                .map{ $0! }
            let unique_users = Array(Set(users));
            self.user_datasource = Array(unique_users.prefix(4));
        }*/
        // load original invite
        appService.fetch_nomination(for: data){nom in
            self.nomination = nom;
        }
    }
        
    /// @use:  navigate to packet
    func onGoToPacket(){
        appService.setTopTinderCard(to: data)
        onGoToInitiationPacket(data)
    }
        
    /// @use; go tonominee twitter profile
    func onGoToNominee(){
        appService.get_twitter_user(with: data?.userID){tuser,user in
            if let tuser = tuser {
                tuser.nav_to_profile()
            } else if let user = user {
                user.nav_to_twitter_profile()
            } else {
                return vibrateError()
            }
        }
    }
        
    /// @Use: go to nominated by twitter profile
    func onGoToNominatedBy(){
        appService.get_twitter_user(with: self.nomination?.userID){tuser,user in
            if let tuser = tuser {
                tuser.nav_to_profile()
            } else if let user = user {
                user.nav_to_twitter_profile()
            } else {
                return vibrateError()
            }
        }
    }
    
    //MARK: - view data
    
    func isTrivial() -> Bool {
        if let m = data {
            return m.isTrivial
        } else {
            return false
        }
    }
    
    func para_1() -> String {
        let para = "The next cohort of burners have been nominated. Their burn buddies have stuffed their initiation packet with one burn tab."
        return para;
    }
    
    func para_2() -> String {
        let para = "Show the baby burners the generosity of this community by putting more tabs into their initiation package. Swipe right to place 1/10th of a tab into their package, swipe left to see the next burner."
        return para;
    }
    
    //MARK: - view

    var body: some View {

        let fr = UIScreen.main.bounds
        let w  = fr.width  - 2*padh
        let h  = fr.height - 2*padv

        ZStack {
            
            if isTrivial() {
                
                InfoCardView(w,h)
                
            } else {
                
                TinderCardFull(
                    padh: 20,
                    padv: 120,
                    disable_swipe: false,
                    image_url: self.image_url,
                    name_header: "Burner",
                    name: data?.name ?? "",
                    row_2a: is_host_title ? "Manifesto Author" : is_signed ? "Signed" : "Nominated by",
                    row_2b: self.nomination?.hostName ?? "",
                    hero_header: "Initiation Packet:",
                    hero_stat: roundToTwo(data?.num_tabs_gifted ?? 0.0),
                    table_header: "Initiation crew",
                    table_datasource: .constant(data?.initiation_names ?? []),
                    onTapName: onGoToNominee,
                    onTapRow2: onGoToNominatedBy,
                    onTapHeroStat: onGoToPacket,
                    onTapTable:onGoToPacket
                )
                
            }
        }
        .frame(width: w, height: h, alignment: .center)
        .background(Color.black)
        .onAppear{
            componentDidMount()
        }
        .modifier(AppCardCorners())
    }
    
    //MARK: - accessory views
    
    @ViewBuilder func InfoCardView(_ w: CGFloat, _ h: CGFloat) -> some View {
        ZStack {
            
            Image("acidbag")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: w*2)
                .position(x:w,y:h+45)
            

            VStack {
                AppTextH2(
                    "** How to initiate burners".uppercased(),
                    size:FontSize.footer1.sz,
                    isUnderlined: true
                )
                    .foregroundColor(Color.text3)
                    .padding([.leading],25)
                    .padding([.bottom],15)
                    .padding([.top],45)
                    .modifier(FlushLeft())
                ParagraphView(para_1())
                    .padding([.bottom],15)
                ParagraphView(para_2())
                    .padding([.bottom],15)
                AppTextH3(
                    "Share while your supply last. Swipe in any direction to start sharing.",
                    size:FontSize.footer2.sz
                )
                    .foregroundColor(Color.text3)
                    .lineSpacing(5)
                    .padding([.horizontal],25)
                    .padding([.bottom],15)
                    .modifier(FlushLeft())

                Spacer()
            }
        }
        .frame(width: w, height:h)
        .background(Color.black)
        
    }
    
    @ViewBuilder private func ParagraphView(_ str: String) -> some View {
        AppTextH3(str, size:FontSize.body.sz)
            .foregroundColor(Color.text1.opacity(0.90))
            .padding([.horizontal],25)
            .modifier(FlushLeft())
            .lineSpacing(5)
    }
    
    
}

//MARK: - preview

#if DEBUG
struct TinderCardView_Previewse: PreviewProvider {
    static var previews: some View {
        let fr = UIScreen.main.bounds
        VStack {
            HStack {
                Spacer()
                TinderCardView(
                    data: ItemModel.mempty(),
                    burn: .constant(nil),
                    padh: 20,
                    padv: 120,
                    onGoToInitiationPacket: {_ in }
                )
                Spacer()
            }
        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .edgesIgnoringSafeArea(.all)
        .modifier(AppBurntPage())
        .environmentObject(AppService())
    }
}

#endif

