//
//  AsyncAppImage.swift
//  Lumo
//
//  Created by lingxiao on 9/22/22.
//  @Doc: https://developer.apple.com/documentation/swiftui/asyncimage
//  @Doc: https://www.swiftanytime.com/videoplayer-in-swiftui/
//  @Doc; https://stackoverflow.com/questions/27808266/how-do-you-loop-avplayer-in-swift
//      : https://stackoverflow.com/questions/65927459/playback-controls-in-swiftui/65928091#65928091
//

import Foundation
import SwiftUI
import AVKit
import UIKit

struct AsyncMediaPlayer : View {
    
    @State public var url: String?
    @State public var backup_url: String? = nil
    public var width: CGFloat
    public var height: CGFloat
    
    @State private var media_url : URL? = nil
    @State private var kind : MediaURLKind = .undefined
    @State var player : AVPlayer? = nil;
    
    // @use: parse url string and load image
    func componentDidMount(){
        self.media_url = URL(string:url ?? "")
        self.kind = parseMediaUrl(url);
        if self.kind == .mp4 {
            if let url = self.media_url {
                self.player = AVPlayer(url: url)
            }
        }
    }
    
    var body: some View {
        Group {
            if kind == .mp4 {
                if let player = self.player {
                    AVPlayerControllerRepresented(player: player)
                        .aspectRatio(contentMode: .fit)
                        .frame(width: width, height: height)
                        .onAppear{
                            player.play()
                        }
                } else if let backup_url = backup_url {
                    AsyncAppImage(url:URL(string:backup_url), width: width, height: height)
                } else {
                    ProgressView()
                }
            } else {
                if let url = self.media_url {
                    AsyncImage(url: url) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: width, height: height)
                    } placeholder: {
                        ProgressView()
                    }
                    .frame(width: width, height: height)
                } else {
                    HStack{}
                        .background(.black)
                        .frame(width: width, height: height)
                }
            }
        }
        .onAppear{
            componentDidMount()
        }
    }
    
}

struct AsyncAppImage: View {
    
    @State public var url: URL? = nil
    public var width: CGFloat
    public var height: CGFloat
        
    var body: some View {
        if let url = url {
            AsyncImage(url: url) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: width, height: height)
            } placeholder: {
                ProgressView()
            }
            .frame(width: width, height: height)
        } else {
            HStack{}
                .background(.black)
                .frame(width: width, height: height)
        }

    }
}

//MARK: - uikit

fileprivate struct AVPlayerControllerRepresented : UIViewControllerRepresentable {
    var player : AVPlayer
    
    func makeUIViewController(context: Context) -> AVPlayerViewController {
        let controller = AVPlayerViewController()
        controller.player = player
        controller.showsPlaybackControls = false
        return controller
    }
    
    func updateUIViewController(_ uiViewController: AVPlayerViewController, context: Context) {
        
    }
}
