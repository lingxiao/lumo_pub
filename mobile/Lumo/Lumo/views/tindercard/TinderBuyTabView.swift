//
//  .swift
//  Lumo
//
//  Created by lingxiao on 11/4/22.
//

import Foundation
import SwiftUI



//MARK: - view

struct TinderBuyTabView : View {
        
    @Binding var burn: BurnModel?
    @EnvironmentObject var appService : AppService;

    var padh : CGFloat
    var padv : CGFloat
    
    //MARK: - mount + responders

    func componentDidMount(){
    }
        

    //MARK: - view

    var body: some View {

        let fr = UIScreen.main.bounds
        let w  = fr.width  - 2*padh
        let h  = fr.height - 2*padv

        VStack {

            Spacer()

            Image("acidbag")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: w*2)
                //.position(x:w,y:h+45)
            
            AppTextH2(
                "** Buy one tab".uppercased(),
                size:FontSize.footer1.sz,
                isUnderlined: true
            )
                .foregroundColor(Color.text3)
                .padding([.leading,.top],25)
                .padding([.bottom],10)
                .modifier(FlushLeft())

            ParagraphView("Swipe right to buy one tab for $5 and share with community members")
                .padding([.bottom],15)

            Spacer()

        }
        .frame(width: w, height: h, alignment: .center)
        .background(Color.black)
        .onAppear{
            componentDidMount()
        }
        .modifier(AppCardCorners())
    }
    
    //MARK: - accessory views
    
    @ViewBuilder private func ParagraphView(_ str: String) -> some View {
        AppTextBody(str, size:FontSize.body.sz)
            .foregroundColor(Color.text1.opacity(0.90))
            .padding([.horizontal],25)
            .modifier(FlushLeft())
            .lineSpacing(5)
    }
    
    
}

//MARK: - preview

#if DEBUG
struct TinderBuyTabView_Previews: PreviewProvider {
    static var previews: some View {
        let fr = UIScreen.main.bounds
        VStack {
            HStack {
                Spacer()
                TinderBuyTabView(
                    burn: .constant(nil),
                    padh: 20,
                    padv: 120
                )
                Spacer()
            }
        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .edgesIgnoringSafeArea(.all)
        .modifier(AppBurntPage())
        .environmentObject(AppService())
    }
}

#endif

