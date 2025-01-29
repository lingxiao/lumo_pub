//
//  utils.swift
//  Lumo
//
//  Created by lingxiao on 9/16/22.
//

import Foundation

//MARK: - utils

// @use: convert int to date obj.
// @Source: https://stackoverflow.com/questions/39934057/convert-date-to-integer-in-swift
func intToDate(_ timestamp: Int) -> Date {
    // convert Int to TimeInterval (typealias for Double)
    let timeInterval = TimeInterval(timestamp)
    // create NSDate from Double (NSTimeInterval)
    let myNSDate = Date(timeIntervalSince1970: timeInterval)
    return myNSDate;
}


func mparseString(_ mraw: [String:Any]?, at key: String ) -> String {
    guard let raw = mraw else {
        return ""
    }
    return raw[key] as? String ?? ""
}

func mparseInt(_ mraw: [String:Any]?, at key: String ) -> Int {
    guard let raw = mraw else {
        return 0
    }
    return raw[key] as? Int ?? 0
}


//MARK: - data presets

let lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer ullamcorper lorem ullamcorper massa tincidunt volutpat. Maecenas ut consequat libero, tristique tincidunt lacus. Vivamus ac ipsum ut dui blandit finibus at ac diam. Donec dapibus condimentum tincidunt. Interdum et malesuada fames ac ante ipsum primis in faucibus. Praesent ornare ex ac eros sagittis, sed cursus orci malesuada. Nullam commodo semper leo at convallis. Aenean venenatis ullamcorper condimentum. Phasellus vitae pharetra odio. Donec sit amet molestie turpis."

