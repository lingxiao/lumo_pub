//
//  WalletView.swift
//  Lumo
//
//  Created by lingxiao on 9/25/22.
//  @Doc: https://www.appcoda.com/learnswiftui/swiftui-gridlayout.html
//

import Foundation
import SwiftUI



struct WalletView : View {
    
    @EnvironmentObject var appService: AppService
    @Environment(\.presentationMode) var presentationMode
    
    public var preview: Bool = false
    @State private var balance: CGFloat = 0
    @State private var showBtn: Bool = false

    // @use: load wallet from server
    func componentDidMount(){
        self.balance = appService.current_balance
        appService.off_chain_authed_balance_lumo(){b in
            self.balance = b
        }
    }
    

    // MARK: - view

    var body: some View {
        
        let fr = UIScreen.main.bounds
        let r : CGFloat = 35.0
        let num = Int(fr.width/r)
        let gridItemLayout : [GridItem] = [GridItem](repeating: GridItem(.flexible()), count: num)
        let num_tabs = preview ? Int(300) : Int(floor(balance));
        
        ZStack {            
            if num_tabs > 0 {
                ScrollView(.vertical, showsIndicators: false) {
                    LazyVGrid(columns: gridItemLayout, spacing:1){
                        ForEach((0...num_tabs), id: \.self){_ in
                            Image("acid1a")
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .frame(width: r, height: r, alignment: .center)
                        }
                    }
                }
                .frame(width: fr.width, height: fr.height-HEADER_HEIGHT*3/4)
                .position(x:fr.width/2,y:fr.height/2+HEADER_HEIGHT*3/4)
                .modifier(
                    num_tabs > 50
                    ?
                    AppPageFade(top: 0.25, bottom: 0.50)
                    :
                        AppPageFade(top: 0.25, bottom: 0.65)
                )
            }

            AppHeader(
                name: "My tabs".uppercased(),
                goBack: {
                    presentationMode.wrappedValue.dismiss()
            })
            .position(x: fr.width/2, y: HEADER_HEIGHT)
                
            if showBtn {
                HStack {
                    MaterialUIButton(
                        label : "buy burn tabs".uppercased(),
                        width : fr.width-80,
                        isOn  : true,
                        background: Color.red2,
                        color : Color.text1.opacity(0.75),
                        borderColor: Color.red2d,
                        fontSize   : FontSize.body.sz,
                        action: {
                            return;
                        })
                }
                .position(x:fr.width/2,y:fr.height-HEADER_HEIGHT*3/4-HEADER_HEIGHT)
            }

            VStack {
                Banner()
            }
            .background(Color.red2)
            .frame(width: fr.width,height:HEADER_HEIGHT*3/4)
            .position(x:fr.width/2,y:fr.height-HEADER_HEIGHT*3/4)

        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .background(.black)
        .edgesIgnoringSafeArea(.all)
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
                .padding([.top],45)
            HStack {
                Spacer()
                AppTextH4("Pay it forward, initiate others with your \(roundToThree(balance)) tabs", size: FontSize.footer3.sz)
                    .foregroundColor(Color.text1.opacity(0.50))
                Spacer()
            }
            .padding([.bottom],10)
            .frame(width: fr.width)

        }
        .frame(width:fr.width,height:80)
        .background(Color.red2)
    }
}


//MARK: - preview

#if DEBUG
struct WalletView_Previewse: PreviewProvider {
    static var previews: some View {
        WalletView(preview:true)
            .environmentObject(AppService())
    }
}

#endif
