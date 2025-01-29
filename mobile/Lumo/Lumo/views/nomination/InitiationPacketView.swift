//
//  InitiationPacketView.swift
//  Lumo
//
//  Created by lingxiao on 9/24/22.
//


import Foundation
import SwiftUI


//MARK: - view

struct InitiationPacketView : View {
    
    @EnvironmentObject var appService: AppService
    @Environment(\.presentationMode) var presentationMode
    
    public var data: ItemModel? = nil
    
    @State private var datasource:[UserModel] = []
    @State private var lumo_total: Double = 1.0;
    @State private var receiver_name: String = ""
    
    // load twitter graph
    func componentDidMount(){
        appService.get_user(at: data?.userID){user in
            self.receiver_name = user?.name ?? ""
        }
        appService.fetch_all_gifts(for: data){gifts in
            let _total = gifts.map{ $0.amt_in_lumo }.reduce(0,+)
            self.lumo_total += roundToTwo(_total)
            let users = gifts.map{
                self.appService.get_user(at: $0.srcUserID)
            }
            .filter{ $0 != nil }
            .map{ $0! }
            let unique_users = Array(Set(users));
            DispatchQueue.main.async {
                self.datasource = unique_users
                self.datasource += [UserModel.trivial(),UserModel.trivial(), UserModel.trivial()]
            }
        }
    }
    
    
    //MARK: - view
    
    var body: some View {

        let fr = UIScreen.main.bounds

        ZStack {
                
            // swag
            Image("acidbag")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: fr.width*2.5)
                .position(x:-1*fr.width/5,y:fr.height/2+40)
            
            Image("acid1a")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: fr.width/2)
                .position(x:-20,y:fr.height/2+40)
            
            // users
            ScrollView {
                VStack {
                    ForEach(datasource, id: \.self.rand_id) { muser in
                        UserRowView(user: muser)
                    }
                    HStack{}.frame(width:fr.width,height:80)
                }
            }
            .frame(width: fr.width, height: fr.height-HEADER_HEIGHT*3/4)
            .position(x:fr.width/2+30,y:fr.height/2+HEADER_HEIGHT*3/4)
            .modifier(AppPageFade(top: 0.15, bottom: 0.65))
            
            // instruction banner
            VStack {
                Banner()
            }
            .background(Color.red2)
            .frame(width: fr.width,height:HEADER_HEIGHT*3/4)
            .position(x:fr.width/2,y:fr.height-HEADER_HEIGHT*3/4)
            
            AppHeader(
                name: "The Initiation Crew".uppercased(),
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
        ZStack {
            Image("initiationpacket")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(height:fr.height)
                .padding([.top],55)
            HStack {
                Spacer()
                AppTextH3(
                    "Initiation packet for \(receiver_name)",size: FontSize.footer3.sz)
                    .foregroundColor(Color.text1.opacity(0.50))
                Spacer()
            }
            .frame(width: fr.width)

        }
        .frame(width:fr.width,height:80)
        .background(Color.red2)
    }
    
}

//MARK: - table row


fileprivate struct UserRowView : View {
    
    var user: UserModel
    @State private var tuser: TwitterModel? = nil
    @EnvironmentObject var appService: AppService

    func componentDidMount(){
        appService.get_twitter_user(for: user){tuser in
            DispatchQueue.main.async {
                self.tuser = tuser
            }
        }
    }
    
    func navToUserProfile(){
        appService.get_twitter_user(with: user.userID){tuser,user in
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
        
        let fr = UIScreen.main.bounds;
        let w = fr.width;
        let h = CGFloat(80);
        let num_followers = tuser?.twitter_followers_count ?? 0;
        let num = Double(num_followers).kmFormatted
        let about = tuser?.about ?? (user.about)
        
        VStack {
            if user.isTrivial {
                HStack{}.frame(width:fr.width,height:h)
            } else {
                
                HStack {
                    AppTextH2(
                        (user.get_name()).uppercased(),
                        size: FontSize.footer2.sz
                    )
                    .foregroundColor( Color.text1 )
                    Spacer()
                    AppTextH3(
                        num_followers > 0 ? "\(num) followers" : "",
                        size: FontSize.footer2.sz*2/3
                    )
                    .foregroundColor( Color.text3 )
                    .padding([.trailing],5)
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
        .frame(width:w*2/3)
        .padding([.top],10)
        .onTapGesture {
            navToUserProfile()
        }
        .onAppear{
            componentDidMount()
        }

    }
    
    
}


//MARK: - preview

#if DEBUG
struct InitiationPacketView_Previewse: PreviewProvider {
    static var previews: some View {
        InitiationPacketView( data: nil )
            .environmentObject(AppService())
    }
}
#endif



