//
//  NotificationListView.swift
//  parc
//
//  Created by lingxiao on 9/9/22.
//


import Foundation
import SwiftUI
import CardStack


fileprivate enum NotificationItemType {//}<T:Identifiable,Comparable> {
    case tab
    case gifts
    case Nomination(NominationModel)
}


struct NotificationListView : View {
    
    @EnvironmentObject var appService : AppService;
    @Environment(\.presentationMode) var presentationMode

    // states
    public var isPreview: Bool = false
    @State var recentRewards: Double = 0
    @State var recentSends: Double = 0
    @State var datasource: [(NominationModel,Bool)] = []
    @State var inboundSends: [SendModel] = [];

    // navigation
    @State private var goToBurn: Bool = false
    @State private var selectedBurn: BurnModel? = nil

    func componentDidMount(){
        self.onReload(false);
    }
    
    func onReload(_ hard: Bool){
        let ( rwards, sends ) = appService.get_user_rewards_summary();
        self.recentRewards = roundToTwo(rwards);
        self.recentSends   = roundToTwo(sends);
        self.datasource = appService.nominations.values.map{ ($0, $0.claimed ) }
        self.inboundSends = appService.recentSends
            .filter{ $0.srcUserID != appService.authed_uid };
    }
        
    
    /// @use: itereate over all nomations, and accept each nomation
    func acceptAll() {
        for idx in datasource.indices {
            let (nom,_) = datasource[idx];
            appService.accept_nomination(with: nom.inviteCode){res,_ in
                if res.success {
                    nom.setClaimed()
                    datasource[idx] = (nom,true)
                }
            }
        }
    }
    
    
    // MARK: - view

    var body: some View {
        
        let fr = UIScreen.main.bounds
        let gridItemLayout : [GridItem] = [GridItem](repeating: GridItem(.flexible()), count: 1)

        ZStack {
                
            VStack {
                Image("acidbagsmall")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(height:fr.height*2)
                    .rotationEffect(Angle(degrees: -90))
                    .position(x:fr.width+140,y:fr.height/3-25)
                Image("acidbagsmall")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(height:fr.height*2)
                    .rotationEffect(Angle(degrees: 90))
                    .position(x:fr.width+140,y:fr.height/4-25)
            }
            
            ScrollView (.vertical, showsIndicators: false) {
                PullToRefresh(coordinateSpaceName: "PTR_alertfeed") {
                    self.onReload(true)
                }
                VStack{}.frame(height:15)
                VStack {
                    AppTextH4(
                        "You have received \(recentRewards) tabs from invites, and \(recentSends) tabs from community gifting.",
                        size: FontSize.footer2.sz
                    )
                    .foregroundColor(Color.text1)
                    .lineSpacing(5)
                    .padding([.trailing, .vertical], 25)
                    .padding([.leading],15)
                }
                .modifier(FlushLeft())
                .padding([.horizontal],15)
                
                LazyVGrid(columns: gridItemLayout, spacing:1){
                    ForEach((datasource), id: \.0.rand_id){(nom,claimed) in
                        NotificationViewItem(
                            nomination: nom,
                            claimed: claimed,
                            onTapBurn: {burn in
                                if let burn = burn {
                                    self.goToBurn = true
                                    self.selectedBurn = burn
                                }
                        })
                    }
                    ForEach(appService.recentRewards, id: \.rand_id){reward in
                        RewardTabView( reward: reward )
                            .padding([.bottom],20)
                    }
                    ForEach(self.inboundSends, id: \.rand_id){send in
                        SendTabView( send: send )
                            .padding([.bottom],20)
                    }
                }
                VStack{}.frame(height:50)
            }
            .frame(width:fr.width-80, height:fr.height-HEADER_HEIGHT)
            .position(x:fr.width/2-35,y:fr.height/2+HEADER_HEIGHT/2)
            .modifier(AppPageFade(top: 0.25, bottom: 0.65))
            .coordinateSpace(name: "PTR_alertfeed")
            
            AppHeader(name: "What's burning".uppercased(), goBack: {
                presentationMode.wrappedValue.dismiss()
            })
            .position(x: fr.width/2, y: HEADER_HEIGHT)
            
            VStack {
                Spacer()
                if datasource.count > 0 {
                    BlockNavFooter()
                        .padding([.bottom],45)
                }
            }

        }
        .frame(width:fr.width, height:fr.height, alignment: .leading)
        .background(.black)
        .modifier(WithSwipeToGoBack())
        .navigate(
            to: BurnView(isHome:false, burn: .constant(selectedBurn)),
            when: $goToBurn
        )
        .onAppear{
            componentDidMount()
        }
    }
    
