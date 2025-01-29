//
//  TinderCardFull.swift
//  Lumo
//
//  Created by lingxiao on 9/26/22.
//

import Foundation
import SwiftUI


//MARK: - constants


enum LoveState {
    case love
    case poop
    case empty
}


private struct CardViewConsts {
    static let poopTriggerZone: CGFloat = -0.1
    static let loveTriggerZone: CGFloat = 0.1

    static let motionRemapFromMin: Double = 0.0
    static let motionRemapFromMax: Double = 0.25
    static let motionRemapToMin: Double = 0.0
    static let motionRemapToMax: Double = 1.0
}



//MARK: - view

struct TinderCardFull : View {
    
    // style
    var padh : CGFloat
    var padv : CGFloat
    var disable_swipe: Bool = true
    
    // data
    public var image_url: URL?
    public var name_header: String
    public var name: String
    public var row_2a: String
    public var row_2b: String
    public var hero_header: String
    public var hero_stat: Double
    public var table_header: String
    @Binding public var table_datasource: [String]

    // responders
    var onTapName: () -> Void
    var onTapRow2: () -> Void
    var onTapHeroStat: () -> Void
    var onTapTable: () -> Void
    
    @State private var showMeta: Bool = true
    @State private var showTapToHide: Bool = false
    
    //MARK: - mount + swipe
    
    // @use: load user image
    func componentDidMount(){
        return;
    }
    
    @State private var translation: CGSize = .zero
    @State private var motionOffset: Double = 0.0
    @State private var motionScale: Double = 0.0
    @State private var lastCardState: LoveState = .empty
    
    
    private func getIconName(state: LoveState) -> String {
        switch state {
            case .love:     return "acid1a" //  "Love"
            case .poop:     return "Poop"
            default:        return "lumoname"
        }
    }
    
    private func setCardState(offset: CGFloat) -> LoveState {
        if offset <= CardViewConsts.poopTriggerZone   { return .poop }
        if offset >= CardViewConsts.loveTriggerZone   { return .love }
        return .empty
    }
    
    
    //MARK: - view
    
