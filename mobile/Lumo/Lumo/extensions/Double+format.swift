//
//  Double+format.swift
//  Lumo
//
//  Created by lingxiao on 9/19/22.
//  doc: https://stackoverflow.com/questions/36376897/swift-2-0-format-1000s-into-a-friendly-ks
//
//

import Foundation



extension Double {
    var kmFormatted: String {

        if self >= 10000, self <= 999999 {
            return String(format: "%.1fK", locale: Locale.current,self/1000).replacingOccurrences(of: ".0", with: "")
        }

        if self > 999999 {
            return String(format: "%.1fM", locale: Locale.current,self/1000000).replacingOccurrences(of: ".0", with: "")
        }

        return String(format: "%.0f", locale: Locale.current,self)
    }
}


/// @source: https://github.com/Volorf/swipeable-cards/blob/main/Swipeable%20Cards/Swipeable%20Cards/CardView.swift
extension Double
{
    static func remap(from: Double, fromMin: Double, fromMax: Double, toMin: Double, toMax: Double) -> Double
    {
        let fromAbs: Double  =  from - fromMin
        let fromMaxAbs: Double = fromMax - fromMin
        let normal: Double = fromAbs / fromMaxAbs
        let toMaxAbs = toMax - toMin
        let toAbs: Double = toMaxAbs * normal
        var to: Double = toAbs + toMin
        
        to = abs(to)
        
        // Clamps it
        if to < toMin { return toMin }
        if to > toMax { return toMax }
       
        return to
    }
}
