//
//  BurnHistoryView.swift
//  Lumo
//
//  Created by lingxiao on 10/2/22.
//
//  masonary view: https://iosexample.com/swiftui-views-that-arrange-their-children-in-a-pinterest-like-layout/
//  chat view: https://iosapptemplates.com/blog/swiftui/swiftui-chat
//


import Foundation
import SwiftUI


//MARK: - view


struct BurnHistoryView : View {
    
    @EnvironmentObject var appService: AppService
    @EnvironmentObject var viewModel : AlertViewModel
    @Environment(\.presentationMode) var presentationMode

    public var preview: Bool = false
        
    @State private var burnName: String = ""
    @State private var datasource:[GiftModel] = []
    
    @State private var num_gifts_sent: Int = 0
    @State private var amt_in_lumo   : Double = 0
    @State private var amt_invites   : Int = 0
    @State private var num_signatures: Int = 0


    // load twitter graph
    func componentDidMount(){
        if preview {
            datasource = [ GiftModel.mempty(), GiftModel.mempty(), GiftModel.mempty() ]
        } else {
            guard let burn = appService.currentBurn else {
                return;
            }
            burnName = burn.name
            self.datasource = burn.gifts
            let (num_gifts_sent, amt_in_lumo, amt_invites, num_signatures ) = burn.summarize_chain();
            self.num_gifts_sent = num_gifts_sent
            self.amt_in_lumo = roundToTwo(amt_in_lumo)
            self.amt_invites = amt_invites
            self.num_signatures = num_signatures
        }
    }
    
    

    
    //MARK: - view
    
    var body: some View {

        let fr = UIScreen.main.bounds
        let wd = fr.width*2/3
        let gridItemLayout : [GridItem] = [GridItem](repeating: GridItem(.flexible()), count: 1)

        ZStack {
                
            // swag
            Image("acid1a")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: fr.width*1.5)
                .position(x: wd*2+50, y:fr.height/2)
            
            // users
            ScrollView (.vertical, showsIndicators: false) {
                HStack{}.frame(width:fr.width,height:25)
                LazyVGrid(columns: gridItemLayout, spacing:1){
                    ForEach(datasource, id: \.self.rand_id) { mgift in
                        BurnHistoryItemView(gift:mgift)
                    }
                    HStack{}.frame(width:fr.width,height:25+HEADER_HEIGHT)
                }
            }
            .frame(width: wd, height: fr.height-HEADER_HEIGHT)
            .position(x: wd/2 + 25, y: fr.height/2+HEADER_HEIGHT/2)
            .coordinateSpace(name: "scroll")
            .modifier(AppPageFade(top: 0.15, bottom: 0.65))

            // instruction banner
            VStack {
                Banner()
                HStack {}
                .padding([.bottom],10)
                .frame(width: fr.width,height:FontSize.footer2.sz*2)
            }
            .frame(width: fr.width,height:HEADER_HEIGHT*3/4)
            .position(x:fr.width/2,y:fr.height-HEADER_HEIGHT*3/4)

            AppHeader(
                name: "initiation: \(burnName)".uppercased(),
                goBack: {
                    presentationMode.wrappedValue.dismiss()
            })
            .position(x: fr.width/2, y: HEADER_HEIGHT)

        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .background(.black)
        .modifier(WithSwipeToGoBack())
        .onAppear{
            componentDidMount()
        }
    }


    @ViewBuilder private func Banner() -> some View {
        let fr = UIScreen.main.bounds
        HStack {
            Spacer()
            BannerText(
                num_signatures > 1
                ?
                "** \(Double(num_signatures).kmFormatted) signatures"
                :
                "** \(Double(num_signatures).kmFormatted) signature"
            )
            Spacer()
            BannerText("** \(amt_in_lumo) tabs shared")
            Spacer()
            BannerText("** \(Double(amt_invites).kmFormatted) burners invited")
            Spacer()
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

}

//MARK: - row class

struct BurnHistoryItemView : View {
    
    public var gift: GiftModel?
    @State private var src: UserModel? = nil
    @State private var tgt: UserModel? = nil
    @State private var tgtT: TwitterModel? = nil
    @EnvironmentObject var appService: AppService

    func componentDidMount(){
        guard let gift = gift else { return }
        appService.get_user(at: gift.srcUserID){u in
            self.src = u
        }
        appService.get_user(at: gift.tgtUserID){u in
            self.tgt = u
        }
        /**appService.get_twitter_user(at: gift.tgtUserID){tu in
            self.tgtT = tu;
        }*/
    }
    
    func onNavToProfile(){
        if let tgt = tgt {
            appService.get_twitter_user(for: tgt){tuser in
                tuser?.nav_to_profile()
            }
        } else if let src = src {
            appService.get_twitter_user(for: src){tuser in
                tuser?.nav_to_profile()
            }
        } else {
            vibrateError()
        }
    }
    
    var body : some View {
        let fr = UIScreen.main.bounds;
        let w = fr.width;
        let h = CGFloat(120);
        let num = roundToTwo(gift?.amt_in_lumo ?? 0)
        let num_str = num == 0.1 ? "1/10th of a tab" : "\(num) tab"
        let about = (tgt?.get_name() ?? "") == ""
            ? "\(src?.get_name() ?? "") shared \(num_str) in an invite, and added 30 minutes to the burn."
            : "\(src?.get_name() ?? "") shared \(num_str) with \(tgt?.get_name() ?? ""), and added 3 minutes to the burn."
        
        VStack {
            if gift == nil {
                HStack{}.frame(width:fr.width,height:h)
            } else {
                
                HStack {
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
                    /*AppTextH3(
                        "\(num) tabs gifted",
                        size: FontSize.footer2.sz*2/3
                    )
                    .foregroundColor( Color.text3 )
                    .padding([.trailing],5)*/
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
        }
        .frame(width:w*2/3,height:h)
        .padding([.top],10)
        .onTapGesture {
            onNavToProfile()
        }
        .onAppear{
            componentDidMount()
        }

    }
    
    
}




//MARK: - preview

#if DEBUG
struct BurnHistoryView_Previewse: PreviewProvider {
    static var previews: some View {
        BurnHistoryView(preview:true)
            .environmentObject(AppService())
    }
}
#endif



