//
//  ContentView.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//



import Foundation
import SwiftUI
import AlertToast

//MARK: - main content view

fileprivate var offsetY : CGFloat = 50;

struct ContentView: View {
    
    // read env. variables
    @EnvironmentObject var appService : AppService;
    @EnvironmentObject var authService: AuthService;
    @EnvironmentObject var viewModel  : AlertViewModel;
    
    /// when navigating here after `didAuth`, do not navigate back
    /// to the `AcceptNominationView`
    @State public var didAuth: Bool
    
    // loading state
    @State private var isLoading: Bool = true;
    @State private var authed_with_acct: Bool = false;
    
    // view state
    @State private var current_burn: BurnModel? = nil
    @State private var heroViewOffset: CGFloat? = nil
    @State private var hasHeroBurn: Bool = false

    @State private var hideBurnViewOverlay: Bool = false
    @State private var goToBurnView: Bool = false
        
    // @use: listen for authed user and show either
    //       the signinview or the main app view
    private func componentDidMount(){
        ///let _ = authService.signOut();
        authService.listenForAuthedUser(){ (has_account, uuid) in
            self.authed_with_acct = has_account;
            if has_account {
                appService.sync(at: uuid){
                    self.isLoading = false;
                    appService.fetch_hero_burn(have_backup: true){mburn in
                        if let burn = mburn {
                            self.hasHeroBurn = true
                            appService.setCurrentBurn(to: mburn);
                            self.current_burn = burn;
                        } else {
                            self.hasHeroBurn = false
                            self.current_burn = nil;
                        }
                    }
                }
            } else {
                self.isLoading = false;
            }
        }
    }

    
    /// animate div down to go back home
    func goBackFromHero( _ burn: BurnModel? ) -> Void {
        self.current_burn = nil;
        if !hideBurnViewOverlay {
            let fr = UIScreen.main.bounds
            withAnimation {
                self.heroViewOffset = fr.height*2;
            }
        }
    }
    
    func onNavToBurn(_ burn: BurnModel?) -> Void {
        self.current_burn = burn;
        /**let fr = UIScreen.main.bounds
        withAnimation {
            self.heroViewOffset = fr.height/2 - offsetY;
        }*/
        self.goToBurnView = true;
    }
    
    var body: some View {
        
        let fr = UIScreen.main.bounds
        let w  = fr.width
        let h  = fr.height

        Group {
            if isLoading {
                VStack {
                    Image("lumoCube1")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(height:fr.height, alignment: .center)
                }
                .frame(width: w, height: h)
                .background(Color.offBlack1)
            } else if authed_with_acct {
                if authService.openedWithoutAuth && !didAuth {
                    OnboardView();
                } else {
                    /// home view
                    ZStack {
                        ManifestosView(onNavToBurn: onNavToBurn)
                        if !hideBurnViewOverlay {
                            BurnView(
                                isHome:true,
                                burn: $current_burn,
                                goBackFromHero: goBackFromHero
                            )
                            .frame(width:fr.width,height:fr.height)
                            .background(Color.red3)
                            .cornerRadius(10, corners:[.topLeft,.topRight])
                            .position(
                                x: fr.width/2,
                                y: heroViewOffset == nil
                                ? ( hasHeroBurn ? fr.height/2 - offsetY : fr.height*2)
                                : heroViewOffset!
                            )
                            .transition(AnyTransition.move(edge: .top))
                        }

                    }
                }
            } else {
                SignInTwitterView()
            }
        }
        .onAppear{
            componentDidMount()
        }
        .navigate(
            to: BurnView(
                isHome: false,
                burn: $current_burn,
                goBackFromHero: goBackFromHero
                ),
            when: $goToBurnView
        )
        // show alert toast across all views
        .toast(isPresenting: $viewModel.show, duration: 5){
            viewModel.alertToast
        }
    }
}



//MARK: - preview

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView(didAuth:true)
            .environmentObject(AppService())
            .environmentObject(AlertViewModel())
            .environmentObject(AuthService())

    }
}
