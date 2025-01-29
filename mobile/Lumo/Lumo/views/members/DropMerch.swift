//
//  DropMerch.swift
//  Lumo
//
//  Created by lingxiao on 11/20/22.
//



import Foundation
import Foundation
import SwiftUI
import CodeScanner
import AlertToast

 
struct DropMerch : View {
    
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
    @State private var btnIsOn : Bool   = true;

    // upload image
    @State var picked_image: Image? = nil
    @State var showImagePicker : Bool = false
    
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
        let b = onValidateInputs();
        if b {
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
                            self.picked_image = nil;
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
    
    private func onValidateInputs() -> Bool {
        if ticker.count != 3 {
            viewModel.showFail(h1: "Invalid ticker", h2: "Please provide a three letter ticker")
            self.picked_image = nil;
            self.focusedField = .ticker;
            return false;
        } else if price.count == 0 || price == "0" {
            viewModel.showFail(h1: "Invalid price", h2: "Please provide valid price");
            self.picked_image = nil;
            self.focusedField = .price;
            return false;
       } else if editions.count == 0 || editions == "0" {
            viewModel.showFail(h1: "Invalid editions", h2: "Please provide valid # of editions");
            self.picked_image = nil;
            self.focusedField = .editions;
            return false;
        } else {
            return true;
        }
    }

        
    //MARK: - view
    
    var body: some View {
        
        let fr   = UIScreen.main.bounds
        let ht   = fr.height*3/4

        ZStack {

            ///img motif
            Image("cards-3")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(height:fr.height*1.5)
                .position(x:fr.width/2, y:fr.height*0.6);
            
            // card
            Group {
                if let img = picked_image {
                    ZStack {
                        img
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: fr.width-2*20, height: ht)
                            .onTapGesture {
                                if btnIsOn {
                                    self.showImagePicker = true;
                                }
                            }
                        VStack {
                            Spacer()
                            MaterialUIButton(
                                label: btn.uppercased(),
                                width: fr.width*2/3,
                                isOn : btnIsOn,
                                background: Color.offBlack1,
                                action: {
                                    onDropMerch()
                                })
                            .padding([.bottom],25)
                        }
                    }
                    .frame(width: fr.width-2*20, height: ht, alignment: .center)
                    .background(Color.offBlack1)
                    .modifier(AppCardCorners())
                } else {
                    MetadataView();
                }
            }.padding([.top],25)
                
            // header
            AppHeader(
              name: "".uppercased(),
              goBack: {
                  presentationMode.wrappedValue.dismiss()
              })
              .position(x: fr.width/2, y: HEADER_HEIGHT)
            
            if !btnIsOn {
                VStack {
                    AppTextFooter1(
                        "dropping".uppercased(),
                        size: FontSize.footer3.sz,
                        isLeading: true
                    )
                    .foregroundColor(.text1)
                    .padding([.bottom],5)
                    ProgressView();
                }
                .frame(width:fr.width/3,height:fr.width/3)
                .background(Color.offBlack1)
                .cornerRadius(20)
                .position(x:fr.width/2,y:fr.height/2)
            }

        }
        .frame(width: fr.width, height: fr.height)
        .background(Color.offBlack1)
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
    
    // metadata for card view
    @ViewBuilder private func MetadataView() -> some View {

        let fr   = UIScreen.main.bounds
        let padh = CGFloat(20);
        let w    = fr.width - 2*padh
        
        VStack {
            // header
            HStack {
                AppTextFooter1(
                    "drop merch into community envelope".uppercased(),
                    size: FontSize.footer3.sz,
                    isLeading: true
                )
                .foregroundColor(.text1.opacity(0.5))
            }
            .padding([.top],10)
            .padding([.horizontal],15)
            .frame(width:w,height: 35, alignment: .leading)
            .modifier(AppBorderBottom())
            
            // main title
            HStack {
                TextField("Ticker (3 letters)", text: $ticker)
                    .foregroundColor(Color.text1)
                    .focused($focusedField, equals: .ticker)
                    .font(.custom("NeueMachina-Bold", size: FontSize.h3.sz))
                    .keyboardType(.default)
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                            self.focusedField = .ticker
                        }
                    }
                    .onSubmit{
                        self.focusedField = .price;
                    }
            }
            .padding([.all],15)
            .frame(width: w, alignment: .leading)
            .modifier(AppBorderBottom())
            
            // price
            HStack {
                AppTextBody("Price (USD):", size: FontSize.body.sz, isLeading: true)
                    .foregroundColor(.text1)
                Spacer()
                TextField("USD", text: $price)
                    .foregroundColor(Color.text1)
                    .font(.custom("NeueMachina-Bold", size: FontSize.body.sz))
                    .focused($focusedField, equals: .price)
                    .keyboardType(.decimalPad)
                    .frame(width:fr.width/4)
            }
            .padding([.horizontal], 20)
            .padding([.vertical],5)
            .frame( width: w, alignment: .leading)
            .modifier(AppBorderBottom())

            // editions
            HStack {
                AppTextBody("number of editions:", size: FontSize.body.sz, isLeading: true)
                    .foregroundColor(.text1)
                Spacer()
                TextField("#", text: $editions)
                    .foregroundColor(Color.text1)
                    .font(.custom("NeueMachina-Bold", size: FontSize.body.sz))
                    .focused($focusedField, equals: .editions)
                    .keyboardType(.decimalPad)
                    .frame(width:fr.width/4)
            }
            .padding([.horizontal], 20)
            .padding([.vertical],5)
            .frame( width: w, alignment: .leading)
            .modifier(AppBorderBottom())
            
            Spacer();
            
            // action btn.
            MaterialUIButton(
                label: btn.uppercased(),
                width: fr.width*2/3,
                isOn : btnIsOn,
                background: Color.offBlack1,
                action: {
                    let b = onValidateInputs();
                    if b {
                        self.showImagePicker = true
                    }
                })
            .padding([.bottom],25)

        }
        .frame(width: w, height: fr.height*3/4, alignment: .center)
        .background(Color.surface1)
        .modifier(AppCardCorners())
        
    }

}


struct DropMerch_Previews: PreviewProvider {
    static var previews: some View {
        DropMerch(burn:nil, onDidDropMerch: {})
            .environmentObject(AppService())
    }
}
