//
//  TwitterGraphView.swift
//  Lumo
//
//  Created by lingxiao on 9/19/22.
//


import Foundation
import SwiftUI


//MARK: - view

fileprivate let base_str = "Share on IG/Snap instead"
fileprivate let progress_btn_str = "one moment please"

struct TwitterGraphView : View {
    
    @EnvironmentObject var appService: AppService
    @EnvironmentObject var viewModel : AlertViewModel
    @Environment(\.presentationMode) var presentationMode

    public var preview: Bool = false
    
    @State private var datasource:[TwitterModel] = []
    @State private var num_tabs: CGFloat = 0.0;
    
    @State private var isPresentingConfirm: Bool = false
    @State private var selectedUser: TwitterModel? = nil
    @State private var searchText     = ""
    @State private var didSearch      = false
    @State private var showAlt: Bool  = false
    @State private var btn_str        = base_str
    @State private var disabled: Bool = false
    @State private var goToStoryView: Bool = false
    @State private var nominationCode: String = ""
    
    // load twitter graph
    func componentDidMount(){
        self.num_tabs = roundToTwo(appService.current_balance)
        appService.off_chain_authed_balance_lumo(){b in
            self.num_tabs = roundToTwo(b)
        }
        if preview {
            datasource = [ TwitterModel.mempty(), TwitterModel.mempty(), TwitterModel.mempty(), TwitterModel.mempty(), TwitterModel.mempty(),TwitterModel.mempty(),
                           TwitterModel.trivial(),TwitterModel.trivial()
            ]
        } else {
            appService.get_twitter_graph(reload: false){ms in
                if ms.count > 0 {
                    datasource = ms;
                    datasource += [TwitterModel.trivial(),TwitterModel.trivial()]
                } else {
                    showAlt = true
                }
            }
        }
    }
    
    
    //MARK: - resonders
    
    /// @use: query for user, if no query, then output full twitter graph
    func onSearch(){
        showAlt   = true;
        didSearch = true;
        if searchText == "" {
            componentDidMount()
        } else {
            let _datasource = appService.filter_twitter_graph(with: searchText);
            datasource = _datasource;
        }
    }
    
    func nominate(_ tuser: TwitterModel){
        isPresentingConfirm = true
        selectedUser = tuser;
    }
        
    /// @Use: on copy link, create and esnd invite message
    func onCopyLink(){
        if disabled {
            return
        } else {
            btn_str = progress_btn_str
            disabled = true
            appService.nominate_burn_leader(
                for: selectedUser,
                at: appService.currentBurn
            ){(succ,str,nom) in
                guard let nom = nom else {
                    viewModel.showFail(h1: "Oh no!", h2: str );
                    btn_str = base_str
                    disabled = false
                    return;
                }
                if succ {
                    let msg = invite_message(nom.inviteCode, remove_spaces: false)
                    UIPasteboard.general.string = msg;
                    viewModel.showSuccess(
                        h1:"Copied Link",
                        h2: "You can screenshot this page or paste link via text"
                    )
                    self.btn_str = base_str
                    self.disabled = false
                    self.nominationCode = nom.inviteCode
                    self.goToStoryView  = true
                } else {
                    viewModel.showFail(h1: "Oh no!", h2: str );
                    btn_str = "Try again"
                    disabled = false
                }
            }
        }
    }
    
