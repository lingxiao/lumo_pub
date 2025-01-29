//
//  MerchCard.swift
//  Lumo
//
//  Created by lingxiao on 11/6/22.
//


import Foundation
import SwiftUI

//MARK: - view small

struct MerchCardSimple : View {
    
    // env.
    @EnvironmentObject var appService: AppService
    @EnvironmentObject var viewModel : AlertViewModel
    
    // style
    var wd: CGFloat
    var ht: CGFloat
    
    // exter data
    public var contract: ContractModel? = nil
    public var tok: NonfungibleTok? = nil
    public var goToTok: () -> Void
    
    // @use: load user image
    func componentDidMount(){
        return;
    }
    
    private func _image() -> String? {
        if let c = contract {
            return c.image_url
        } else if let t = tok {
            return t.image_url
        } else {
            return nil;
        }
    }
    
    var body: some View {
        
        ZStack {

            if let _url = self._image() {
                AsyncMediaPlayer(
                    url: _url,
                    width: wd*1.5,
                    height: ht
                )
            } else {
                VStack {
                    Spacer()
                    AppTextH3(":(")
                        .foregroundColor(.text3)
                    Spacer()
                }
            }
        }
        .frame(width: wd, height: ht, alignment: .center)
        .background(Color.offBlack1)
        .onAppear{
            componentDidMount()
        }
        .onTapGesture {
            goToTok()
        }
        .border(Color.surface2, width: 2)
        .modifier(AppCardCorners())
    }
}


//MARK: - view big

struct MerchCard : View {
    
    // env.
    @EnvironmentObject var appService: AppService
    @EnvironmentObject var viewModel : AlertViewModel
    
    // style
    var padh : CGFloat
    var padv : CGFloat
    
    // exter data
    public var contract: ContractModel? = nil
    public var tok: NonfungibleTok? = nil
    public var onDidBuyItem: () -> Void
    
    @State private var showMeta: Bool = false
    @State private var buy_btn: String = "Buy now"
    @State private var btnIsOn: Bool = true
    @State private var showCardScanner: Bool = false;
    @State private var seed: String = ""
 
    // @use: load user image
    func componentDidMount(){
        return;
    }
    
    private func _image() -> String? {
        if let c = contract {
            return c.image_url
        } else if let t = tok {
            return t.image_url
        } else {
            return nil;
        }
    }
    
    private func _date() -> String {
        return ""
    }
    
    private func _name() -> String {
        if let c = contract {
            return c.symbol
        } else {
            return tok?.title ?? ""
        }
    }
    
    private func _price() -> String {
        if let c = contract {
            return "$\(c.price_in_usd())"
        } else if let c = tok?.get_contract(from: appService) {
            return "$\(c.price_in_usd())"
        } else {
            return ""
        }
    }
    
    private func _about() -> String {
        if let c = contract {
            return c.about
        } else {
            return tok?.about ?? ""
        }
    }
        
    // @use: buy item
    private func onBuyItem(){
        guard let contract = contract else {
            return;
        }
        buy_btn = "Purchasing";
        btnIsOn = false
        appService.buy_token(for: contract){(succ,paymentId, tok_id, no_payment, msg) in
            print( tok_id, paymentId, no_payment, msg, succ )
            if succ {
                viewModel.showSuccess(h1: "Purchased!", h2: "Your item id is \(tok_id). See the item in the My Merch section")
                buy_btn = "Buy another"
                btnIsOn = true
                onDidBuyItem()
            } else if no_payment {
                self.showCardScanner = true
                self.buy_btn = "Continue Purchasing";
                self.btnIsOn = true
            } else {
                buy_btn = "Try again"
                self.btnIsOn = true
                viewModel.showFail(h1: "Oh no!", h2: msg)
            }
        }
    }

    func onDidSaveCreditCard(_ b: Bool){
        self.showCardScanner = false
        viewModel.showSuccess(h1: "Saved!", h2: "Please tap Continue Purchasing")
    }
    
