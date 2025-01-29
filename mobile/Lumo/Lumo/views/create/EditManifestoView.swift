//
//  EditManifestoView.swift
//  Lumo
//
//  Created by lingxiao on 9/29/22.
//
// source: https://programmingwithswift.com/numbers-only-textfield-with-swiftui/
// source: https://stackoverflow.com/questions/58733003/how-to-create-textfield-that-only-accepts-numbers




import Foundation
import SwiftUI


struct EditManifestoView : View {
        
    @EnvironmentObject var appService: AppService
    @EnvironmentObject var viewModel : AlertViewModel
    @Environment(\.presentationMode) var presentationMode

    @Binding public var burn: BurnModel?
    var onDidEditManifesto: (_ burn: BurnModel?) -> Void
    var onDidCreateManifesto: (_ burn: BurnModel?) -> Void

    @State private var name: String = ""
    @State private var title: String = ""
    @State private var about: String = ""
    @State private var btn_str: String = ""
    @State private var btn_is_on: Bool = true
    
    
    @FocusState private var focusedField: FocusField?
    enum FocusField: Hashable {
      case field
    }
    
    func componentDidMount(){
        let user = appService.get_admin_user();
        name = user?.name ?? ""
        if let burn = burn {
            title = burn.name;
            about = burn.about;
            btn_str = "Edit"
        } else {
            btn_str = "Drop manifesto"
        }
    }
        
    func onSubmit(){
        let _about = rmvWhiteSpace(about)
        if _about == "" {
            viewModel.showFail(h1: "Oh no!", h2: "Please write the manifesto")
        } else if let burn = burn {
            btn_is_on = false
            btn_str = "One moment"
            hideKeyboard()
            appService.edit_manifesto(
                about: about,
                burn : burn
            ){(res) in
                if res.success {
                    presentationMode.wrappedValue.dismiss();
                    self.onDidEditManifesto(burn)
                } else {
                    viewModel.showFail(h1: "Oh no!", h2: res.message)
                    btn_is_on = true
                    btn_str = "try again"
                }
            }
        } else {
            btn_is_on = false
            btn_str="One moment"
            hideKeyboard()
            appService.post_manifesto(
                name: title,
                about: about
            ){(res, mburn) in
                if res.success && mburn != nil {
                    //viewModel.showSuccess(h1: "Published!", h2: "1 second while we redirect you")
                    presentationMode.wrappedValue.dismiss();
                    self.onDidCreateManifesto(mburn)
                } else {
                    viewModel.showFail(h1: "Oh no!", h2: res.message)
                    btn_is_on = true
                    btn_str = "try again"
                }
            }
        }
    }
    
    //MARK: - views

    var body: some View {

        let fr = UIScreen.main.bounds

        ZStack {
            
            Image("acidbagsmall")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(height:600)
                .position(x:fr.width/2, y:-HEADER_HEIGHT*2/3)

            /**Image("MATCHBOX")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(height:800)
                .rotationEffect(Angle(degrees: -90))
                .position(x:fr.width/2, y:HEADER_HEIGHT*2)*/

            VStack {

                TextEditor(text: $about)
                    .foregroundColor(Color.text1)
                    .background(Color.black.opacity(0.0))
                    .padding([.horizontal],10)
                    .font(.custom("NeueMachina-Regular", size: FontSize.body.sz))
                    .frame(width: fr.width-20, height: fr.height/3, alignment: .leading)
                    .ignoresSafeArea(.keyboard, edges: .bottom)
                    .focused($focusedField, equals: .field)
                    .lineSpacing(4)
                    .overlay(
                     RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.text1.opacity(0.25), lineWidth: 1)
                     )
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                            self.focusedField = .field
                        }
                    }
                    
                if burn == nil {
                    VStack {
                        TextField("Manifesto Name", text: $title)
                            .foregroundColor(Color.text1)
                            .font(.custom("NeueMachina-Bold", size: FontSize.body.sz))
                        Divider()
                            .frame(height: 0.5)
                            .background(Color.surface1)
                    }
                    .frame(width: fr.width-50)
                    .ignoresSafeArea(.keyboard, edges: .bottom)
                    .padding([.vertical],35)
                } else {
                    HStack {}.padding([.bottom],25)
                }
                

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
                
                Spacer()
            }
            .frame(width: fr.width, height: fr.height-HEADER_HEIGHT)
            .ignoresSafeArea(.keyboard, edges: .bottom)
            .position(x:fr.width/2, y:fr.height*2/3+25)//+75)
            AppHeader(name: "drop manifesto".uppercased(), color: Color.text2, goBack: {
                presentationMode.wrappedValue.dismiss()
            })
            .position(x: fr.width/2, y: HEADER_HEIGHT)

        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .background(Color.black)///surface1)
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
struct EditManifestoView_Previewse: PreviewProvider {
    static var previews: some View {
        EditManifestoView(
            burn: .constant((nil)),
            onDidEditManifesto: {_ in },
            onDidCreateManifesto: {_ in}
        )
            .environmentObject(AppService())
    }
}
#endif

