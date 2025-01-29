//
//  CubeView.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//



import Foundation
import SwiftUI


//MARK: - cube table views

struct CubeTableViewA: View {

    var rows: Int
    var cols: Int
    var width: CGFloat
    var height: CGFloat
    var cube_color = Color.red2
    var should_animate : Bool = true

    var body: some View {
        
        let r  = CGFloat(width/CGFloat(cols)-10.0)
        
        HStack {
            Spacer()
            ForEach(0..<rows, id: \.self ){ col in
                VStack {
                    ForEach(0..<cols, id: \.self){row in
                        CubeView(at: randCubeIdx(), color: cube_color, should_animate: should_animate)
                            .frame(width: r, height: r, alignment: .center)
                    }
                }
            }
            Spacer()
        }
        .frame(width: width, height: height, alignment: .center)
        //.background(Color.surface1.edgesIgnoringSafeArea(.all))
        
    }
    
}

// @use: cube table with border
struct CubeTableViewB: View {

    var rows: Int
    var cols: Int
    var width: CGFloat
    var height: CGFloat
    var color: Color = Color.text3
    var cube_color = Color.red2

    var body: some View {
        
        ZStack {
            
            Rectangle()
                .trim(from: 0.45, to: 0.55)
                .stroke(color, lineWidth:4)
                .frame(width: width, height: height)

            Rectangle()
                .trim(from: 0.95, to: 1.0)
                .stroke(color, lineWidth: 4)
                .frame(width: width, height: height)
            
            Rectangle()
                .trim(from: 0, to: 0.05)
                .stroke(color, lineWidth: 4)
                .frame(width: width, height: height)

            Rectangle()
                .trim(from: 0.2, to: 0.3)
                .stroke(color, lineWidth: 4)
                .frame(width: width, height: height)

            Rectangle()
                .trim(from: 0.7, to: 0.8)
                .stroke(color, lineWidth: 4)
                .frame(width: width, height: height)

            CubeTableViewA(rows: rows, cols: cols, width: width, height: height, cube_color:cube_color)
        }
        
    }
    
}

// @use: cube table with border
struct CubeTableViewC: View {

    var rows: Int
    var cols: Int
    var width: CGFloat
    var height: CGFloat
    var image: Image
    var color: Color = Color.text3
    var bgColor: Color = .surface1

    var body: some View {
        
        ZStack {

            CubeTableViewB(rows: rows, cols: cols, width: width, height: height, color: color)
            
            HStack {
                VStack {
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: width*2/3, height: width*2/3)
                }
            }
            .frame(width: width/2*1.3, height: width/2*1.3)
            .background(bgColor)
        }
        
    }
    
}

struct CubeTableViewD: View {

    var rows: Int
    var cols: Int
    var width: CGFloat
    var height: CGFloat
    var url: String
    var color: Color = Color.text3
    var bgColor: Color = .surface1

    var body: some View {
        
        ZStack {
            CubeTableViewB(rows: rows, cols: cols, width: width, height: height, color: color)
            
            HStack {
                Spacer()
                VStack {
                    Spacer()
                    AsyncMediaPlayer(url: url, width: width/2, height: width/2)
                    Spacer()
                }
                Spacer()
            }
            .frame(width: width/2*1.3, height: width/2*1.3)
            .background(bgColor)
        }
        
    }
    
}


// @use: cube table with border
struct CubeTableViewQR: View {

    var rows: Int
    var cols: Int
    var width: CGFloat
    var height: CGFloat
    var seed: String
    var color: Color = Color.text3
    var bgColor: Color = Color.surface1

    var body: some View {
        
        ZStack {
            
            CubeTableViewB(rows: rows, cols: cols, width: width, height: height, color: color)
            
            HStack {
                VStack {
                    QRCodeImage(text: seed, width:width/2,height:width/2)
                }
            }
            .frame(width: width/2*1.3, height: width/2*1.3)
            .background(bgColor)
        }
        
    }
    
}



//MARK: - view for one cube

struct CubeView: View {
        
    @State public var at: Int
    var color: Color = .red2
    var should_animate: Bool
    var ratio: CGFloat = 1.0 //3/4
    
    @State var timeStampCurrent: Date = Date()
    var timer: Timer {
        Timer.scheduledTimer(withTimeInterval: 1, repeats: true) {_ in
            self.timeStampCurrent = Date()
            self.at = randCubeIdx();
        }
    }

    // @use: initiate timer
    func componentDidMount(){
        if should_animate {
            let _ = self.timer;
        }
    }
    
    var body: some View {

        GeometryReader { geo in
            
            let fr = geo.size
            let radius = fr.width*ratio
                
            HStack {
                Spacer()
                VStack {
                    Spacer()
                    img().frame(width: radius, height: radius, alignment: .center)
                    Spacer()
                }
                Spacer()
            }
            .frame(width: fr.width, height: fr.height, alignment: .center)
        }
        .onAppear{
            componentDidMount()
        }
    }
    
    @ViewBuilder func img() -> some View {
        let raw = (UIImage(named: "IncompleteCube\(at)")) ?? UIImage(named: "IncompleteCube10")!
        let _color = Int.random(in:1..<10) < 8 ? color : Color.text1
        let uiimg = raw.mask(with: UIColor(_color))
        Image(uiImage: uiimg)
            .resizable()
            .aspectRatio(contentMode: .fit)
    }
}

// @use: lv layout
struct CubeCardViewA: View {

    var rows :Int
    var cols: Int
    var should_animate: Bool = true

    var body: some View {
        
        let fr = UIScreen.main.bounds

        GeometryReader { gr in

            let width  = gr.size.width / CGFloat(cols)
            let height = gr.size.height / CGFloat(rows)
                
            VStack(spacing:0) {
                ForEach(0..<rows, id: \.self) { i in
                    let rowCols = (i%2==0) ? cols : cols - 1
                    HStack(spacing:0) {
                        Group {
                            ForEach(0..<rowCols,id: \.self) { _ in
                                CubeView(at: randCubeIdx(), should_animate: should_animate, ratio: 1/3)
                                    .frame(width: width, height: height)
                            }
                        }
                    }
                }
            }
        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .background(Color.surface1.edgesIgnoringSafeArea(.all))

    }
    
}



//MARK: - preview

private func randCubeIdx() -> Int {
    return Int.random(in: 1..<225)
}


private func randRow() -> Int {
    return Int.random(in: 0..<9)
}

private func randCol() -> Int {
    return Int.random(in: 0..<9)
}

#if DEBUG
struct CubeTableViewA_A: PreviewProvider {
    
    static var previews: some View {

        let fr = UIScreen.main.bounds
        
        ScrollView {
            CubeTableViewA(rows: 15, cols: 15, width: fr.width*2/3, height: fr.width*2/3)
            CubeTableViewB(rows: 15, cols: 15, width: fr.width*2/3, height: fr.width*2/3)
            CubeTableViewC(rows: 15, cols: 15, width: fr.width*2/3, height: fr.width*2/3, image: Image("qrcode"))
            CubeTableViewQR(rows: 15, cols: 15, width: fr.width*2/3, height: fr.width*2/3, seed: "hello\(swiftNow())")
        }
        .frame(width: fr.width, height: fr.height, alignment: .center)
        .padding([.top],fr.height/4)
        .background(Color.surface1)

    }
}

//
//struct CubeView_PreviewsA: PreviewProvider {
//
//    static var previews: some View {
//
//        CubeCardViewA(rows: 21, cols: 7)
//
//    }
//}

#endif
