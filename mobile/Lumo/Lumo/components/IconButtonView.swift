//
//  IconButtonView.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//
// @doc: https://developer.apple.com/sf-symbols/
//


import Foundation
import SwiftUI

//MARK:- button w/ icon


enum IconButtonKind {
    case add
    case alert
    case asterisk
    case back
    case camera
    case cross
    case checkmark
    case expand
    case minimize
    case forward
    case fire
    case flip
    case flip2
    case fork
    case grid
    case gift
    case photo
    case moon
    case down
    case goforward
    case hdots
    case lock
    case sparkles
    case person
    case QRcode
    case QRcodeFinder
    case save
    case setting
    case signature
    case handWriting
    case search
    case send
    case skip
    case stop
    case tag
    case ticket
    case refresh
    case up
    case vdots
}


// see: https://github.com/cyanzhong/sf-symbols-online
struct IconButtonView : View {

    let kind  : IconButtonKind
    var size: CGFloat = 15
    var color: Color  = Color.white.opacity(0.9)
    var image_name: String? = nil
    let onTap : () -> Void
    
    private func nameToIcon() -> String {
        switch kind {
        case .add:
            return "cross"
        case .alert:
            return "bell.fill"
        case .asterisk:
            return "staroflife"
        case .cross:
            return "cross"
        case .back:
            return "chevron.backward"
        case .checkmark:
            return "checkmark.seal.fill"
        case .expand:
            return "arrow.up.left.and.arrow.down.right"
        case .minimize:
            return "arrow.down.right.and.arrow.up.left"
        case .down:
            return "chevron.compact.down"
        case .fire:
            return "flame.fill"
        case .forward:
            return "chevron.forward"
        case .flip:
            return "arrow.2.circlepath"
        case .flip2:
            return "arrowshape.turn.up.left"
        case .fork:
            return "tuningfork"
        case .grid:
            return "square.grid.2x2.fill"
        case .gift:
            return "gift"
        case .up:
            return "chevron.compact.up"
        case .vdots:
            return "ellipsis" // "rectangle.grid.3x2.fill"
        case .hdots:
            return "ellipsis"
        case .camera:
            return "largecircle.fill.circle" // "camera.fill"
        case .lock:
            return "lock.fill"
        case .sparkles:
            return "sparkles"
        case .moon:
            return "moon.fill"
        case .person:
            return  "person.fill"
        case .QRcode:
            return "qrcode"
        case .QRcodeFinder:
            return "qrcode.viewfinder"
        case .save:
            return "square.and.arrow.down"
        case .setting:
            return "ellipsis.circle.fill" //pencil.and.ellipsis.rectangle"
        case .signature:
            return "wand.and.stars"
        case .photo:
            return "photo"
        case .goforward:
            return "goforward"
        case .search:
            return "magnifyingglass"
        case .send:
            return "paperplane.fill"
        case .skip:
            return "forward.fill"
        case .stop:
            return "triangle"
        case .tag:
            return "bookmark.fill"
        case .ticket:
            return "tag.fill"
        case .handWriting:
            return "signature"
        case .refresh:
            return "arrow.counterclockwise"
        }
    }
    
    private func toRot() -> Double {
        switch kind {
        case .cross:
            return 45
        case .moon:
            return -90
        case .vdots:
            return 90
        default:
            return 0
        }
    }
    
    // use ugc-image or kind
    @ViewBuilder func ImageBtnView() -> some View {
        if let str = image_name {
            if let raw = (UIImage(named: str)){
                let uiimg = raw.mask(with: UIColor(color))
                Image(uiImage: uiimg)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: size, height: size, alignment: .center)
            } else {
                Image(systemName: "cross")
            }
        } else {
            Image(systemName: nameToIcon())
        }
    }

    var body: some View {
        Button(action: {
            onTap()
        }) {
            VStack {
                ImageBtnView()
                .font(.system(size: size, weight: .heavy))
                .foregroundColor(color)
                .rotationEffect( .degrees(toRot()) )
            }
            .frame(width: size*2, height: size*2, alignment: .center)
        }
    }
}



//MARK:- view

#if DEBUG
struct IconButton_Previews: PreviewProvider {
    static var previews: some View {
        
        let fr = UIScreen.main.bounds

        VStack {

            Spacer()
            
            IconButtonView(kind: .down, image_name: "IncompleteCube8", onTap:{})
            
            Spacer()
            
            IconButtonView(kind: .refresh, onTap: {})

            Spacer()
            
            IconButtonView(kind: .tag, onTap: {})

            Spacer()

        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .background(Color.surface1.edgesIgnoringSafeArea(.all))
    }
}
#endif