    /// @use:  on nominate, ask the user to copy the message and share with the nominee
    /// @source: https://developer.twitter.com/en/docs/twitter-for-websites/direct-message-button
    /// @sourc: https://stackoverflow.com/questions/44729998/open-a-users-twitter-profile-page-from-ios-app
    /// @source: https://stackoverflow.com/questions/6208363/sharing-a-url-with-a-query-string-on-twitter
    /// @Example url:  "https://twitter.com/messages/compose?recipient_id=\(user.twitter_id)&text=Hello%20world"
    private func confirmNominate(){
        if disabled {
            return;
        } else {
            btn_str = progress_btn_str
            disabled = true
            //viewModel.showLoading(h1: "...", h2: "Checking your Lumo balance")
            guard let user = selectedUser else {
                isPresentingConfirm = false
                btn_str = base_str
                disabled = false
                viewModel.showFail(h1: "Oh no!", h2: "We cannot locate this person" );
                return;
            }
            /// 1. fetch code from the server
            appService.nominate_burn_leader(for: selectedUser, at: appService.currentBurn){(succ,str,nom) in
                guard let nom = nom else {
                    viewModel.showFail(h1: "Oh no!", h2: str );
                    btn_str = base_str
                    disabled = false
                    return;
                }
                guard nom.inviteCode != "" else {
                    viewModel.showFail(h1: "Oh no!", h2: str );
                    btn_str = base_str
                    disabled = false
                    return
                }
                
                let msg = invite_message(nom.inviteCode, remove_spaces: true)
                let url_raw = "https://twitter.com/messages/compose?recipient_id=\(user.id)&text=\(msg)"
                guard let appURL = URL(string: url_raw) else {
                    btn_str = base_str
                    btn_str = base_str
                    disabled = false
                    return;
                }
                btn_str = base_str
                disabled = false
                DispatchQueue.main.async {
                    if UIApplication.shared.canOpenURL(appURL as URL) {
                        if #available(iOS 10.0, *) {
                            UIApplication.shared.open(appURL)
                        } else {
                            UIApplication.shared.openURL(appURL)
                        }
                    } else {
                        guard let webURL = URL(string: url_raw) else {
                            return;
                        }
                        if #available(iOS 10.0, *) {
                            UIApplication.shared.open(webURL)
                        } else {
                            UIApplication.shared.openURL(webURL)
                        }
                    }
                }
            }
        }
    }
    
    //MARK: - view
    
    var body: some View {

        let fr = UIScreen.main.bounds
        let gridItemLayout : [GridItem] = [GridItem](repeating: GridItem(.flexible()), count: 1)

        ZStack {
                
            // swag
            Image("acidbag")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: fr.width*2.5)
                .position(x:-1*fr.width/5,y:fr.height/2+40)
            
            // users
            ScrollView {
                LazyVGrid(columns: gridItemLayout, spacing:1){
                    ForEach(datasource, id: \.self.rand_id) { tuser in
                        UserView(tuser)
                    }
                    HStack{}.frame(width:fr.width,height:80)
                }
                .background(
                    GeometryReader {
                        Color.clear.preference(key: ViewOffsetKey.self,
                        value: -$0.frame(in: .named("scroll")).origin.y)
                })
                .onPreferenceChange(ViewOffsetKey.self) {
                    showAlt = $0 > fr.height || didSearch
                }
            }
            .frame(width: fr.width, height: fr.height-HEADER_HEIGHT)
            .position(x:fr.width/2+30,y:fr.height/2+HEADER_HEIGHT+20)
            .coordinateSpace(name: "scroll")
            .modifier(AppPageFade(top: 0.15, bottom: 0.65))

            // instruction banner
            VStack {
                Banner()
                HStack {
                    Spacer()
                    AppTextFooter1("You have \(num_tabs) tabs to give", size: FontSize.footer2.sz)
                        .foregroundColor(Color.text1.opacity(0.75))
                    Spacer()
                }
                .padding([.bottom],10)
                .frame(width: fr.width,height:FontSize.footer2.sz*2)
            }
            .background(Color.red2)
            .frame(width: fr.width,height:HEADER_HEIGHT*3/4)
            .position(x:fr.width/2,y:fr.height-HEADER_HEIGHT*3/4)
            
            // search
            VStack {
                VStack {
                    TextField("", text: $searchText)
                        .foregroundColor(Color.text1)
                        .font(.custom("NeueMachina-Bold", size: FontSize.footer1.sz))
                        .frame(width:fr.width-60,alignment: .leading)
                        .onSubmit {
                            onSearch()
                        }
                }
                .frame(width:fr.width-30, height:FontSize.footer1.sz*3)
                .border(Color.text3.opacity(0.5),width:1)
            }
            .frame(width: fr.width, height: FontSize.footer1.sz*4)
            .position(x:fr.width/2,y:HEADER_HEIGHT+40)

            AppHeader(
                name: "Initiate via twitter Dm".uppercased(),
                goBack: {
                    presentationMode.wrappedValue.dismiss()
            })
            .position(x: fr.width/2, y: HEADER_HEIGHT)

        }
        .ignoresSafeArea(.keyboard)
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .background(.black)
        .navigate(
            to: NominateStoryView(code:nominationCode),
            when: $goToStoryView
        )
        .modifier(WithSwipeToGoBack())
        .confirmationDialog("Are you sure?",
            isPresented: $isPresentingConfirm) {
            Button("Nominate \(selectedUser?.name ?? "")", role: .none) {
                    confirmNominate()
            }
         }
        .onAppear{
            componentDidMount()
        }
    }
    
    @ViewBuilder private func Banner() -> some View {
        let fr = UIScreen.main.bounds
        Group {
            if showAlt || datasource.count < 5 {
                HStack {
                    Spacer()
                    PillConvex(
                        label: btn_str,
                        fontSize: FontSize.footer1.sz,
                        disabled: $disabled,
                        action: {
                            onCopyLink()
                        }
                    )
                    Spacer()
                }
            } else {
                HStack {
                    Spacer()
                    BannerText("1. Select potential burner")
                    Spacer()
                    BannerText("2. Send tab to burner via Twitter DM")
                    Spacer()
                    BannerText("3. If accepted, they will own the tab")
                    Spacer()
                }
            }
        }
        .frame(width:fr.width,height:80)
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

    @ViewBuilder private func UserView(_ tuser: TwitterModel ) -> some View {
        let fr = UIScreen.main.bounds;
        let w = fr.width;
        let h = CGFloat(80);
        let num = Double(tuser.twitter_followers_count).kmFormatted;
        
        VStack {
            if tuser.isTrivial {
                HStack{}.frame(width:fr.width,height:h)
            } else {
                
                HStack {
                    AppTextH2(
                        (tuser.name).uppercased(),
                        size: FontSize.footer2.sz
                    )
                    .foregroundColor( Color.text1 )
                    Spacer()
                    AppTextH3(
                        "\(num) followers",
                        size: FontSize.footer2.sz*2/3
                    )
                    .foregroundColor( Color.text3 )
                    .padding([.trailing],5)
                }
                .modifier(FlushLeft())
                AppTextH3(
                    tuser.about,
                    size: FontSize.footer3.sz
                )
                .lineSpacing(4)
                .modifier(FlushLeft())
                .foregroundColor( Color.text2 )
                .padding([.top],3)
            }
        }
        .frame(width:w*2/3,height:h)
        .padding([.top],10)
        .onTapGesture {
            nominate(tuser)
        }
    }
}


//MARK: - scroll accessory


/// @Use: view offset key
/// @source: https://stackoverflow.com/questions/62588015/get-the-current-scroll-position-of-a-swiftui-scrollview
fileprivate struct ViewOffsetKey: PreferenceKey {
    typealias Value = CGFloat
    static var defaultValue = CGFloat.zero
    static func reduce(value: inout Value, nextValue: () -> Value) {
        value += nextValue()
    }
}

//MARK: - preview

#if DEBUG
struct TwitterGraphView_Previewse: PreviewProvider {
    static var previews: some View {
        TwitterGraphView(preview:true)
            .environmentObject(AppService())
    }
}
#endif



