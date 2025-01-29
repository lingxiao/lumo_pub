//
//  OneMerch.swift
//  Lumo
//
//  Created by lingxiao on 11/14/22.
//



import Foundation
import SwiftUI


//MARK: - view

struct OneMerch : View {
    
    @EnvironmentObject var appService: AppService
    @Environment(\.presentationMode) var presentationMode
    
    @State private var tok: NonfungibleTok? = nil
    
    func componentDidMount(){
        tok = appService.currentMerch
    }
    
    
    //MARK: - view
    
    var body: some View {

        let fr = UIScreen.main.bounds

        ZStack {

            ///img motif
            Image("cards-3")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(height:fr.height*1.5)
                .position(x:fr.width/2, y:fr.height-160);
            
            MerchCard(
                padh: 20,
                padv: HEADER_HEIGHT,
                tok: tok,
                onDidBuyItem: {}
            )
            .padding( [.top], HEADER_HEIGHT)
            
            AppHeader(
                name: "your merch".uppercased(),
                goBack: {
                    appService.currentMerch = nil;
                    presentationMode.wrappedValue.dismiss()
            })
            .position(x: fr.width/2, y: HEADER_HEIGHT)

        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .background(.black)
        .modifier(WithHorizontalSwipeGesture(
            swipeRightToLeft: trivialSwipe,
            swipeLeftToRight: {_ in
                appService.currentMerch = nil;
                presentationMode.wrappedValue.dismiss();
            }
        ))
        .onAppear{
            componentDidMount()
        }
    }
    



}



//MARK: - preview

#if DEBUG
struct OneMerch_Previews
: PreviewProvider {
    static var previews: some View {
        OneMerch()
            .environmentObject(AppService())
    }
}
#endif




