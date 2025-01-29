//
//  QRCodeImage.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//
//
//  @Doc: https://jeevatamil.medium.com/create-qr-codes-with-swiftui-e3606a103bc2
//  @Doc: https://www.avanderlee.com/swift/qr-code-generation-swift/
//

import Foundation
import SwiftUI



struct QRCodeImage: View {

    var text: String = ""
    var width: CGFloat  = 200
    var height: CGFloat = 200
    
    var body: some View {
        VStack {
            Image(uiImage: UIImage(data: getQRCodeDate(text: text)!)!)
                .resizable()
                .frame(width: width, height: height)
        }
    }
    
    func getQRCodeDate(text: String) -> Data? {
        guard let filter = CIFilter(name: "CIQRCodeGenerator") else { return nil }
        let data = text.data(using: .ascii, allowLossyConversion: false)
        filter.setValue(data, forKey: "inputMessage")
        guard let ciimage = filter.outputImage else { return nil }
        let transform = CGAffineTransform(scaleX: 10, y: 10)
        let scaledCIImage = ciimage.transformed(by: transform)
        let uiimage = UIImage(ciImage: scaledCIImage)
        return uiimage.pngData()!
    }
}
