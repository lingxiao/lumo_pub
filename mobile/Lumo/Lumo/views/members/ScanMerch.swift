//
//  ScanMerch.swift
//  Lumo
//
//  Created by lingxiao on 11/14/22.
//
//  Created by lingxiao on 8/14/22.
//  @Doc: https://github.com/twostraws/CodeScanner
//  @Doc: https://www.hackingwithswift.com/books/ios-swiftui/scanning-qr-codes-with-swiftui
//


import Foundation
import Foundation
import SwiftUI
import CodeScanner
import AlertToast

 
struct ScanMerch : View {
    
    // read env. variables
    @EnvironmentObject var appService : AppService
    @EnvironmentObject var viewModel  : AlertViewModel
    @Environment(\.presentationMode) var presentationMode

    // qr scanner modal
    @State private var isPresentingScanner = false
    @State private var img_url: String? = nil;
    @State private var h1: String = "proof of ownership with"
    @State private var h2: String = "lumo"

    // @use: setup
    private func componentDidMount(){
        return;
    }
        
    var body: some View {
        
        let fr   = UIScreen.main.bounds
        let padv = fr.height/12
        let padh = fr.width/10
        
        ZStack {
            
            // moif
            Image("cards-3")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .rotationEffect(Angle(degrees: -25))
                .position(x:-80,y:-95)///4-25)

            Image("cards-3")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .rotationEffect(Angle(degrees: -35))
                .position(x:fr.width*1.3,y:fr.height)

            VStack() {
                Spacer()
                
                // call to action texts
                AppTextBody(h1.uppercased(), isLeading: false)
                    .foregroundColor(.text3)
                    .frame(width: fr.width-padh*2, alignment: .center)

                AppTextH1(h2.uppercased(), size: fr.width/8)
                    .frame(width: fr.width, height: 50, alignment: .center)
                    .foregroundColor(.text1)
                    .padding([.top],20)
                
                /// 1_2d196784-6009-4555-8061-6bc6cecee134_0x517aBf0fA42836755D3f3b089564Ad793a57baE0_1669041937

                // cube table
                Group {
                    if let url = self.img_url {
                        CubeTableViewD(
                            rows  : 20,
                            cols  : 20,
                            width : fr.width*3/4,
                            height: fr.width*3/4,
                            url: url,
                            color: Color.surface2,
                            bgColor: Color.offBlack1
                        )
                    } else {
                        CubeTableViewB(
                            rows  : 20,
                            cols  : 20,
                            width : fr.width*3/4,
                            height: fr.width*3/4,
                            color: Color.surface2
                        )
                    }
                }
                .padding([.top],padv/3+5)
                .onTapGesture {
                    isPresentingScanner = true
                }
                
                // action btn.
                MaterialUIButton(
                    label: "Scan QR code to verify",
                    width: fr.width*2/3,
                    isOn : true,
                    background: Color.offBlack1,
                    action: {
                        self.img_url = nil;
                        self.h1 = "proof of ownership with"
                        self.h2 = "lumo"
                        isPresentingScanner = true
                    })
                .padding([.top],padv/2)
                
                Spacer()
                
            }
            AppHeader(
              name: "",
              goBack: {
                  presentationMode.wrappedValue.dismiss()
              })
              .position(x: fr.width/2, y: HEADER_HEIGHT)
        }
        .frame(width: fr.width, height: fr.height)
        .background(Color.offBlack1)
        .modifier(WithSwipeToGoBack())
        .sheet(isPresented: $isPresentingScanner) {
            CodeScannerView(codeTypes: [.qr]) { response in
                if case let .success(result) = response {
                    appService.read_token_qr_code(for: result.string){succ,msg,verified, url in
                        isPresentingScanner = false
                        if ( succ ){
                            self.img_url = url;
                            self.h1 = "ownership is"
                            self.h2 = "verified"
                        } else {
                            self.img_url = nil
                            self.h1 = "ownership is"
                            self.h2 = "unverified"
                        }
                    }
                } else {
                    viewModel.showComplete(h1: "Network error!")
                }
            }
        }
        .onAppear{
            self.componentDidMount()
        }
    }
}


struct ScanMerch_Previews: PreviewProvider {
    static var previews: some View {
        ScanMerch()
            .environmentObject(AppService())
    }
}