    var body: some View {
        
        let fr = UIScreen.main.bounds
        let w  = fr.width  - 2*padh
        let h  = fr.height - 2*padv       

        ZStack {
            
            if let _url = image_url {
                if showTapToHide {
                    AsyncAppImage(url: _url, width: w*2, height: h)
                        .onTapGesture {
                            //self.showMeta = false
                        }
                } else {
                    VStack {
                        AsyncAppImage(url: _url, width: 100, height: 100)
                            .clipShape(Circle())
                            .padding([.vertical],h/12)
                            .onTapGesture {
                                //self.showMeta = false
                            }
                        Spacer()
                    }
                }
            }
        
            if showMeta {
                VStack {
                    Spacer()
                    MetadataView()
                }
            } else {
                FooterView()
            }

            //swipe responder
            if !disable_swipe {
                VStack {
                    Spacer()
                    Image(getIconName(state: self.lastCardState))
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width:w/2, height:w/2)
                        .opacity(self.motionScale)
                    //.scaleEffect(CGFloat(self.motionScale))
                    Spacer()
                }
            }
        }
        .frame(width: w, height: h, alignment: .center)
        .background(Color.black)
        .onAppear{
            componentDidMount()
        }
        .modifier(AppCardCorners())
        .gesture(
            DragGesture()
                .onChanged { gesture in
                    self.translation = gesture.translation
                    self.motionOffset = Double(gesture.translation.width / (w/4))
                    self.motionScale = Double.remap(
                        from: self.motionOffset,
                        fromMin: CardViewConsts.motionRemapFromMin,
                        fromMax: CardViewConsts.motionRemapFromMax,
                        toMin: CardViewConsts.motionRemapToMin,
                        toMax: CardViewConsts.motionRemapToMax
                    )
                    self.lastCardState = setCardState(offset: gesture.translation.width)
                }
                .onEnded { gesture in
                    self.translation = .zero
                    self.motionScale = 0.0
                }
        )
            
    }
    
    // metadata for card view
    @ViewBuilder private func MetadataView() -> some View {

        let fr = UIScreen.main.bounds
        let w  = fr.width - 2*padh
        let h  = (fr.height - 2*padv)*0.75
        let padv = FontSize.footer1.sz
        let title_fonts : FontSize = name.count > 15
        ? .h3
        : name_header.count >= 10
        ? .h2
        : .h1
        
        VStack {
            
            // header
            HStack {
                AppTextBody(
                    name_header,
                    size: FontSize.footer2.sz,
                    isLeading: true
                )
                    .foregroundColor(.text3)
            }
            .padding([.top],padv)
            .padding([.horizontal],15)
            .frame(width:w,height: 25, alignment: .leading)
            .modifier(AppBorderBottom())
            
            // main title
            HStack {
                AppTextH1(
                    name,
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
                onTapName()
            }
            
            // date
            HStack {
                AppTextBody(row_2a, size: FontSize.body.sz, isLeading: true)
                    .foregroundColor(.text1)
                Spacer()
                AppTextBody(row_2b, size: FontSize.body.sz, isLeading: true)
                    .foregroundColor(.text1)
            }
            .padding([.horizontal], 20)
            .padding([.vertical],5)
            .frame( width: w, alignment: .leading)
            .modifier(AppBorderBottom())
            .onTapGesture {
                onTapRow2()
            }
            
            // price + table
            HStack {
                    
                VStack {
                    HStack {
                        VStack {
                            AppTextBody(hero_header, size: FontSize.footer3.sz, isLeading: true)
                                .modifier(FlushLeft())
                                .foregroundColor(.text3)
                            HStack {
                                AppTextH3(
                                    "\(hero_stat)",
                                    size: FontSize.h3.sz,
                                    isLeading: true
                                )
                                .foregroundColor(.red2d)
                                .padding([.top],8)
                                Image("acid1b")
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                                    .frame(width: FontSize.h3.sz, height: FontSize.h3.sz)
                            }
                                .padding([.top],1)
                                .modifier(FlushLeft())
                        }
                        Spacer()
                    }
                    .frame(width: w/2, alignment: .bottomLeading)
                    .padding([.leading], 10)
                    .onTapGesture {
                        onTapHeroStat()
                    }
                    
                    Spacer()
                    if showTapToHide {
                        VStack {
                            AppTextH3("Tap to hide".uppercased(), size: FontSize.footer3.sz, isLeading: true)
                                .foregroundColor(.text3.opacity(0.75))
                                .padding([.bottom],2)
                                .modifier(FlushLeft())
                            /**AppTextBody("hide", size: FontSize.footer1.sz, isLeading: true)
                             .foregroundColor(.text3.opacity(0.75))*/
                        }
                        .padding([.bottom],padv)
                        .padding([.leading], 10)
                        .modifier(FlushLeft())
                        .onTapGesture {
                            //self.showMeta = false
                        }
                        .frame(width: w/2, alignment: .bottomLeading)
                    }
                }
                .frame(width: w/2-padv, alignment: .bottomLeading)
                
                VStack {
                    AppTextH4(table_header, size: FontSize.footer3.sz, isLeading: true)
                        .frame(width: w/2-padv, alignment: .leading)
                        .foregroundColor(.text3)
                        .padding([.bottom],5)
                    VStack {
                        ForEach(table_datasource, id: \.self) { name in
                            UserTableRow(w,padv, name)
                        }
                    }
                    .frame(width:w/2-padv)
                    ///.environment(\.isScrollEnabled, false)
                    Spacer()
                }
                .frame(width: w/2-padv, alignment: .leading)
                .onTapGesture {
                    onTapTable()
                }

            }
            .padding([.top],padv/2)
            
            Spacer()
            
        }
        .frame(width: w, height: h, alignment: .center)
        .background(Color.black)
        .modifier(AppCardCorners())
    }
    

    // @use: table row in card
    @ViewBuilder private func UserTableRow(_ w: CGFloat, _ padv: CGFloat, _ name: String? ) -> some View {
        HStack {
            AppTextBody(name ?? "", size: FontSize.footer3.sz, isLeading: true)
                .modifier(FlushLeft())
                .foregroundColor(.text3.opacity(0.75))
            Spacer()
        }
        .padding([.top, .trailing],5)
        .frame(width:w/2-padv)
        .modifier(AppBorderBottom())
    }
    
    
    @ViewBuilder private func FooterView() -> some View {
        
        let fr = UIScreen.main.bounds
        let w  = fr.width  - 2*padh
        let h  = fr.height - 2*padv
        
        VStack {
            VStack {
                Spacer()
                HStack {
                    AppTextH3(name_header, size: FontSize.footer1.sz)
                        .foregroundColor(Color.text1)
                        .padding([.horizontal],25)
                    Spacer()
                }
                HStack {
                    AppTextH1(name, size: FontSize.h2.sz)
                        .padding([.top, .bottom],5)
                        .foregroundColor(Color.text1)
                        .padding([.horizontal],25)
                    Spacer()
                }
            }
                .frame(width:w,height:h-FontSize.footer2.sz*3)
                .modifier(AppBorderBottom())
            HStack {
                AppTextH3("Tap to see more:".uppercased(), size: FontSize.footer3.sz, isLeading: true)
                    .foregroundColor(.text1.opacity(0.75))
                    .padding([.bottom],FontSize.footer2.sz)
                    .onTapGesture {
                        self.showMeta = true
                    }
            }
            .padding([.horizontal],25)
            .frame(width: w, height: FontSize.footer2.sz*3, alignment: .leading)
            .onTapGesture {
                self.showMeta = true
            }

        }
        .frame(width: w,height: h)
        .onTapGesture {
            showMeta = true
        }

    }

    
}
    

//MARK: - preview

#if DEBUG
struct TinderCardFull_Previewse: PreviewProvider {
    static var previews: some View {
        let fr = UIScreen.main.bounds
        VStack {
            TinderCardFull(
                padh: 20,
                padv: 120,
                disable_swipe: false,
                image_url: URL(string:"https://pbs.twimg.com/profile_images/1460861458552655872/kTGArRS3_400x400.jpg"),
                name_header: "Burner:",
                name: "Alicent HighTower of Oldtowne",
                row_2a: "Nominated by:",
                row_2b: "Eve",
                hero_header: "Initiation Packet:",
                hero_stat: 2.3,
                table_header: "Initiation crew",
                table_datasource: .constant([]),
                onTapName: {},
                onTapRow2: {},
                onTapHeroStat: {},
                onTapTable: {}
            )
            .modifier(CenterHorizontal())
        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .edgesIgnoringSafeArea(.all)
        .modifier(AppBurntPage())
        .environmentObject(AppService())
    }
}

#endif

