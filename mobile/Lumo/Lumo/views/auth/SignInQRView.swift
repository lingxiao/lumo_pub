//
//  SignInView.swift
//  parc
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

 
struct SignInQRView : View {
    
    // read env. variables
    @EnvironmentObject var appService : AppService
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var viewModel  : AlertViewModel

    // qr scanner modal
    @State private var isPresentingScanner = false

    // toast msg
    @State private var showToast: Bool = false
    @State private var toastMessage: String = ""
        
    // @use: setup
    private func componentDidMount(){
        return;
    }
        
    var body: some View {
        
        let fr   = UIScreen.main.bounds
        let padv = fr.height/12
        let padh = fr.width/10

        VStack() {
            
            Spacer()
            
            /*/ app name.
            AppTextH1("LUMO", size: FontSize.h3.sz)
                .foregroundColor(.red2)
                .frame(width: fr.width-padh*2, height: 50, alignment: .leading)
                .padding([.top],padv)
            */
            
            // call to action texts
            AppTextBody("Initiate the burn on", isLeading: false)
                .foregroundColor(.text3)
                .frame(width: fr.width-padh*2, alignment: .center)
                //.padding([.top],padv)
            
            AppTextH1("LUMO", size: fr.width/6)
                .foregroundColor(.text1)
                .frame(width: fr.width, height: 50, alignment: .center)
                .padding([.top],padv/2)
            
            // cube table
            CubeTableViewC(
                rows  : 15,
                cols  : 15,
                width : fr.width*2/3,
                height: fr.width*2/3,
                image : Image("qrcode")
            )
            .padding([.top],padv/2)
            .onTapGesture {
                isPresentingScanner = true
            }

            // action btn.
            MaterialUIButton(
                label: "Scan QR code to login",
                width: fr.width*2/3,
                isOn : true,
                action: {
                    isPresentingScanner = true
                })
                .padding([.top],padv/2)

            Spacer()
            
        }
        .frame(width: fr.width, height: fr.height)
        .background(Color.surface1)
        .sheet(isPresented: $isPresentingScanner) {
            CodeScannerView(codeTypes: [.qr]) { response in

                if case let .success(result) = response {
                    isPresentingScanner = false
                    authService.auth_with_QR_code_seed(qr_seed: result.string){(res) in
                        if ( res.success ){
                            viewModel.showSuccess( h1:"Done!")
                        } else {
                            viewModel.showFail( h1:"Failed!", h2: res.message)
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


struct SignInQRView_Previews: PreviewProvider {
    static var previews: some View {
        SignInQRView()
            .environmentObject(AuthService())
            .environmentObject(AppService())
    }
}
