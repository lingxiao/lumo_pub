//
//  BurnPrompt.swift
//  lumo
//
//  Created by lingxiao on 9/9/22.
//



import Foundation
import SwiftUI
import CardStack

struct BurnPrompt : View {
    
    // env.
    @EnvironmentObject var appService : AppService;
    @EnvironmentObject var viewModel : AlertViewModel

    // data source
    @Binding public var burn: BurnModel?
    
    var width: CGFloat
    var onReload: () -> Void
    var onSeeHistory: () -> Void
    var onInitiateBurners: () -> Void
    var onEditManifesto: () -> Void
    var onMineBlock: (_ then: @escaping (API_Response) -> Void) -> Void
    
    @State private var btn_disabled: Bool = false
    @State private var btn_str : String = "Reset clock"

    @State private var isPresentingConfirmSign = false
    @State private var isPresentingConfirmMine = false

    // @use: load aggregate stats
    func componentDidMount(){
        return;
    }
    
    func isMine() -> Bool {
        guard let burn = burn else {
            return false
        }
        return burn.userID == appService.authed_uid;
    }

    
    /// @use: either end current burn and reload another one,
    ///      or sign this burn and earn a tab
    func onMineOrSign(){
        appService.sign_manifesto(at: burn){res in
            if res.success {
                viewModel.showSuccess(h1: "You have earned one tab!")
            } else {
                viewModel.showFail(h1: "Oh no!", h2: res.message );
            }

        }
    }


    // MARK: - view

