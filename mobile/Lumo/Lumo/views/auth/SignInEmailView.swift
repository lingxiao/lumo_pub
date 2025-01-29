//
//  SignInEmailView.swift
//  Lumo
//
//  Created by lingxiao on 10/7/22.
//



import Foundation
import SwiftUI


struct SignInEmailView : View {
        
    @EnvironmentObject var appService: AppService
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var viewModel : AlertViewModel
    @Environment(\.presentationMode) var presentationMode

    @State private var email    : String = ""
    @State private var password : String = ""
    @State private var btn_str  : String = "Sign In"
    @State private var btn_is_on: Bool = true
        
    @FocusState private var focusedField: FocusField?
    enum FocusField: Hashable {
      case field
    }
    
    func componentDidMount(){
        return;
    }
        
    // sign in w/ email
    func onSubmit(){
        if email == "" || password == "" {
            vibrateError()
        } else {
            btn_str = "one moment"
            btn_is_on = false;
            authService.auth_with_email(email: email, password: password){res in
                if ( res.success ){
                    viewModel.showSuccess( h1:"Done!")
                } else {
                    viewModel.showFail( h1:"Failed!", h2: res.message)
                    btn_is_on = true
                    btn_str = "try again"
                }
            }
        }
    }
    
    //MARK: - views

    var body: some View {

        let fr = UIScreen.main.bounds
        let padv = fr.height/12
        let padh = fr.width/10

        ZStack {
            
            VStack {
                
                // call to action texts
                AppTextBody("Initiate the burn".uppercased(), isLeading: false)
                    .foregroundColor(.text3)
                    .frame(width: fr.width-padh*2, alignment: .center)
                
                // cube table
                CubeTableViewB(
                    rows  : 15,
                    cols  : 15,
                    width : fr.width*2/3,
                    height: fr.width*2/3
                )
                .padding([.vertical],padv/2)
                
                VStack {
                    TextField("email", text: $email)
                        .foregroundColor(Color.text1)
                        .font(.custom("NeueMachina-Bold", size: FontSize.body.sz))
                        .focused($focusedField, equals: .field)
                    Divider()
                        .frame(height: 0.5)
                        .background(Color.surface1)
                }
                .frame(width: fr.width-50)
                .onAppear {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                        self.focusedField = .field
                    }
                }
                
                VStack {
                    TextField("password", text: $password)
                        .foregroundColor(Color.text1)
                        .font(.custom("NeueMachina-Bold", size: FontSize.body.sz))
                    Divider()
                        .frame(height: 0.5)
                        .background(Color.surface1)
                }
                .frame(width: fr.width-50)
                .padding([.vertical],35)
                
                MaterialUIButton(
                    label : btn_str.uppercased(),
                    width : fr.width*2/3,
                    isOn  : btn_is_on,
                    background: Color.red3.opacity(0.0),
                    color : Color.red3,
                    borderColor: Color.red3,
                    fontSize: FontSize.body.sz,
                    action: {
                        onSubmit()
                    })
            }

            
            AppHeader(name: "".uppercased(), color: Color.text2, goBack: {
                presentationMode.wrappedValue.dismiss()
            })
            .position(x: fr.width/2, y: HEADER_HEIGHT)

        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .background(Color.black)
        .onTapGesture {
            hideKeyboard()
        }
        .onAppear{
            componentDidMount()
        }
    }
    

}




//MARK: - preview

#if DEBUG
struct SignInEmailView_Previewse: PreviewProvider {
    static var previews: some View {
        SignInEmailView()
            .environmentObject(AppService())
    }
}
#endif

