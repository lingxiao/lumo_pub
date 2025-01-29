//
//  MembersMerch.swift
//  Lumo
//
//  Created by lingxiao on 11/6/22.
//


import Foundation
import SwiftUI


//MARK: - view

struct MembersMerch : View {
    
    @EnvironmentObject var appService: AppService
    @Environment(\.presentationMode) var presentationMode
    
    public var burn: BurnModel?
    
    @State private var new_drops:[ContractModel]  = []
    @State private var purchased:[[NonfungibleTok]] = []
    @State private var receiver_name: String = ""
    @State private var tab: Int = 0
    
    @State private var hideBanner = true;
    @State private var showAltBanner = false;
    
    // nav
    @State private var goToMerch: Bool = false
    @State private var goToDropMerch: Bool = false

    // load twitter graph
    func componentDidMount(){
        self.onReload(false);
        if let burn = burn {
            self.hideBanner = burn.userID != appService.authed_uid
        }
    }
        
    // @use: fetch collections + toks
    func onReload(_ reload: Bool){
        appService.fetch_contracts(for: burn, reload: reload){contracts in
            self.new_drops = contracts.sorted{ $0 > $1  }
        }
        onDidBuyItem(reload);
    }
        
    // @use: fetch toks
    func onDidBuyItem( _ reload: Bool ){
        appService.fetch_all_toks(for: burn, reload: reload){toks in
            let stoks = toks.sorted{ $0 > $1 }
            var ttoks : [[NonfungibleTok]] = [];
            stoks.forEach{tok in
                if ttoks.count == 0 {
                    ttoks = [[tok]]
                } else {
                    var last_row = ttoks[ttoks.count - 1];
                    if last_row.count == 1 {
                        last_row = [ last_row[0], tok ]
                        ttoks[ttoks.count-1] = last_row;
                    } else {
                        ttoks.append([tok])
                    }
                }
            }
            ttoks = ttoks.filter{ $0.count > 0 } 
            self.purchased = ttoks;
        }
    }
    
    func goToTok(_ tok: NonfungibleTok?){
        if let tok = tok {
            appService.currentMerch = tok;
            self.goToMerch = true
        }
    }
    
    func onDidDropMerch(){
        self.onReload(true);
    }
    
    //MARK: - view
    
    var body: some View {

        let fr = UIScreen.main.bounds
        let ratio : CGFloat = 1.8;
        let swd: CGFloat = fr.width/2
        let sht: CGFloat = ratio * swd;

        ZStack {

            ///img motif
            Image("cards-3t")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width:fr.width)
                .position(x:fr.width/2, y: hideBanner ? fr.height-150 : fr.height-200)

            ScrollView {
                
                PullToRefresh(coordinateSpaceName: "PTR_MerchView") {
                    self.onReload(true)
                }

                VStack {
                    BlockNavHeader()
                    if self.tab == 0 {
                        ForEach(new_drops, id: \.self.rand_id) { contract in
                            MerchCard(
                                padh: 20,
                                padv: 120,
                                contract: contract,
                                onDidBuyItem: { onDidBuyItem(true) }
                            )
                        }
                    } else {
                        ForEach(purchased, id: \.self[0].rand_id) { toks in
                            HStack {
                                if toks.count > 0 {
                                    MerchCardSimple(wd: swd, ht: sht, tok: toks[0], goToTok: {
                                        goToTok(toks[0])
                                    })
                                    .padding([.leading],3)
                                }
                                if toks.count > 1 {
                                    MerchCardSimple(wd: swd, ht: sht, tok: toks[1], goToTok: {
                                        goToTok(toks[1])
                                    })
                                    .padding([.trailing],3)
                                } else {
                                    Spacer()
                                }
                            }
                        }
                    }
                    HStack{}.frame(width:fr.width,height:HEADER_HEIGHT*2)
                }
            }
            .frame(width: fr.width, height: fr.height-HEADER_HEIGHT*3/4)
            .position(x:fr.width/2,y:fr.height/2+HEADER_HEIGHT*3/4)
            //.modifier(AppPageFade(top: 0.15, bottom: 0.65))
            
            // image motif
            Image("cards-3b")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width:fr.width)
                .position(x:fr.width/2,y: hideBanner ? fr.height+fr.width/3+10 : fr.height+92)
            
            AppHeader(
                name: "community drops".uppercased(),
                goBack: {
                    presentationMode.wrappedValue.dismiss()
            })
            .position(x: fr.width/2, y: HEADER_HEIGHT)
                
            // banner
            if !hideBanner {
                Banner()
                    .position(x:fr.width/2,y:fr.height-60)
            }

        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .coordinateSpace(name: "PTR_MerchView")
        .background(.black)
        .navigate(
            to: OneMerch(),
            when: $goToMerch
        )
        .navigate(
            to: DropMerch(burn:burn, onDidDropMerch:onDidDropMerch),
            when: $goToDropMerch
        )
        .modifier(WithSwipeToGoBack())
        .onAppear{
            componentDidMount()
        }
    }
    
    //MARK: -  view components
    
    @ViewBuilder private func Banner() -> some View {
        let fr = UIScreen.main.bounds
        Group {
            if showAltBanner || true {
                HStack {
                    Spacer()
                    PillConvex(
                        label: "Drop digital merch in envelope",
                        fontSize: FontSize.footer2.sz,
                        disabled: .constant(false),
                        action: {
                            self.goToDropMerch = true
                        }
                    )
                    Spacer()
                }
            } else {
                HStack {
                    Spacer()
                    BannerText("1. Create digital merch")
                    Spacer()
                    BannerText("2. Drop merch in envelope")
                    Spacer()
                    BannerText("3. Share with community members")
                    Spacer()
                }
            }
        }
        .frame(width:fr.width,height:70)
        .background(Color.red2)
    }
    
    @ViewBuilder private func BannerText(_ str: String) -> some View {
        let fr = UIScreen.main.bounds
        AppTextH3(
            str,
            size: FontSize.footer3.sz
        )
        .lineSpacing(4)
        .foregroundColor(Color.text1)
        .frame(width:fr.width/4)
        .padding([.vertical],10)
    }

    
    @ViewBuilder private func BlockNavHeader() -> some View {
        let fr = UIScreen.main.bounds
        HStack {
            Spacer()
            MaterialUIButton(
                label : "New Drops",
                width : fr.width/3,
                isOn  : true,
                background: Color.black,
                color : Color.red2,
                borderColor: Color.red2,
                fontSize: FontSize.footer2.sz,
                action: {
                    self.tab = 0;
                    if let burn = burn {
                        self.hideBanner = burn.userID != appService.authed_uid
                    }
                })
                .padding([.trailing],3)
                .opacity(tab == 0 ? 1.0 : 0.5)
            MaterialUIButton(
                label : "My Merch",
                width : fr.width/3,
                isOn  : true,
                background: Color.black,
                color : Color.red2,
                borderColor: Color.red2,
                fontSize: FontSize.footer2.sz,
                action: {
                    self.tab = 1;
                    self.hideBanner = true
                })
                .padding([.leading],3)
                .opacity(tab == 1 ? 1.0 : 0.5)
            Spacer()
        }
    }
}


//MARK: - preview

#if DEBUG
struct MembersMerch_Previews
: PreviewProvider {
    static var previews: some View {
        MembersMerch( burn: nil )
            .environmentObject(AppService())
    }
}
#endif