    @ViewBuilder private func BlockNavFooter() -> some View {
        let fr = UIScreen.main.bounds
        HStack {
            Spacer()
            MaterialUIButton(
                label : "Accept All Invitations",
                width : fr.width/2,
                isOn  : true,
                background: Color.black,
                color : Color.red2,
                borderColor: Color.red2,
                fontSize: FontSize.footer2.sz,
                action: {
                    acceptAll()
                })
            Spacer()
        }
    }
}

//MARK: - one reward

fileprivate struct RewardTabView : View {
    
    @EnvironmentObject var appService : AppService;
    
    var reward: RewardModel?
        
    func componentDidMount(){
        return;
    }

    var body: some View {

        let fr = UIScreen.main.bounds;
        let w = fr.width;
        let num = roundToTwo(reward?.amt_in_lumo ?? 0)
        let num_str = num == 0.1 ? "1/10th of a tab" : "\(num) tabs"
        let about = "You earned \(num_str) for \(reward?.event ?? "")";
        
        VStack {
            HStack {
                AppTextH3(
                    ("You earned \(num == 0.1 ? "1/10" : "\(num)")").uppercased(),
                    size: FontSize.footer2.sz
                )
                .foregroundColor( Color.text1 )
                Image("acid1b")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 25, height: 25)
                    .padding([.bottom],5)
                Spacer()
            }
            .modifier(FlushLeft())
            AppTextH3(
                about,
                size: FontSize.footer3.sz
            )
            .lineSpacing(4)
            .modifier(FlushLeft())
            .foregroundColor( Color.text2 )
            .padding([.top],3)
        }
        .frame(width:w*2/3)
        .onAppear{
            componentDidMount()
        }
    }
    
}

//MARK: - one send

fileprivate struct SendTabView : View {
    
    @EnvironmentObject var appService : AppService;
    
    var send: SendModel?
    @State private var name: String = ""
    @State private var img: URL? = nil
    @State private var user: UserModel? = nil
    @State private var tuser: TwitterModel? = nil;
        
    func componentDidMount(){
        // load user who sent tab
        appService.get_user(at: send?.srcUserID ){muser in
            DispatchQueue.main.async {
                self.user = muser
                self.name = muser?.name ?? ""
                self.img  = muser?.profile_url()
            }
            self.appService.get_twitter_user(for: muser){tuser in
                DispatchQueue.main.async {
                    self.tuser = tuser
                    if ( self.name == "" ){
                        self.name = tuser?.pp_name() ?? ""
                    }
                    if ( self.img == nil ) {
                        self.img = tuser?.profile_url();
                    }
                }
            }
        }
    }
    
    func onTapSend(){
        if let tuser = tuser {
            tuser.nav_to_profile()
        } else if let user = user {
            user.nav_to_twitter_profile()
        } else {
            return vibrateError()
        }
    }

    var body: some View {

        let fr = UIScreen.main.bounds;
        let w = fr.width;
        let num = roundToTwo(send?.amt_in_lumo ?? 0)
        let num_str = num == 0.1 ? "1/10th of a tab" : "\(num) tab"
        let about = "\(self.name) shared \(num_str) with you";
        
        VStack {
            HStack {
                if let url = self.img {
                    AsyncAppImage(
                        url: url,
                        width: FontSize.footer2.sz,
                        height: FontSize.footer2.sz
                    )
                    .modifier(AppPageFade(top: 0.05, bottom: 0.5))
                    .clipShape(Circle())
                }
                AppTextH3(
                    ("Shared \(num == 0.1 ? "1/10" : "\(num)")").uppercased(),
                    size: FontSize.footer2.sz
                )
                .foregroundColor( Color.text1 )
                Image("acid1b")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 25, height: 25)
                    .padding([.bottom],5)
                Spacer()
            }
            .modifier(FlushLeft())
            AppTextH4(self.user?.about ?? "", size:FontSize.footer3.sz, isLeading: true)
                .lineSpacing(5)
                .foregroundColor(Color.text1.opacity(0.7))
                .modifier(FlushLeft())
            AppTextH3(
                about,
                size: FontSize.footer3.sz
            )
            .lineSpacing(4)
            .modifier(FlushLeft())
            .foregroundColor( Color.text2 )
            .padding([.top],3)
        }
        .frame(width:w*2/3)//,height:h)
        .onTapGesture {
            onTapSend()
        }
        .onAppear{
            componentDidMount()
        }
    }
    
}



