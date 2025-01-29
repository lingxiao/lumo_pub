//
//  DropMerchAlt.swift
//  Lumo
//
//  Created by lingxiao on 11/21/22.
//




import Foundation
import Foundation
import SwiftUI
import CodeScanner
import AlertToast

 
struct DropMerchAlt : View {
    
    // read env. variables
    @EnvironmentObject var appService : AppService
    @EnvironmentObject var viewModel  : AlertViewModel
    @Environment(\.presentationMode) var presentationMode
    
    public var burn: BurnModel?
    public var onDidDropMerch: () -> Void
    
    // field
    @State private var ticker  : String = "";
    @State private var editions: String = "";
    @State private var price   : String = "";
    @State private var btn     : String = "Upload merch image";
    @State private var btnIsOn : Bool = true;

    // upload image
    @State var profile_url: URL? = nil
    @State var picked_image: Image? = nil
    @State var showImagePicker : Bool = false
    @State private var showProfileImage: Bool = false

    
    @FocusState private var focusedField: FocusField?
    enum FocusField: Hashable {
        case ticker
        case price
        case editions
    }
    
    @State private var mode: UploadMode = .preimage
    enum UploadMode: Hashable {
        case preimage
        case postimage
    }
 
    // @use: setup
    private func componentDidMount(){
        return;
    }

    func onDropMerch(){
        if ticker.count != 3 {
            viewModel.showFail(h1: "Invalid ticker", h2: "Please provide a three letter ticker")
        } else if price.count == 0 || editions.count == 0 {
            viewModel.showFail(h1: "Invalid price/editions", h2: "Please provide valid price and editions");
        } else {
            if let img = picked_image {
                let uiimage = img.asUIImage()
                btnIsOn = false
                btn = "Dropping..."
                appService.drop_merch(
                    for: burn,
                    ticker: ticker,
                    price: price,
                    editions: editions,
                    image: uiimage){succ,msg,_ in
                        if !succ {
                            DispatchQueue.main.async {
                                viewModel.showFail(h1: "Oh no!",h2:msg)
                            }
                        } else {
                            DispatchQueue.main.async {
                                viewModel.showSuccess(h1: "Dropped!")
                                onDidDropMerch();
                                presentationMode.wrappedValue.dismiss();
                            }
                        }
                    }
            } else {
                viewModel.showFail(h1: "Oh no!",h2:"Please upload an image")
            }
        }
    }

        
    //MARK: - view
    
    var body: some View {
        
        let fr   = UIScreen.main.bounds
        let padv = fr.height/12
        let padh = fr.width/10
        let wd : CGFloat = fr.height*0.35

        ZStack {
            
            Image("cards-3")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .position(x:fr.width/6,y:fr.height+100)
            
            VStack() {
                
                Spacer()
                
                // call to action texts
                AppTextBody("Drop digital merch into community envelope:", isLeading: false)
                    .foregroundColor(.text3)
                    .frame(width: fr.width-padh*2, alignment: .center)
                    .padding([.bottom],45)

                VStack {
                    TextField("Ticker (3 letters)", text: $ticker)
                        .foregroundColor(Color.text1)
                        .focused($focusedField, equals: .ticker)
                        .font(.custom("NeueMachina-Bold", size: FontSize.body.sz))
                        .keyboardType(.default)
                        .onAppear {
                            DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                                self.focusedField = .ticker
                            }
                        }
                    Divider()
                        .frame(height: 0.5)
                        .background(Color.surface1)
                }
                .frame(width: fr.width/2, alignment: .center)

                VStack {
                    TextField("Price (USD)", text: $price)
                        .foregroundColor(Color.text1)
                        .font(.custom("NeueMachina-Bold", size: FontSize.body.sz))
                        .focused($focusedField, equals: .price)
                        .keyboardType(.decimalPad)
                    Divider()
                        .frame(height: 0.5)
                        .background(Color.surface1)
                }
                .frame(width: fr.width/2, alignment: .center)
                .padding([.top],20)
                
                VStack {
                    TextField("number of editions", text: $editions)
                        .foregroundColor(Color.text1)
                        .font(.custom("NeueMachina-Bold", size: FontSize.body.sz))
                        .focused($focusedField, equals: .editions)
                        .keyboardType(.numberPad)
                    Divider()
                        .frame(height: 0.5)
                        .background(Color.surface1)
                }
                .frame(width: fr.width/2, alignment: .center)
                .padding([.top],20)
                
                
                // cube table
                Group {
                    if let img = picked_image {
                        CubeTableViewC(
                            rows: 25,
                            cols: 25,
                            width: wd,
                            height: wd,
                            image: img,
                            color: Color.black.opacity(0.5),
                            bgColor: Color.offBlack2
                        )
                    } else {
                        CubeTableViewB(
                            rows  : 25,
                            cols  : 25,
                            width : wd,
                            height: wd,
                            color: Color.black.opacity(0.5)
                        )
                    }
                }
                .padding([.top],padv/3+5)
                .onTapGesture {
                    self.showImagePicker = true
                }
                
                // action btn.
                MaterialUIButton(
                    label: btn.uppercased(),
                    width: fr.width*2/3,
                    isOn : btnIsOn,
                    background: Color.offBlack1,
                    action: {
                        if mode == .preimage {
                            self.showImagePicker = true
                        } else if mode == .postimage {
                            onDropMerch()
                        }
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
        .background(Color.offBlack2)
        .modifier(WithSwipeToGoBack())
        // image picker
        .sheet(isPresented: $showImagePicker) {
            AppImagePickerNoCrop( sourceType: .photoLibrary) { image in
                self.showImagePicker = false
                self.picked_image = Image(uiImage: image)
                self.mode = .postimage
                self.btn  = "Drop this merch"
            }
        }
        .onTapGesture {
            hideKeyboard()
        }
        .onAppear{
            self.componentDidMount()
        }
    }
}


struct DropMerchAlt_Previews: PreviewProvider {
    static var previews: some View {
        DropMerchAlt(burn:nil, onDidDropMerch: {})
            .environmentObject(AppService())
    }
}
