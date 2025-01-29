//
//  ProfileView.swift
//  Lumo
//
//  Created by lingxiao on 11/14/22.
//




import Foundation
import Foundation
import SwiftUI
import CodeScanner
import AlertToast

 
struct ProfileView : View {
    
    // read env. variables
    @EnvironmentObject var appService : AppService
    @EnvironmentObject var viewModel  : AlertViewModel
    @Environment(\.presentationMode) var presentationMode

    @State private var user: UserModel? = nil

    // upload image
    @State var profile_url: URL? = nil
    @State var picked_image: Image? = nil
    @State var showImagePicker : Bool = false
    @State private var showProfileImage: Bool = false

        
    // @use: setup
    private func componentDidMount(){
        user = appService.get_admin_user()
    }
    
    func onUseThisPicture(){
        if let img = picked_image {
            let uiimage = img.asUIImage()
            appService.updateAuthedUserPofileImage(to: uiimage)
            viewModel.showSuccess( h1: "saved", h2: "" )
        }
    }
    
    //MARK: - view
        
    var body: some View {
        
        let fr   = UIScreen.main.bounds
        let padv = fr.height/12
        let wd : CGFloat = fr.height*0.4
        
        ZStack {
                
            // motif
            Image("cubeLogo2")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .rotationEffect(Angle(degrees: 25))
                .position(x:fr.width*1.2,y:fr.height/4-25)

            Image("cubeLogo2")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .rotationEffect(Angle(degrees: 45))
                .position(x:100,y:fr.height*0.92)

            VStack() {
                
                Spacer()
                
                // call to action texts
                HStack {
                    Spacer()
                    AppTextBody("The profile of")
                        .foregroundColor(.text3)
                    Spacer()
                }
                
                AppTextH1( user?.get_name() ?? "", size: FontSize.h3.sz)
                    .foregroundColor(.text1)
                    .frame(width: fr.width, height: 50, alignment: .center)
                    .padding([.top],padv/2)
                
                // profile image
                if let img = picked_image {
                    CubeTableViewC(
                        rows: 25,
                        cols: 25,
                        width: wd,
                        height: wd,
                        image: img,
                        color: Color.black,
                        bgColor: Color.offBlack1
                    )
                   .padding([.top,],15)
                } else if let url = user?.image_url {
                    CubeTableViewD(
                        rows: 20,
                        cols: 20,
                        width: wd,
                        height: wd,
                        url: url,
                        color: Color.black,
                        bgColor: Color.offBlack1
                    )
                   .padding([.top,],15)
                } else {
                    HStack{}
                        .frame(width: wd,height:wd)
                        .padding([.top,],15)
                }                

                // action btn.
                MaterialUIButton(
                    label: "Change profile picture",
                    width: fr.width*2/3,
                    isOn : true,
                    background: Color.offBlack1,
                    action: {
                        showImagePicker = true
                    })
                .padding([.top],padv/2)
                
                Spacer()
                
            }
            AppHeader(
              name: "".uppercased(),
              goBack: {
                  presentationMode.wrappedValue.dismiss()
              })
              .position(x: fr.width/2, y: HEADER_HEIGHT)
        }
        .frame(width: fr.width, height: fr.height)
        .background(Color.offBlack1)
        .modifier(WithSwipeToGoBack())
        // image picker
        .sheet(isPresented: $showImagePicker) {
            AppImagePicker(sourceType: .photoLibrary) { image in
                self.showImagePicker = false
                self.picked_image = Image(uiImage: image)
                onUseThisPicture()
            }
        }
        .onAppear{
            self.componentDidMount()
        }
    }
}


struct ProfileView_Previews: PreviewProvider {
    static var previews: some View {
        ProfileView()
            .environmentObject(AppService())
    }
}
