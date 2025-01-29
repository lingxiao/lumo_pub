//
//  SignInTwitterView.swift
//  Lumo
//
//  Created by lingxiao on 9/18/22.
//



import Foundation
import Foundation
import SwiftUI
import CodeScanner
import AlertToast

 
struct SignInTwitterView : View {
    
    // read env. variables
    @EnvironmentObject var appService : AppService
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var viewModel  : AlertViewModel
    
    @State private var showbtn = true
    @State private var btnstr = "Sign in with Twitter"
    @State private var goToSignInEmail: Bool = false
        
    // @use: setup
    private func componentDidMount(){
        return;
    }
        
    var body: some View {
        
        let fr   = UIScreen.main.bounds
        let padv = fr.height/12
        let padh = fr.width/10
        
        ZStack {
            
            Image("fire1")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: fr.width*2, height: fr.height*2)
                .position(x:fr.width/2+20,y:fr.height/2)
            
            VStack() {
                
                Spacer();
                
                AppTextH1("LUMO", size: fr.width/6)
                    .foregroundColor(.red2)
                    .frame(width: fr.width, height: 50, alignment: .center)
                    .padding([.top],padv/2)
                
                AppTextH2("", size: FontSize.body.sz, isLeading: false)
                    .foregroundColor(.red2d)
                    .frame(width: fr.width-padh*2, alignment: .center)
                
                Image("acidbag")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width:fr.width*2)
                
                // action btn.
                MaterialUIButton(
                    label: btnstr,
                    width: fr.width*2/3,
                    isOn : showbtn,
                    background: Color.white.opacity(0.0),
                    action: {
                        showbtn = false
                        btnstr  = "Signing in..."
                        authService.auth_with_twitter(){(res) in
                            if ( res.success ){
                                viewModel.showSuccess( h1:"Done!")
                            } else {
                                viewModel.showFail( h1:"Failed!", h2: res.message)
                                showbtn = true
                                btnstr = "try again"
                            }
                        }
                    })
                
                AppTextFooter1("Sign in with email instead", size: FontSize.footer3.sz)
                    .foregroundColor(.text1.opacity(0.5))
                    .padding([.top],15)
                    .padding([.bottom],padv/2)
                    .onTapGesture {
                        self.goToSignInEmail = true
                    }
                
                Spacer()
                
            }
        }
        .frame(width: fr.width, height: fr.height)
        .background(.black)
        .navigate(
            to: SignInEmailView(),
            when: $goToSignInEmail
        )
        .onAppear{
            self.componentDidMount()
        }
    }
    
    @ViewBuilder private func RedCubeView() -> some View {
        
        let fr   = UIScreen.main.bounds
        let padv = fr.height/12
        let padh = fr.width/10
        
        VStack() {
            
            Spacer()
 
            // call to action texts
            AppTextH1("Initiate the burn on", size: FontSize.body.sz, isLeading: false)
                .foregroundColor(.surface1)
                .frame(width: fr.width-padh*2, alignment: .center)
                .padding([.top],padv)

            Image("lumoname")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: fr.width, height: 50, alignment: .center)
                .padding([.top],5)
            
            // cube table
            CubeTableViewB(
                rows: 15,
                cols: 15,
                width: fr.width*2/3,
                height: fr.width*2/3,
                color: Color.red2d,
                cube_color: Color.red1
            )
            .padding([.top],padv/2)

            // action btn.
            PillConvex(
                label: "Sign in with Twitter",
                color:Color.surface1,
                fontSize: FontSize.body.sz,
                disabled: .constant(false),
                action: {
            })
            .padding([.top],padv/3)

            Spacer()

        }
        .frame(width: fr.width, height: fr.height)
        .modifier(AppBurntPage())
        
    }

}


struct SignInTwitterView_Previews: PreviewProvider {
    static var previews: some View {
        SignInTwitterView()
            .environmentObject(AuthService())
            .environmentObject(AppService())
    }
}