    var body: some View {
        
        let fr = UIScreen.main.bounds;
        let num_signatures = burn?.summarize_chain().3 ?? 0
        
        ScrollView {
            
            PullToRefresh(coordinateSpaceName: "PTR_BurnPrompt") {
                onReload()
            }
            
            VStack (alignment: .leading){
                HStack {
                    AppTextH1("** \(burn?.name ?? "")", size: FontSize.h2.sz, isLeading: true)
                        .foregroundColor(Color.surface1)
                        .padding([.trailing],20)
                        .padding([.bottom],2)
                        Spacer()
                }
            }.padding([.leading],25)
                .padding([.top],50)
            
            // staker list
            VStack {
                HStack {
                    AppTextH2("* Initiation Ritual:", size: FontSize.body.sz, isLeading: true)
                        .foregroundColor(.surface1)
                    Spacer()
                }
                .padding([.leading, .top],15)
                .padding([.bottom],10)
                
                StatsBlock("Tabs shared", "\(roundToTwo(burn?.summarize_chain().1 ?? 0))", width-50)
                StatsBlock( num_signatures > 1 ? "Signatures" : "Signature"
                            , "\(Double(num_signatures).kmFormatted)", width-50
                )
                StatsBlock("Burners invited", "\(Double(burn?.summarize_chain().2 ?? 0).kmFormatted)"   , width-50)
                    .padding([.bottom],20)

                AppTextH3("** See initiation history **", size: FontSize.footer3.sz)
                    .foregroundColor(Color.text1.opacity(0.5))
                    .padding([.bottom],15)
                    .onTapGesture {
                        onSeeHistory()
                    }
                
                ZStack {
                    Image("cards-1")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: fr.width/2)
                        .offset(y:fr.width/2-10)
                        .rotationEffect(Angle(degrees: -90))
                        .shadow(
                            color: Color.red2d.opacity( 0.8),
                            radius: 10,
                            x: -20,
                            y: 25
                        )
                    AppTextH2(
                        "Members".uppercased(),
                        size: FontSize.footer2.sz
                    )
                    .foregroundColor( Color.surface3 )
                    .opacity(0.5)
                    .rotationEffect(Angle(degrees: -90))
                    .padding([.trailing],30)
                }
                .padding([.vertical],-fr.width/2+30)
                .onTapGesture {
                    onInitiateBurners()
                }

            }
            .padding([.vertical],15)
            
            AppTextH1("* Manifesto:", size: FontSize.body.sz, isLeading: true)
                .foregroundColor(Color.surface2)
                .padding([.bottom],10)
                .padding([.leading],25)
                .modifier(FlushLeft())
        
            AppTextH4("\(burn?.about ?? "")", size:FontSize.footer2.sz, isLeading: true)
                .lineSpacing(5)
                .padding([.leading, .trailing],25)
                .foregroundColor(.text1)
            
            if isMine() {
                /**
                PillConvex(
                    label: "Update Manifesto",
                    color: Color.surface1,
                    fontSize: FontSize.footer3.sz,
                    disabled: .constant(false),
                    action: onEditManifesto
                )
                .padding([.horizontal, .top],15)
                .padding([.bottom],25)*/
            } else {
                PillConvex(
                    label: "Sign and Earn 1 Tab",
                    color: Color.red1,
                    fontSize: FontSize.footer3.sz,
                    disabled: .constant(false),
                    action: {
                        self.isPresentingConfirmSign = true
                    })
                .padding([.horizontal, .top],15)
                .padding([.bottom],25)
            }
            
            PillConcave(
                label: "👈 For Members",
                color: Color.text1.opacity(0.25),
                fontSize: FontSize.footer3.sz,
                action: onInitiateBurners
            )
            .padding([.bottom],45)

        }
        .frame(width: width, alignment: .leading)
        .coordinateSpace(name: "PTR_BurnPrompt")
        .modifier(AppPageFade(top: 0.05, bottom: 0.75))
        .onAppear{
            componentDidMount()
        }
        .onChange(of: burn, perform: {v in
            componentDidMount()
        })
        .confirmationDialog("Are you sure?",
            isPresented: $isPresentingConfirmMine) {
            Button("End this current burn and create a new burn event now", role: .none) {
                onMineOrSign()
            }
         }
        .confirmationDialog("Are you sure?",
            isPresented: $isPresentingConfirmSign) {
            Button("Sign this manifesto and earn one burn tab", role: .none) {
                onMineOrSign()
            }
         }
    }
    

        
    // @dev: block stats
    @ViewBuilder private func StatsBlock(_ xs : String, _ ys: String, _ wd: CGFloat ) -> some View {
        HStack {
            AppTextH2(ys, size: FontSize.footer2.sz, isLeading: true, isUnderlined: true)
                .foregroundColor(.text1)
            Spacer()
            AppTextH4(xs, size: FontSize.footer2.sz, isLeading: true)
                .foregroundColor(Color.surface1)
        }
        .overlay(Divider().background(Color.surface1).padding([.top],15))
        .frame(width: wd, alignment: .leading)
        .padding([.top, .leading],5)
        .padding([.trailing],20)
    }
    
    // @dev: user row
    @ViewBuilder private func userRow(_ xs : String, _ ys: String, _ wd: CGFloat ) -> some View {
        HStack {
            AppTextFooter1(xs, size: FontSize.footer2.sz, isLeading: true)
                .foregroundColor(Color.surface1)
            Spacer()
            AppTextFooter1(ys, size: FontSize.footer2.sz, isLeading: true)
                .foregroundColor(.text1)
        }
        .overlay(Divider().background(Color.text1.opacity(0.25)).padding([.top],15))
        .frame(width: wd, alignment: .leading)
        .padding([.top, .leading,.trailing],5)
    }
    
}



//MARK: - preview

#if DEBUG
struct BurnPrompt_Previewse: PreviewProvider {
    static var previews: some View {
        let fr = UIScreen.main.bounds
        BurnPrompt(
            burn: .constant(BurnModel.mempty()),
            width: fr.width,
            onReload: {},
            onSeeHistory: {},
            onInitiateBurners: {},
            onEditManifesto: {},
            onMineBlock: {then in }
        )
            .modifier(AppBurntPage())
            .environmentObject(AppService())
            .environmentObject(AlertViewModel())
    }
}

#endif