    func goshowMeta(){
        self.showMeta = true;
        if let tok = tok {
            appService.gen_token_qr_code_seed(for: tok){succ,msg,qr in
                self.seed = qr
            }
        }
    }

    //MARK: - view
    
    var body: some View {
        
        let fr = UIScreen.main.bounds
        let w  = fr.width  - 2*padh
        let h  = fr.height - 2*padv
        
        ZStack {

            if let _url = self._image() {
                AsyncMediaPlayer(
                    url: _url,
                    width: w,
                    height: h
                )
                .onTapGesture {
                    self.showMeta.toggle()
                }
            } else {
                VStack {
                    Spacer()
                    AppTextH3(":(")
                        .foregroundColor(.text3)
                    Spacer()
                }
                .onTapGesture {
                    self.showMeta.toggle()
                }
            }
    
            if showMeta {
                VStack {
                    Spacer()
                    MetadataView()
                }
            } else {
                if let _ = contract {
                    FooterViewPurchase()
                } else {
                    FooterView()
                }
            }
        }
        .frame(width: w, height: h, alignment: .center)
        .background(Color.offBlack1)
        .sheet(isPresented: $showCardScanner) {
            InputCreditCardView(onDidSaveCreditCard: onDidSaveCreditCard)
                .edgesIgnoringSafeArea(.all)
        }
        .onAppear{
            componentDidMount()
        }
        .border(Color.surface2, width: 2)
        .modifier(AppCardCorners())
    }
    
    // metadata for card view
    @ViewBuilder private func MetadataView() -> some View {

        let fr = UIScreen.main.bounds
        let w  = fr.width - 2*padh
        let h  = (fr.height - 2*padv)*0.75
        let padv = FontSize.footer1.sz
        let title_fonts : FontSize = _name().count > 15
            ? .h3
            : _name().count >= 10
            ? .h2
            : .h1
         
            
        ScrollView {

            // header
            HStack {
                AppTextBody(
                    _date(),
                    size: FontSize.footer2.sz,
                    isLeading: true
                )
                .foregroundColor(.text3)
            }
            .padding([.top],padv)
            .padding([.horizontal],15)
            .frame(width:w,height: 25, alignment: .leading)
            .modifier(AppBorderBottom())
            .onTapGesture {
                showMeta = false
            }
            
            // main title
            HStack {
                AppTextH1(
                    _name(),
                    size: title_fonts.sz,
                    isLeading: true
                )
                .foregroundColor(.text1)
            }
            .padding([.vertical],padv/2)
            .padding([.horizontal],15)
            .frame(width: w, alignment: .leading)
            .modifier(AppBorderBottom())
            .onTapGesture {
                self.showMeta = false
            }
            // price
            HStack {
                AppTextBody("Price:", size: FontSize.body.sz, isLeading: true)
                    .foregroundColor(.text1)
                Spacer()
                AppTextBody(_price(), size: FontSize.body.sz, isLeading: true)
                    .foregroundColor(.text1)
            }
            .padding([.horizontal], 20)
            .padding([.vertical],5)
            .frame( width: w, alignment: .leading)
            .modifier(AppBorderBottom())
            
            // about
            if let _ = contract {
                AppTextBody(_about(), size: FontSize.body.sz, isLeading: true)
                    .lineSpacing(1.5)
                    .foregroundColor(.text2)
                    .modifier(FlushLeft())
                    .padding([.horizontal],25)
                    .padding([.top],20)
                
                MaterialUIButton(
                    label : "Done".uppercased(),
                    width : fr.width/3,
                    isOn  : true,
                    background: Color.black.opacity(0.95),
                    color : Color.text1.opacity(0.5),
                    borderColor: Color.surface2,
                    fontSize: FontSize.footer2.sz,
                    action: {
                        self.showMeta = false
                    })
                .padding([.vertical],35)

            } else {
                // price + table

                VStack {
                    Spacer()
                    // qr code
                    HStack {
                        CubeTableViewQR(
                            rows: 15,
                            cols: 15,
                            width: fr.width*0.6,
                            height: fr.width*0.6,
                            seed: seed,
                            color: Color.surface2.opacity(0.5),
                            bgColor: Color.offBlack1
                        )
                            .padding([.vertical],10)
                            .padding([.trailing],25)
                        Spacer()
                    }
                    .frame(width: w*2/3-padv, alignment: .leading)
                    Spacer()
                }
                .padding([.top],padv/2)
            }

        }
        .frame(width: w, height: h, alignment: .center)
        .background(Color.offBlack1)
        .modifier(AppCardCorners())
    }    
    
