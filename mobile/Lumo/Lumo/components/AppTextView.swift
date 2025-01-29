//
//  AppText.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//


import Foundation
import SwiftUI


//MARK: - text sizes


enum FontSize {

    case h1
    case h2
    case h3
    case h4
    case body
    case footer1
    case footer2
    case footer3
    
    var sz: CGFloat {
        switch self {
        case .h1: return 50.0
        case .h2: return 40.0
        case .h3: return 35.0
        case .h4: return 30.0
        case .body: return 18.0
        case .footer1: return 16.0
        case .footer2: return 16.0
        case .footer3: return 13.0
        }
    }
}


//MARK: - text views

struct AppTextH1: View {

    private let str: String
    private let size: CGFloat
    private let isLeading: Bool
    
    init( _ str: String, size: CGFloat = FontSize.h1.sz, isLeading:Bool=true){
        self.str = str
        self.size = size
        self.isLeading = isLeading
    }
    
    var body: some View {
        Text(str)
            .font(.custom("NeueMachina-Black", size: size))
            .multilineTextAlignment(isLeading ? .leading : .center)

    }
}



struct AppTextH2: View {

    private let str: String
    private let size: CGFloat
    private let isLeading: Bool
    private let isUnderlined : Bool
    
    init( _ str: String, size: CGFloat = FontSize.h2.sz, isLeading:Bool=true, isUnderlined: Bool = false){
        self.str = str
        self.size = size
        self.isLeading = isLeading
        self.isUnderlined = isUnderlined
    }
    
    var body: some View {
        if isUnderlined {
            Text(str)
                .underline()
                .font(.custom("NeueMachina-UltraBold", size: size))
                .multilineTextAlignment(isLeading ? .leading : .center)
        } else {
            Text(str)
                .font(.custom("NeueMachina-UltraBold", size: size))
                .multilineTextAlignment(isLeading ? .leading : .center)
        }
    }
    
    
}


struct AppTextH3: View {

    private let str: String
    private let size: CGFloat
    private let isLeading: Bool
    
    init( _ str: String, size: CGFloat = FontSize.h3.sz, isLeading:Bool=true){
        self.str = str
        self.size = size
        self.isLeading = isLeading
    }

    
    var body: some View {
        Text(str)
            .font(.custom("NeueMachina-Bold", size: size))
            .multilineTextAlignment(isLeading ? .leading : .center)
    }
    
}


struct AppTextH4: View {
    
    private let str: String
    private let size: CGFloat
    private let isLeading: Bool
    
    init( _ str: String, size: CGFloat = FontSize.h4.sz, isLeading:Bool=true){
        self.str = str
        self.size = size
        self.isLeading = isLeading
    }
    
    var body: some View {
        Text(str)
            .font(.custom("NeueMachina-Medium", size: size))
            .multilineTextAlignment(isLeading ? .leading : .center)
    }
    
}

struct AppTextBody: View {
    
    private let str: String
    private let size: CGFloat
    private let isLeading: Bool
    
    init( _ str: String, size: CGFloat = FontSize.body.sz, isLeading:Bool=true){
        self.str = str
        self.size = size
        self.isLeading = isLeading
    }

    var body: some View {
        Text(str)
            .font(.custom("NeueMachina-Regular", size: size))
            .multilineTextAlignment(isLeading ? .leading : .center)
    }
    
}

struct AppTextFooter1: View {
    
    private let str: String
    private let size: CGFloat
    private let isLeading: Bool
    
    init( _ str: String, size: CGFloat = FontSize.footer1.sz, isLeading:Bool=true){
        self.str = str
        self.size = size
        self.isLeading = isLeading
    }
    
    var body: some View {
        Text(str)
            .font(.custom("NeueMachina-Light", size: size))
            .multilineTextAlignment(isLeading ? .leading : .center)
    }
    
}

struct AppTextFooter2: View {
    
    private let str: String
    private let size: CGFloat
    private let isLeading: Bool
    
    init( _ str: String, size: CGFloat = FontSize.footer2.sz, isLeading:Bool=true){
        self.str = str
        self.size = size
        self.isLeading = isLeading
    }
    
    var body: some View {
        Text(str)
            .font(.custom("NeueMachina-UltraLight", size: size))
            .multilineTextAlignment(isLeading ? .leading : .center)
    }
    
}


struct AppText_Previews: PreviewProvider {
    static var previews: some View {
        VStack {
            AppTextH1("app-text-h1")
            AppTextH2("app-text-h2")
            AppTextH3("app-text-h3")
            AppTextH4("app-text-h4")
            AppTextBody("app-text-body", size: 18)
            AppTextFooter1("app-text-footer-1", size: 12)
            AppTextFooter2("app-text-footer-2", size: 12)
        }
    }
}
