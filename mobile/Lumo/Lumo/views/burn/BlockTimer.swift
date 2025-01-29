//
//  BlockTimer.swift
//  Lumo
//
//  Created by lingxiao on 9/16/22.
//  @DOc: https://betterprogramming.pub/make-a-simple-countdown-with-timer-and-swiftui-3ce355b54986
//



import Foundation
import SwiftUI
import CardStack

struct BlockTimer : View {
    
    @Binding public var timeStampExpire: Int
    @State var timeStampCurrent: Date = Date()
    
    var timer: Timer {
        Timer.scheduledTimer(withTimeInterval: 1, repeats: true) {_ in
            self.timeStampCurrent = Date()
        }
    }

    // @use: initiate timer
    func componentDidMount(){
        let _ = self.timer;
    }

    // MARK: - view

    var body: some View {
        let ( day, hr, min, sec ) = countDownInts()
        HStack {
            TimeBlock("\(day)" , "days".uppercased())
            TimeBlock("\(hr)"  , "Hrs".uppercased())
            TimeBlock("\(min)" , "Min".uppercased())
            TimeBlock("\(sec)" , "Sec".uppercased())
        }
        .onAppear{
            componentDidMount()
        }
    }
    
    func countDownInts() -> (Int, Int, Int, Int) {
        let calendar = Calendar(identifier: .gregorian)
        let components = calendar
            .dateComponents([.day, .hour, .minute, .second],
                            from: timeStampCurrent,
                            to: intToDate(timeStampExpire)
            )
        return (
            max(0, components.day ?? 00),
            max(components.hour ?? 00, 0),
            max(components.minute ?? 00, 0),
            max(components.second ?? 00, 0)
        )
    }

    func countDownString() -> String {
        let ( day, hr, min, sec ) = countDownInts()
        return String(format: "%02dd:%02dh:%02dm:%02ds", day, hr, min, sec);
    }
    
    @ViewBuilder private func TimeBlock(_ xs : String, _ ys: String ) -> some View {
        HStack {
            AppTextH2(xs, size: FontSize.h4.sz, isLeading: true, isUnderlined: true)
                .foregroundColor(.text1)
                .frame(width: FontSize.h4.sz*2)
            AppTextH2(ys, size: FontSize.footer1.sz, isLeading: true)
                .frame(width: FontSize.footer1.sz*3)
                .padding([.trailing, .leading],-20)
                .padding([.top],5)
        }
        .padding([.trailing],5)
    }

}



//MARK: - preview

#if DEBUG
struct BlockTimer_Previewse: PreviewProvider {
    static var previews: some View {
        let fr = UIScreen.main.bounds
        VStack {
            HStack {
                Spacer()
                BlockTimer( timeStampExpire: .constant(1663723907) )
                    .frame(width:fr.width-20)
                    .padding([.leading],20)
                Spacer()
            }
        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .edgesIgnoringSafeArea(.all)
        .modifier(AppBurntPage())
    }
}

#endif

