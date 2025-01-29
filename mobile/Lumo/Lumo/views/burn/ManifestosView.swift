//
//  ManifestosView.swift
//  Lumo
//
//  Created by lingxiao on 9/26/22.
//



import Foundation
import SwiftUI

struct ManifestosView : View {
        
    @EnvironmentObject var appService : AppService;
    @Environment(\.presentationMode) var presentationMode

    public var onNavToBurn: ((_ burn: BurnModel?) -> Void)? = nil
       
    // data
    @State private var datasource: [BurnModel] = []
    
    // navigation
    @State private var goToScanQRCode: Bool = false;
    @State private var goToProfile: Bool = false
    @State private var goToAlerts: Bool  = false
    @State private var goToWallet: Bool  = false
    @State private var goToWriteManifesto: Bool = false
    @State private var goToBurn: Bool = false
    @State private var selectedBurn: BurnModel? = nil
    @State private var has_home: Bool = false

    //@Use: load all manifestos
    func componentDidMount(){
        self.onReload(false)
    }
    
    func onReload(_ should_reload: Bool){
        appService.fetch_burn_newsfeed(reload:should_reload){all_burns, _ in
            self.datasource = all_burns
        }
        appService.fetch_hero_burn(){mburn in
            self.has_home = mburn != nil
        }
    }
    

    // MARK: - view

    var body: some View {
        
        let fr = UIScreen.main.bounds
        let header_pad_top : CGFloat = UIDevice.current.hasNotch ? 25 : 10
        let gridItemLayout : [GridItem] = [GridItem](repeating: GridItem(.flexible()), count: 1)

        ZStack {
                
            Image("MATCHBOX")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width:fr.width*3)
                .position(x:fr.width+20,y:fr.height/2)
            
            // newsfeed
            ScrollView (.vertical, showsIndicators: false) {
                
                PullToRefresh(coordinateSpaceName: "PTR_ManifestosView") {                    
                    self.onReload(true)
                }

                VStack{}.frame(height:25)
                
                VStack (alignment: .leading){

                    AppTextH1("//My Burns".uppercased(), size: FontSize.body.sz+5, isLeading: true)
                        .foregroundColor(.text1)
                        .padding([.bottom],15)
                        .modifier(FlushLeft())
                    
                    /**HStack {
                        AppTextH1("** Invited", size: FontSize.h4.sz, isLeading: true)
                            .foregroundColor(Color.surface1)
                            .padding([.bottom],2)
                            Spacer()
                    }
                    HStack {
                        AppTextH1("burns", size: FontSize.body.sz, isLeading: true)
                            .foregroundColor(Color.surface2)
                            .padding([.bottom],10)
                        Spacer()
                    }*/
                }
                .padding([.leading],25)
                
                LazyVGrid(columns: gridItemLayout, spacing:1){
                    ForEach((datasource), id: \.rand_id){burn in
                        ManifestoRowView(
                            burn: burn,
                            onTapBurn: {_ in
                                //self.goToBurn = true
                                self.selectedBurn = burn
                                self.appService.setCurrentBurn(to: burn)
                                if let onNavToBurn = self.onNavToBurn {
                                    onNavToBurn(burn)
                                }
                        })
                    }
                }
                
                VStack{}.frame(height:50)

            }
            .frame(width:fr.width-60, height:fr.height-header_pad_top)//HEADER_HEIGHT)
            .coordinateSpace(name: "PTR_ManifestosView")
            .position(x:fr.width/2-35,y:fr.height/2+HEADER_HEIGHT/2)
            .modifier(AppPageFade(top: 0.25, bottom: 0.75))
            
            // header buttons
            HeaderSimple()
                .position(x: fr.width/2, y: HEADER_HEIGHT/2+header_pad_top)

            // footer
            VStack {
                Spacer()
                BlockNavFooter()
                    .padding([.bottom],30)
            }

        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .modifier(AppBurntPage(src: "lumoRed4"))
        .onAppear{
            componentDidMount()
        }
        .modifier(WithSwipeToGoBack())
        .navigate(
            to: ScanMerch(),
            when: $goToScanQRCode
        )
        .navigate(
            to: NewManifestoView(),
            when: $goToWriteManifesto
        )
        .navigate(
            to: ProfileView(),
            when: $goToProfile
        )
        .navigate(
            to: WalletView(),
            when: $goToWallet
        )
        .navigate(
            to: NotificationListView(),
            when: $goToAlerts
        )
    }
    
    // header simple
    @ViewBuilder private func HeaderSimple() -> some View {

        let fr = UIScreen.main.bounds

        HStack (alignment: .bottom){
            
            Spacer()
            
            Button(action: {
                self.goToProfile = true
            }) {
                Image(systemName: "person")
                    .frame(width:10,height:10)
            }
            .softButtonStyle(
                Circle(),
                mainColor: Color.red2,
                textColor: Color.text1,
                darkShadowColor: Color.red2d,
                lightShadowColor:Color.red3
            )
            .padding([.top],35)
            
            Button(action: {
                self.goToAlerts = true
            }) {
                Image(systemName: "flame.fill")
                    .frame(width:10,height:10)
            }
            .softButtonStyle(
                Circle(),
                mainColor: Color.red2,
                textColor: Color.text1,
                darkShadowColor: Color.red2d,
                lightShadowColor:Color.red3
            )
            .padding([.top],35)

            Button(action: {
                self.goToWallet = true
            }) {
                Image(systemName: "face.smiling")
                    .frame(width:10,height:10)
            }
            .softButtonStyle(
                Circle(),
                mainColor: Color.red2,
                textColor: Color.text1,
                darkShadowColor: Color.red2d,
                lightShadowColor:Color.red3
            )
            .padding([.top],35)
            .padding([.trailing],20)

        }
        .frame(width: fr.width, height: 50, alignment: .leading);
    }    

