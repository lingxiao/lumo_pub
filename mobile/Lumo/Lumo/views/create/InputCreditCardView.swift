//
//  InputCreditCardView.swift
//  Lumo
//
//  Created by lingxiao on 10/10/22.
//
// @source: https://gist.github.com/azamsharp/60afd306d09d87a3ea05d82a513cb1ec




import Foundation
import SwiftUI


struct InputCreditCardView : View {
        
    @EnvironmentObject var appService: AppService
    @EnvironmentObject var viewModel : AlertViewModel
    @Environment(\.presentationMode) var presentationMode

    var onDidSaveCreditCard: (_ did: Bool) -> Void

    @State private var degrees: Double = 0
    @State private var flipped: Bool = false
    
    @State private var name: String    = ""
    @State private var number: String  = ""
    @State private var exp_mo: String  = ""
    @State private var exp_yr: String  = ""
    @State private var cvv: String     = ""

    @State private var btn_str: String = "Save"
    @State private var btn_is_on: Bool = true
    
    func componentDidMount(){
        let user = appService.get_admin_user();
        name = user?.name ?? ""
    }
        
    func onSubmit(){
        let iexp_mo = Int(exp_mo) ?? 0;
        let iexp_yr = Int(exp_yr) ?? 0;
        if iexp_mo == 0 || iexp_mo > 12 {
            vibrateError()
            exp_mo = ""
        } else if iexp_yr == 0
                    || (exp_yr.count != 4 && exp_yr.count != 2)
                    || (exp_yr.count == 4 && iexp_yr < 2022)
                    || (exp_yr.count == 2 && iexp_yr < 22
        ) {
            vibrateError()
            exp_yr = ""
        } else if cvv.count != 3 {
            vibrateError()
            cvv = ""
        } else {
            btn_is_on = false
            btn_str = "Saving..."
            appService.create_user_stripe_account(
                number: number,
                exp_mo: exp_mo,
                exp_yr: exp_yr,
                cvc: cvv){res in
                    self.btn_is_on = false
                    if res.success == false {
                        self.btn_is_on = true
                        self.btn_str = "Try again";
                        viewModel.showFail(h1: "Oh no!", h2: res.message)
                    } else {
                        self.onDidSaveCreditCard(true);
                    }
                }
        }
    }
    
    //MARK: - views

    var body: some View {

        let fr = UIScreen.main.bounds

        ZStack {
            
            VStack {
                CreditCard {
                    VStack {
                        Group {
                            if flipped {
                                CreditCardBack(cvv: cvv)
                            } else {
                                CreditCardFront(
                                    name   : name,
                                    number : number.split(by: 4).joined(separator: " "),
                                    expires: "\(exp_mo)/\(exp_yr)"
                                )
                            }
                        }
                    }.rotation3DEffect(
                        .degrees(degrees),
                        axis: (x: 0.0, y: 1.0, z: 0.0)
                    )
                }
                .onTapGesture {
                    withAnimation {
                        degrees += 180
                        flipped.toggle()
                    }
                }
                
                TextField("Name", text: $name)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding([.top,.leading,.trailing])
                    .foregroundColor(Color.text1)
                    .font(.custom("NeueMachina-Medium", size: FontSize.body.sz))
                    .background(Color.surface1)

                TextField("Card number", text: $number)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .keyboardType(.numberPad)
                    .padding([.top,.leading,.trailing])
                    .foregroundColor(Color.text1)
                    .font(.custom("NeueMachina-Medium", size: FontSize.body.sz))
                    .background(Color.surface1)

                    
                HStack {
                    TextField("Exp Mon", text: $exp_mo)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .keyboardType(.numberPad)
                        .padding([.leading])
                        .foregroundColor(Color.text1)
                        .font(.custom("NeueMachina-Medium", size: FontSize.body.sz))
                    TextField("Exp Yr", text: $exp_yr)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .keyboardType(.numberPad)
                        .foregroundColor(Color.text1)
                        .font(.custom("NeueMachina-Medium", size: FontSize.body.sz))
                    TextField("CVV", text: $cvv) { (editingChanged) in
                        withAnimation {
                            degrees += 180
                            flipped.toggle()
                        }
                    } onCommit: {}
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .keyboardType(.numberPad)
                        .padding([.trailing])
                        .foregroundColor(Color.text1)
                        .font(.custom("NeueMachina-Medium", size: FontSize.body.sz))
                }
                .padding([.bottom],24)

                
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

            
            AppHeader(name: "Save Payment".uppercased(), color: Color.text2, goBack: {
                presentationMode.wrappedValue.dismiss()
            })
            .position(x: fr.width/2, y: HEADER_HEIGHT)

        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .background(Color.surface1)
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
struct InputCreditCardViewPreviewse: PreviewProvider {
    static var previews: some View {
        InputCreditCardView(
            onDidSaveCreditCard: { _ in }
        )
            .environmentObject(AppService())
    }
}
#endif

