//
//  BurnView.swift
//  Lumo
//
//  Created by lingxiao on 8/14/22.
//


import Foundation
import SwiftUI
import CardStack


//MARK: - main app view that opens to current burn

private let SWIPE_ANIMATION_DURATION = 0.8
private let im_ratio  = CGFloat(0.217)

struct BurnView: View {
    
    // env + states
    @EnvironmentObject var appService: AppService
    @Environment(\.presentationMode) var presentationMode
    @EnvironmentObject var viewModel : AlertViewModel

    // subscribable model lists
    @State public var isHome: Bool
    @Binding public var burn: BurnModel? 
    public var goBackFromHero: ((_ burn: BurnModel?) -> Void)? = nil
    
    // view
    @State private var isPresentingComingSoon: Bool = false;
    // nav
    @State private var goToMerchWall: Bool = false;
    @State private var goToNewItem: Bool = false
    @State private var goToBurnHistory: Bool = false
    @State private var goToInitiationPacket: Bool = false
    @State private var goToAllManifestos: Bool = false
    @State private var active_initiation_packet: ItemModel? = nil
    
    // auth state
    @State private var isMine: Bool = false
    @State private var can_receive_payment: Bool = false

    // view state
    @State private var heroItem: ItemModel? = nil
    @State private var heroImageURL: URL?   = nil
    
    @State private var showManifesto: Bool      = true;
    @State private var timeStampExpire: Int     = 0;
    @State private var members : [ItemModel] = [];
    @State private var goEditManifesto: Bool    = false
    @State private var pending_invite: NominationModel? = nil
    
    // purchase lumo
    @State private var isPresentingConfirm: Bool = false
    @State private var pricingTier: PricingTier?  = nil
    @State private var isPurchasing: PricingTier? = nil
    @State private var showCardScanner: Bool = false;
    
    // view
    @State var footer_ht: CGFloat = CGFloat(HEADER_HEIGHT*2/3);
    @State var footer_pad_bottom: CGFloat = 25.0;
    @State var header_pad_top: CGFloat = CGFloat(UIDevice.current.hasNotch ? 25 : 10);
    @State var body_ht: CGFloat = 0
    @State var env_ht: CGFloat = 0
    @State var prompt_wd: CGFloat = 0

    
    //MARK: - timer
    
    // countdown timer to refetch db
    @State var _timeStampCurrent: Date = Date()
        
    // @Use: check if burn event ended, if yes, then hard reload
    var timer: Timer {
        Timer.scheduledTimer(withTimeInterval: 5, repeats: true) {_ in
            self._timeStampCurrent = Date()
            if let _ = self.burn {
                let ( day, hr, min, sec ) = _countDownInts()
                if day == 0 && hr == 0 && min == 0 && sec == 0 {
                    self.mount_db(true)
                }
            }
        }
    }
    
    func _countDownInts() -> (Int, Int, Int, Int) {
        let calendar = Calendar(identifier: .gregorian)
        let components = calendar
            .dateComponents([.day, .hour, .minute, .second],
                            from: self._timeStampCurrent,
                            to: intToDate(timeStampExpire)
            )
        return (
            max(0, components.day ?? 00),
            max(components.hour ?? 00, 0),
            max(components.minute ?? 00, 0),
            max(components.second ?? 00, 0)
        )
    }
    
    func layout_view(){
        let fr = UIScreen.main.bounds
        self.body_ht = fr.height
            - HEADER_HEIGHT
            - footer_ht
            - header_pad_top
            - footer_pad_bottom
        self.env_ht = body_ht*0.9;
        self.prompt_wd = fr.width-(env_ht*im_ratio)/3-20
    }

    //MARK: - mount + responders
    