    // footer
    @ViewBuilder private func BlockNavFooter() -> some View {
        HStack {
            /**
            PillConvex(
                label: "Proof of ownership",
                fontSize: FontSize.footer2.sz*2/3,
                disabled: .constant(false),
                action: {
                    self.goToScanQRCode = true
                })*/
            PillConvex(
                label: "Drop🔥Manifesto", fontSize: FontSize.footer2.sz*2/3,
                disabled: .constant(false),
                action: {
                    self.goToWriteManifesto = true
            })
            .padding([.leading],20)
            Spacer()
            Button(action: {
                self.goToScanQRCode = true
            }) {
                Image(systemName: "qrcode.viewfinder")
                    .frame(width:20,height:20)
            }
            .softButtonStyle(
                Circle(),
                mainColor: Color.red2,
                textColor: Color.white,
                darkShadowColor: Color.red2d,
                lightShadowColor:Color.red3
            )
            .padding([.trailing],20)
        }
    }
}


//MARK: - table row


fileprivate struct ManifestoRowView : View {
    
    var burn: BurnModel?
    var onTapBurn: (BurnModel?) -> Void
    
    @State private var name: String = ""
    @State private var img : URL? = nil
    @State private var about: String = ""
    @State private var expire: String = ""
    @State private var user: UserModel? = nil
    @State private var tuser: TwitterModel? = nil
    
    @State private var decoded: Bool = true;
    
    @EnvironmentObject var appService: AppService

    func componentDidMount(){
        
        // parse about
        let max_len = 20;
        let wss  = (burn?.about ?? "").components(separatedBy: " ");
        let wsp  = wss.count < max_len ? wss : Array(wss[0...max_len])
        let wss1 = wsp.joined(separator: " ")
        self.about = wsp.count < wss.count ? "\(wss1)..." : wss1;
        
        // parse burn expire
        if let brn = burn {
            let dt = Double((brn.timeStampLatestBlockExpire-swiftNow())/60)
            self.expire = dt > 0 ? "\(dt.kmFormatted) min left" : "Burnt out"
        }
                
        // load user
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

    @ViewBuilder func cube_img() -> some View {
        let raw = (UIImage(named: "IncompleteCube\(randCubeIdx())")) ?? UIImage(named: "IncompleteCube10")!
        let uiimg = raw.mask(with: UIColor(Color.surface1))
        Image(uiImage: uiimg)
            .resizable()
            .aspectRatio(contentMode: .fit)
    }
    
    var body: some View {
        
        let num : Double = roundToTwo((burn?.read_total_lumo_gifted() ?? 0));
        let raw = (UIImage(named: "IncompleteCube\(randCubeIdx())")) ?? UIImage(named: "IncompleteCube10")!
        let uiimg = raw.mask(with: UIColor(Color.surface1))

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
                tuser?.nav_to_profile()
            }
                
            if decoded {
                AppTextH4(self.about, size:FontSize.footer2.sz, isLeading: true)
                    .lineSpacing(5)
                    .padding([.leading, .trailing],25)
                    .foregroundColor(.text1)
                    .modifier(FlushLeft())
            } else {
                Text(Image(uiImage:uiimg))
                    .font(.custom("NeueMachina-UltraLight", size: 10))
//                ForEach(0..<rows, id: \.self ){ col in
//                    HStack {
//                        ForEach(0..<cols, id: \.self){row in
//                            CubeView(at: randCubeIdx(), color: Color.surface1, should_animate: false, ratio: 1/3)
//                                .frame(width: 40, height: 40)
//                        }
//                    }
//                }
            }
            
            HStack {
                Spacer()
                AppTextH4(
                    expire,
                    size: FontSize.footer3.sz,
                    isLeading: true
                )
                .foregroundColor(Color.text1.opacity(0.7))
                .padding([.trailing],3)
                AppTextH4(
                    num > 0 ? "\(num) tabs shared" : "",
                    size: FontSize.footer3.sz,
                    isLeading: true
                )
                .foregroundColor(Color.text1.opacity(0.7))
            }
            .modifier(FlushLeft())
            .padding([.trailing, .bottom],25)
            .padding([.top],15)
        }
        .onTapGesture {
            onTapBurn(self.burn)
        }
        .onAppear{
            componentDidMount()
        }

    }
    
}

private func randCubeIdx() -> Int {
    return Int.random(in: 1..<225)
}




//MARK: - preview

#if DEBUG
struct ManifestosView_Previewse: PreviewProvider {
    static var previews: some View {
        ManifestosView()
            .environmentObject(AppService())
    }
}
#endif