//MARK: - one notification


fileprivate struct NotificationViewItem : View {
    
    @EnvironmentObject var appService : AppService;
        
    var nomination: NominationModel?
    var claimed: Bool
    var onTapBurn: (BurnModel?) -> Void

    @State private var burn: BurnModel? = nil
    @State private var name: String = ""
    @State private var img : URL? = nil
    @State private var about: String = ""
    @State private var user: UserModel? = nil
    @State private var tuser: TwitterModel? = nil
    @State private var inviter: UserModel? = nil
    
    // fetch burn model from nomation
    func componentDidMount(){
        
        appService.fetch_burn(at: nomination?.chain_id ?? ""){ burn in
            DispatchQueue.main.async {
                self.burn = burn;
            }
            
            // parse about
            let max_len = 25;
            let wss  = (burn?.about ?? "").components(separatedBy: " ");
            let wsp  = wss.count < max_len ? wss : Array(wss[0...max_len])
            let wss1 = wsp.joined(separator: " ")
            self.about = wsp.count < wss.count ? "\(wss1)..." : wss1;
            
            // load user who invited me to burn
            appService.get_user(at: nomination?.userID ){muser in
                DispatchQueue.main.async {
                    self.inviter = muser
                }
            }
            
            // load user who created burn
            appService.get_user(at: burn?.userID){muser in
                DispatchQueue.main.async {
                    self.user = muser
                    self.name = muser?.name ?? ""
                    self.img  = muser?.profile_url()
                }
                self.appService.get_twitter_user(for: muser){tuser in
                    DispatchQueue.main.async {
                        self.tuser = tuser
                        if ( self.name == "" ){
                            self.name = tuser?.pp_name() ?? ""
                        }
                        if ( self.img == nil ) {
                            self.img = tuser?.profile_url();
                        }
                    }
                }
            }
        }
    }
    
    func onNavToHost(){
        appService.get_user(at: burn?.userID){muser in
            if let user = muser {
                user.nav_to_twitter_profile()
            } else {
                vibrateError()
            }
        }
    }
    
    func onNavToInvitee(){
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

    var body: some View {
        
        let fr = UIScreen.main.bounds

        VStack {
            
            if claimed {
                
                Image("acidbagsmall")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width:fr.width*0.4)
                    .modifier(FlushLeft())
                    .padding([.leading],15)

            } else {
                
                HStack {
                    if let url = self.img {
                        AsyncAppImage(
                            url: url,
                            width: FontSize.footer2.sz,
                            height: FontSize.footer2.sz
                        )
                        .modifier(AppPageFade(top: 0.05, bottom: 0.5))
                        .clipShape(Circle())
                    }
                    AppTextH2(
                        self.name,
                        size: FontSize.footer1.sz,
                        isLeading: true
                    )
                    .foregroundColor(Color.text1)
                }
                .modifier(FlushLeft())
                .padding([.leading],25)
                .padding([.bottom], self.img == nil ? 5 : 0)
                .onTapGesture {
                    onNavToHost()
                }
                
                AppTextH4(self.about, size:FontSize.footer2.sz, isLeading: true)
                    .lineSpacing(5)
                    .padding([.leading, .trailing],25)
                    .foregroundColor(.text1)
                    .modifier(FlushLeft())
                
                HStack {
                    Spacer()
                    AppTextH4(
                        "Invited by \(inviter?.get_name() ?? "")",
                        size: FontSize.footer3.sz,
                        isLeading: true
                    )
                    .foregroundColor(Color.text1.opacity(0.7))
                }
                .modifier(FlushLeft())
                .padding([.trailing, .bottom],25)
                .padding([.top],15)
                .onTapGesture {
                    onNavToInvitee()
                }
            }
        }
        .onTapGesture {
            onTapBurn(self.burn)
        }
        .onAppear{
            componentDidMount()
        }

    }
    
    
}



//MARK: - preview

#if DEBUG
struct NotificationListView_Previewse: PreviewProvider {
    static var previews: some View {
        NotificationListView(isPreview:true)
            .modifier(AppBurntPage())
            .environmentObject(AppService())
            .environmentObject(AlertViewModel())
    }
}

#endif