    @ViewBuilder private func FooterViewPurchase() -> some View {
        
        let fr = UIScreen.main.bounds
        let w  = fr.width  - 2*padh
        let h  = fr.height - 2*padv
        
        VStack {
            VStack {
                Spacer()
                HStack {
                    AppTextH3(
                        "Price: \(_price())",
                        size: FontSize.footer1.sz
                    )
                        .foregroundColor(Color.text1)
                        .padding([.horizontal],25)
                    Spacer()
                }
                HStack {
                    AppTextH1(_name(), size: FontSize.h2.sz)
                        .padding([.top, .bottom],5)
                        .foregroundColor(Color.text1)
                        .padding([.horizontal],25)
                    Spacer()
                }
            }
            .frame(width:w,height:h-FontSize.footer2.sz*3)
            .modifier(AppBorderBottom())
            .onTapGesture {
                goshowMeta()
            }
            MaterialUIButton(
                label : buy_btn.uppercased(),
                width : fr.width-6*padh,
                isOn  : btnIsOn,
                background: Color.black.opacity(0.95),
                color : Color.red2,
                borderColor: Color.red2,
                fontSize: FontSize.footer2.sz,
                action: {
                    onBuyItem()
                })
                .padding([.bottom],35)
        }
        .frame(width: w,height: h)
    }
    
    @ViewBuilder private func FooterView() -> some View {
        
        let fr = UIScreen.main.bounds
        let w  = fr.width  - 2*padh
        let h  = fr.height - 2*padv
        
        VStack {
            VStack {
                Spacer()
                HStack {
                    AppTextH3(_date(), size: FontSize.footer1.sz)
                        .foregroundColor(Color.text1)
                        .padding([.horizontal],25)
                    Spacer()
                }
                HStack {
                    AppTextH1(_name(), size: FontSize.h2.sz)
                        .padding([.top, .bottom],5)
                        .foregroundColor(Color.text1)
                        .padding([.horizontal],25)
                    Spacer()
                }
            }
            .frame(width:w,height:h-FontSize.footer2.sz*3)
            .modifier(AppBorderBottom())
            MaterialUIButton(
                label : "see qr code".uppercased(),
                width : fr.width/2,
                isOn  : true,
                background: Color.black.opacity(0.95),
                color : Color.red2d,
                borderColor: Color.red2d,
                fontSize: FontSize.footer2.sz,
                action: {
                    goshowMeta()
                })
                .padding([.bottom],35)
        }
        .frame(width: w,height: h)

    }

    
}
    

//MARK: - preview

#if DEBUG
struct MerchCard_Previews: PreviewProvider {
    static var previews: some View {
        let fr = UIScreen.main.bounds
        ScrollView {
            MerchCard(
                padh: 20,
                padv: 120,
                contract: ContractModel.trivial(),
                onDidBuyItem: {}
            )
            .modifier(CenterHorizontal())
            MerchCard(
                padh: 20,
                padv: 120,
                tok: NonfungibleTok.trivial(),
                onDidBuyItem: {}
            )
            .modifier(CenterHorizontal())
                
            HStack {
                MerchCardSimple(wd: fr.width/2-30, ht: fr.height/2, goToTok: {})
                    .padding([.horizontal],10)
                MerchCardSimple(wd: fr.width/2-30, ht: fr.height/2, goToTok: {})
                    .padding([.trailing],10)
            }
        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .edgesIgnoringSafeArea(.all)
        .background(Color.black)
        .environmentObject(AppService())
    }
}

#endif