    // @Use: if on load app, get the first burn to show user
    //       if navigated here from newsfeed, then set current
    //       appService burn to the `selected_burn`
    func componentDidMount(){
        layout_view();
        guard let burn = burn else { return };
        // mount burn event
        appService.setCurrentBurn(to: burn);
        mount_db(false);
        // start timer
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
            let _ = self.timer;
        }
        // set ownership + payment state
        self.isMine = appService.authed_uid == burn.userID;
        self.can_receive_payment = burn.can_receive_payment;
        // reload merchandize
        appService.fetch_contracts(for: burn, reload: true){_ in return }
        // check if i have been invited here
        appService.have_pending_invite(to: burn){nom in
            self.pending_invite = nom
        }
    }
    
    /// @Use: reload data, fromserver, and then
    ///      reload view
    func onReloadView(){
        self.mount_db(true);
    }
    
    // @use: load data
    func mount_db( _ reload: Bool ){
        self.timeStampExpire = burn?.current_block_expire() ?? 0;
        burn?.sync(
            full: true,
            reload: reload
        ){(succ, msg) in
            self.timeStampExpire = burn?.current_block_expire() ?? 0;
            self.load_datasource()
        }
    }
    
    // @use: load data-source
    func load_datasource(){
        var items = burn?.get_all_items() ?? []
        if let active_item = appService.topTinderCard {
            if items.contains(active_item){
                items = items.filter{ $0.item_id != active_item.item_id }
                items.insert(active_item, at:0)
            }
            self.members = items;
            appService.setTopTinderCard(to: nil);
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.10) {
                self.showManifesto = false
            }
            /// else insert explain deck item
        } else {
            if ( items.count > 0 ){
                items.insert(ItemModel.trivial(), at: 0);
                if items.count > 4 {
                    // insert buy tab card if necessary
                    if let burn = self.burn {
                        if burn.can_receive_payment && burn.userID != self.appService.authed_uid {
                            let randomInt1 = Int.random(in: 2..<items.count);
                            let randomInt2 = Int.random(in: 2..<items.count);
                            items.insert(ItemModel.trivial2(), at: randomInt1);
                            items.insert(ItemModel.trivial2(), at: randomInt2);
                        }
                    }
                }
                self.members = items;
            }
        }
    }
    
    //MARK: - navigation
        

    /// @use: accept pending invite
    func onAcceptInvite(){
        guard let pending = pending_invite else {
            return
        }
        appService.accept_nomination(with: pending.inviteCode){(res,_) in
            if res.success {
                viewModel.showSuccess(h1: "Accepted!", h2: "You have earned 1 tab")
                self.pending_invite = nil
            } else {
                viewModel.showFail(h1: "Oh no!", h2: res.message);
            }
        }
    }
    
    
    /// On swipe card, send gift
    /// - Parameters:
    ///   - dir: direction o swipe
    ///   - item: item model
    func onSwipeCard( _ dir: LeftRight, _ item: ItemModel ){
        if dir == LeftRight.right && !item.isTrivial {
            if item.isTrivial2 { // buy tab
                self.pricingTier = .tier1;
                onConfirmPurchase();
            } else {  // gift to nominee
                appService.gift_lumo_to_nominee(at: item){(succ,msg,bal) in
                    if !succ {
                        vibrateError()
                    }
                }
            }
        }
    }
    
    //MARK: - purchase
    
    /// @Use: on purchase
    /// - Parameter tier: teir of price
    func onInitiatePurchase( _ tier: PricingTier) {
        self.isPresentingConfirm = true
        self.pricingTier = tier;
    }
    
    // @use: if user has card, buy. else save card
    func onConfirmPurchase(){
        appService.does_admin_user_have_stripe(){have_stripe in
            if have_stripe {
                self.isPurchasing = self.pricingTier;
                self.goPurchase()
            } else {
                self.showCardScanner = true
            }
        }
    }
    
    // @Use: on save card, resume purchaes
    func onDidSaveCreditCard(_ b: Bool){
        self.showCardScanner = false
        viewModel.showSuccess(h1: "Saved!", h2: "purchasing \(pricingTier?.volume ?? 0) tabs...")
        goPurchase()
    }
    
    func goPurchase(){
        guard let tier = self.pricingTier else { return }
        self.isPurchasing = tier;
        appService.buy_lumo_token_on_polygon(at: tier, for: burn){res in
            if res.success {
                self.isPurchasing = nil
                viewModel.showSuccess(h1: "Done!", h2: "Check your tabs to reflect the updated balance")
            } else {
                viewModel.showFail(h1: "Oh no!", h2: res.message)
            }
        }
    }
    
    
    //MARK: - view

    var body: some View {
        
        let fr = UIScreen.main.bounds
        
        ZStack {
            
            Group {
                
                if showManifesto {
                    
                    // main body
                    BurnPrompt(
                        burn : $burn,
                        width: prompt_wd,
                        onReload: onReloadView,
                        onSeeHistory: {
                            self.goToBurnHistory = true
                        },
                        onInitiateBurners: {
                           self.showManifesto = false
                        },
                        onEditManifesto: {
                            self.goEditManifesto = true
                        },
                        onMineBlock: {_ in }
                    )
                    .frame(width:prompt_wd,height:body_ht)
                    .position(x:fr.width/2+40,y:fr.height/2-footer_ht+20)

                    // motif
                    Envelope()
                    
                    // timer
                    CountdownTimer()
                        .frame(width:fr.width,height:HEADER_HEIGHT-20)
                        .position(x:fr.width/2-10,y:25)
                    
                } else {
                    
                    AppTextH1("**\nUse the button on the bottom right to invite burners\n**", size: FontSize.h2.sz)
                        .foregroundColor(Color.text1.opacity(0.25))
                        .lineSpacing(5)
                        .padding([.all],35)
                    
                    //view motif
                    Image("cards-1")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width:fr.width/2)
                        .rotationEffect(Angle(degrees: 25))
                        .position(x:fr.width+20, y:fr.height/2-footer_ht*2)
                        .shadow(
                            color: Color.red2d.opacity( 0.8),
                            radius: 5,
                            x: -15,
                            y: 35
                        )
                    
                    CardStack(
                        direction: LeftRight.direction,
                        data: members,
                        onSwipe: { card, direction in
                            onSwipeCard(direction, card)
                        },
                        content: { card, direction, isOnTop in
                            Group {
                                if card.isTrivial2 == true {
                                    TinderBuyTabView(burn: $burn, padh: 20, padv: 100)
                                } else {
                                    TinderCardView(
                                        data: card,
                                        burn: $burn,
                                        padh: 20,
                                        padv: 100,
                                        onGoToInitiationPacket: {data in
                                            self.active_initiation_packet = data;
                                            self.goToInitiationPacket = true
                                        }
                                    )
                                }
                            }
                            .modifier(CenterHorizontal())
                            .modifier(CenterVertical())
                            .environment(\.cardStackConfiguration, CardStackConfiguration(
                                maxVisibleCards: 3
                            ))
                      }
                    )
                    .padding([.bottom],90);
                }
            }
            .frame(width: fr.width, height: body_ht, alignment: .center)
            
            Header()
                .position(x:fr.width/2,y:HEADER_HEIGHT/2)

            Footer()
                .frame(width:fr.width,height:footer_ht)
                .position(x:fr.width/2,y:fr.height-footer_ht/2-footer_pad_bottom)
            //                .padding([.bottom],footer_pad_bottom)


        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .edgesIgnoringSafeArea(.all)
        .modifier(AppBurntPage())
        .sheet(isPresented: $showCardScanner) {
            InputCreditCardView(onDidSaveCreditCard: onDidSaveCreditCard)
                .edgesIgnoringSafeArea(.all)
        }
        /// coming soon
        .confirmationDialog("Coming soon!",
                            isPresented: $isPresentingComingSoon) {
            Button("Coming soon!", role: .none) {
                self.isPresentingComingSoon = false
            }
        }
        .navigate(
            to: NominateView(),
            when: $goToNewItem
        )
        .navigate(
            to: InitiationPacketView(data: active_initiation_packet),
            when: $goToInitiationPacket
        )
        .navigate(
            to: MembersMerch(burn:burn),
            when: $goToMerchWall
        )
        .navigate(
            to: BurnHistoryView(),
            when: $goToBurnHistory
        )
        .modifier(WithHorizontalSwipeGesture(
            swipeRightToLeft: {_ in },
            swipeLeftToRight: {_ in
                if showManifesto == false {
                    showManifesto = true
                } else {
                    if isHome {
                        self.showManifesto = true
                        if let fn = self.goBackFromHero {
                            fn(self.burn);
                        }
                    } else {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        ))
        /*.onChange(of: burn, perform: {v in
            componentDidMount()
        })*/
        .onAppear{
            componentDidMount()
        }

    }
    
    //MARK: - view components
    
    @ViewBuilder private func Header() -> some View {
        let fr = UIScreen.main.bounds
        VStack {
            Spacer()
            HStack (alignment: .firstTextBaseline){
                Image("lumoCube4") ///lumoname
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(height:40)
                    .position(x:35,y:HEADER_HEIGHT/2+30)
                    .opacity(0.25)
                    .shadow(
                        color: Color.red2d.opacity(0.8),
                        radius: 5,
                        x: 15,
                        y: 15
                    )
                Spacer()
                IconButton(
                    kind   : .back,
                    color  : .white,
                    bkColor: .surface1.opacity(0.0),
                    radius : FontSize.body.sz,
                    onTap: {
                        self.showManifesto = true
                        if isHome {
                            if let fn = self.goBackFromHero {
                                fn(self.burn);
                            }
                        } else {
                            presentationMode.wrappedValue.dismiss()
                        }
                    }
                )
                .padding([.trailing,.bottom],15)
                .offset(y:-2)
            }
        }
        .frame(width: fr.width, height: HEADER_HEIGHT, alignment: .bottomLeading)
    }

    // countdown timer
    @ViewBuilder private func CountdownTimer() -> some View {
        VStack {
            AppTextH2(
                "This Burn Ends In:".uppercased(),
                size: FontSize.footer2.sz, isLeading: true
            )
            .foregroundColor( Color.surface1 )
            .padding([.leading],5)
            .modifier(FlushLeft())
            BurnTimer( timeStampExpire: $timeStampExpire)
            .padding([.leading],-15)
            .padding([.top],2)
            .modifier(FlushLeft())
        }
        .padding([.leading],25)
    }
    
    @ViewBuilder private func Envelope() -> some View {
        let fr = UIScreen.main.bounds
        ZStack {
            Image("initiationPacket2")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(height: env_ht)
                .position(x:-5,y:fr.height/2-footer_ht)
                .onTapGesture {
                    if let burn = burn {
                        if burn.can_receive_payment {
                            self.goToMerchWall = true;
                        } else {
                            self.isPresentingComingSoon = true
                        }
                    }
                }
                .shadow(
                    color: Color.red2d.opacity( 0.8),
                    radius: 5,
                    x: 15,
                    y: 15
                )
            AppTextH1(
                "community drops".uppercased(),
                size: FontSize.body.sz
            )
            .foregroundColor( Color.surface1 )
            .opacity(0.95)
            .rotationEffect(Angle(degrees: -90))
            .position(x:25,y:fr.height/2-footer_ht/2)
        }
    }
    
    @ViewBuilder private func Footer() -> some View {
        let fontsz = FontSize.footer2.sz*2/3;
        let vrb = isHome ? "Initiate" : "Invite"
        HStack {
            if !showManifesto {
                PillConvex(
                    label: "Done",
                    fontSize: fontsz,
                    disabled: .constant(false),
                    action: {
                        showManifesto = true
                    })
                .padding([.leading],25)
            } else {//if isHome {
                PillConvex(
                    label: "</ My Burns",
                    fontSize: fontsz,
                    disabled: .constant(false),
                    action: {
                        self.showManifesto = true
                        if isHome {
                            if let goBackFromHero = goBackFromHero {
                                goBackFromHero(nil)
                            }
                        } else {
                            presentationMode.wrappedValue.dismiss()
                        }
                    })
                .padding([.leading],25)
            }
            Spacer()
            if let _ = pending_invite {
                PillConvex(
                    label: "Accept invite",
                    color: Color.text1,
                    fontSize:fontsz,
                    disabled: .constant(false),
                    action: {
                        onAcceptInvite()
                    })
                .padding([.trailing],25)
            } else {
                PillConvex(
                    label: !showManifesto ? "\(vrb) Another Burner />" : "\(vrb) New Burners />",
                    fontSize: fontsz,
                    disabled: .constant(false),
                    action: {
                        self.goToNewItem = true
                    })
                .padding([.trailing],25)
            }
        }
    }
    
    
    
}




//MARK: - preview

// preview
#if DEBUG
struct BurnView_Previews: PreviewProvider {
    
    static var previews: some View {
        BurnView(isHome:false, burn: .constant(nil))
            .environmentObject(AppService())
        BurnView(isHome:false, burn: .constant(nil))
            .environmentObject(AppService())
    }
    
    
}
#endif



/**

 
 
 @ViewBuilder private func BuyTokenPrompt() -> some View {
     let fr = UIScreen.main.bounds
     VStack {

         Spacer()

         AppTextH1("**\nFuel this burn and receive tabs to witness your support\n**", size: FontSize.h4.sz)
             .foregroundColor(Color.text1.opacity(0.25))
             .lineSpacing(5)
             .padding([.horizontal],35)
         
         ZStack {
             
             RoundedRectangle(cornerRadius: 20)
                 .fill(Color.red2)
                 .softInnerShadow(
                     RoundedRectangle(cornerRadius: 20),
                     darkShadow: Color.red2d,
                     lightShadow: Color.red3
                 )
                 .frame(width:fr.width-60,height:fr.height/3)
                 .modifier(AppCardCorners())
             
             VStack {
                 Group {
                     if isPurchasing != nil && isPurchasing! == .tier1 {
                         TableCell("👉 Charging $5.00", "And receiving 1 tab...")
                     } else {
                         TableCell("🔥 $5.00", "Receive 1 burn tab")
                             .onTapGesture {
                                 onInitiatePurchase(.tier1)
                             }
                     }
                 }
                 .padding([.top],20)
                 Group {
                     if isPurchasing != nil && isPurchasing! == .tier2 {
                         TableCell("👉 Charging $50.00", "And receiving 10 tabs...")
                     } else {
                         TableCell("🔥🔥 $50.00", "Receive 10 burn tabs")
                             .onTapGesture {
                                 onInitiatePurchase(.tier2)
                             }
                     }
                 }
                 Group {
                     if isPurchasing != nil && isPurchasing! == .tier3 {
                         TableCell("👉 Charging $500.00", "And receiving 125 tabs...")
                     } else {
                         TableCell("🔥🔥🔥 $500.00", "Receive 100 burn tabs")
                             .onTapGesture {
                                 onInitiatePurchase(.tier3)
                             }
                     }
                 }
                 .padding([.bottom],20)
             }
             .padding([.leading],50)
         }

         Spacer()

     }
     .frame(width: fr.width, height: height-HEADER_HEIGHT, alignment: .center)
 }
 
 @ViewBuilder private func TableCell( _ h1: String, _ h2: String) -> some View {
     VStack {
         AppTextH2(h1, size: FontSize.body.sz)
             .foregroundColor(Color.text1.opacity(0.75))
             .padding([.horizontal],15)
             .modifier(FlushLeft())
         AppTextBody(h2, size: FontSize.footer2.sz)
             .foregroundColor(Color.text1.opacity(0.55))
             .padding([.horizontal,],15)
             .padding([.vertical],2)
             .modifier(FlushLeft())
         /**Rectangle()
             .frame(height: 0.50, alignment: .bottom)
             .foregroundColor(Color.red2)*/
     }
     .padding([.bottom],10)
 }
 
*/
