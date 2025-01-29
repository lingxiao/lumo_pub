//
//  NewManifestoView.swift
//  Lumo
//
//  Created by lingxiao on 9/26/22.
//



import Foundation
import SwiftUI


struct NewManifestoView : View {
        
    @Environment(\.presentationMode) var presentationMode
    @EnvironmentObject var appService: AppService
    
    @State private var name: String = ""
    @State private var title: String = ""
    @State private var about: String = ""
    @State var showModal = false
        
    // navigate to new manifesto
    @State private var newBurnData: BurnModel? = nil
    @State private var goToBurn = false


    init() {
        UITextView.appearance().backgroundColor = .clear
    }

    func componentDidMount(){
        let user = appService.get_admin_user();
        name = user?.name ?? ""
    }
            
    
    /// on create new burn navigateo to it
    /// - Parameter burn: new burn model
    func onDidCreateManifesto(at burn: BurnModel?){
        self.newBurnData = burn
        self.goToBurn = true;
    }
    
    //MARK: - views

    var body: some View {

        let fr = UIScreen.main.bounds
        let wd = fr.width-40;

        ZStack {

            ScrollView {
                    
                InstructionRowTop("Drop a manifesto", "Start a movement", wd)
                    .padding([.bottom],20);
            
                InstructionRow("Drop a manifesto".uppercased(), wd);
                InstructionRow("Start a movement".uppercased(), wd);
                InstructionRow("and earn 5 tabs".uppercased(), wd);
                InstructionRow("".uppercased(), wd);

                VStack {
                    HStack {
                        Bag()
                        Bag()
                        Bag()
                    }
                    HStack {
                        Bag()
                        Bag()
                    }
                }
                .frame(width: fr.width*1.5,height:fr.height*0.4)
                .padding([.vertical,],20)
                .background(.black)

                MaterialUIButton(
                    label : "drop a manifesto".uppercased(),
                    width : fr.width*2/3,
                    isOn  : true,
                    background: Color.white.opacity(0.0),
                    color : Color.surface1.opacity(0.75),
                    borderColor: Color.surface1.opacity(0.75),
                    fontSize: FontSize.body.sz,
                    action: {
                        self.showModal = true
                    })
                    .padding([.top],10)

                AuthenticFooter(
                    h1: "Certificate of authentic manifesto",
                    flu: "You will be published a manifesto",
                    fld: "and earning 5 tabs",
                    fru: "Author:",
                    frd: "\(name)",
                    width: wd
                )
                    .padding([.bottom, .top],20)
                
                Spacer()

            }
            .frame(width: fr.width, height: fr.height-HEADER_HEIGHT)
            .padding([.top],HEADER_HEIGHT)
            AppHeader(name: "drop manifesto".uppercased(), goBack: {
                presentationMode.wrappedValue.dismiss()
            })
            .position(x: fr.width/2, y: HEADER_HEIGHT)

        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .modifier(AppBurntPageAlt())
        .sheet(isPresented: $showModal, content: {
            EditManifestoView(
                burn:.constant(nil),
                onDidEditManifesto: {_ in },
                onDidCreateManifesto: onDidCreateManifesto                
            )
        })
        .navigate(
            to: BurnView(isHome:false, burn: .constant(newBurnData)),
            when: $goToBurn
        )
        .modifier(WithSwipeToGoBack())
        .onAppear{
            componentDidMount()
        }
    }
    

    @ViewBuilder private func InstructionRowTop(_ xs : String, _ ys: String, _ wd: CGFloat ) -> some View {
        HStack {
            AppTextBody(xs, size: FontSize.footer2.sz*2/3, isLeading: true)
                .foregroundColor(Color.text2)
            Spacer()
            AppTextBody(ys, size: FontSize.footer2.sz*2/3, isLeading: true)
                .foregroundColor(Color.text2)
        }
        .overlay(
            Line()
                .padding([.top],25)
        )
        .frame(width: wd, alignment: .leading)
        .padding([.top, .leading,.trailing],20)
    }

    @ViewBuilder private func InstructionRow(_ xs : String, _ wd: CGFloat ) -> some View {
        HStack {
            AppTextH2(xs, size: FontSize.h4.sz, isLeading: true)
                .foregroundColor(Color.surface1)
        }
        .frame(width: wd, alignment: .leading)
        .overlay(Line().padding([.top, .leading, .trailing],25))
        .padding([.top],5)
    }
    
    @ViewBuilder private func Line() -> some View {
        let fr = UIScreen.main.bounds
        Divider()
            .frame(width: fr.width-40, height: 1)
            .padding( [.leading, .trailing], 20 )
            .background(Color.surface1)
    }
    
    @ViewBuilder private func Bag() -> some View {
        let fr = UIScreen.main.bounds
        Image("acidbagsmall")
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(height:fr.height/5)
    }
    
    @ViewBuilder private func InputBlock() -> some View {
        let fr = UIScreen.main.bounds
        VStack {
            VStack {
                TextField("Title", text: $title)
                    .foregroundColor(Color.text1)
                    .font(.custom("NeueMachina-Bold", size: FontSize.body.sz))
                Divider()
                    .frame(height: 0.5)
                    .background(Color.surface1)
            }
            .frame(width: fr.width-40)
            .padding([.top],15)
            
            TextEditor(text: $about)
                .background(Color.black)
                .foregroundColor(Color.text1)
                .padding([.horizontal],10)
                .font(.custom("NeueMachina-Regular", size: FontSize.body.sz))
                .frame(width: fr.width-20, alignment: .leading)
            
        }
        .frame(width: fr.width*1.5,height:fr.height*0.4)
        .padding([.vertical,],20)
        .background(.black)
    }

    
}




//MARK: - preview

#if DEBUG
struct NewManifestoView_Previewse: PreviewProvider {
    static var previews: some View {
        NewManifestoView()
            .environmentObject(AppService())
    }
}
#endif

