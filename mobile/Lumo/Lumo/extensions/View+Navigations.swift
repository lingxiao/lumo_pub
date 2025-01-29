//
//  View+Naivgations.swift
//  Lumo
//
//  Created by lingxiao on 9/10/22.
//


import Foundation
import SwiftUI


//MARK: - app default navigation behavior

/**
    @use: hide navigation bar, swipe left to right to dismiss current view
 
    body {
        VStack{}
            .modifier(WithAppNavigation())
    }
    
    @reference: https://stackoverflow.com/questions/56437335/go-to-a-new-view-using-swiftui
*/
struct WithAppNavigation: ViewModifier {

    let navbarColor: Color = Color.surface1.opacity(0.0)
    let textColor: Color = Color.surface1.opacity(0.0)

    @Environment(\.presentationMode) var presentationMode

    func body(content: Content) -> some View {

        VStack {
            content
        }
        .modifier(WithHiddenNavBar( backgroundColor: navbarColor, textColor: textColor ))
        .modifier(WithHorizontalSwipeGesture(
            swipeRightToLeft: trivialSwipe,
            swipeLeftToRight: {_ in presentationMode.wrappedValue.dismiss() }
        ))
    }
}


//MARK: - With App header view


// @use: swipe left to go back
struct WithSwipeToGoBack: ViewModifier {

    @Environment(\.presentationMode) var presentationMode
    var disabled: Bool = false

    func body(content: Content) -> some View {
        content
            .modifier(
                WithHorizontalSwipeGesture(
                    swipeRightToLeft: { _ in },
                    swipeLeftToRight: {_ in
                        if !disabled {
                            presentationMode.wrappedValue.dismiss()
                        }
                    }
                )
            )
    }

}




//MARK:- hide navigation bar


/**
    @use: hide navigation bar, flush app display to top
 
    body {
        VStack{}
            .modifier(WithHiddenNavBar())
    }
    
    @reference: https://stackoverflow.com/questions/56437335/go-to-a-new-view-using-swiftui
*/
struct WithHiddenNavBar: ViewModifier {
    
    var backgroundColor : Color
    var textColor: Color = Color.surface1
    
    func body(content: Content) -> some View {

        VStack {
            content
        }
        .navigationBarTitle("")
        .navigationBarHidden(true)
        .navigationBarColor(UIColor(backgroundColor), textColor: UIColor(textColor))
        .edgesIgnoringSafeArea(.top)
    }

}


//MARK:- wrap each body in navigation bar

/**
    @use:
 
    body {
        VStack{}
            .navigate(to: ProfileEditView(), when: $goToProfileEditView)
    }
    
    @reference: https://stackoverflow.com/questions/56437335/go-to-a-new-view-using-swiftui
*/
extension View {

    /// Navigate to a new view.
    /// - Parameters:
    ///   - view: View to navigate to.
    ///   - binding: Only navigates when this condition is `true`.
    func navigate<NewView: View>(to view: NewView, when binding: Binding<Bool>) -> some View {
        NavigationView {
            ZStack {
                self
                    .navigationBarTitle("")
                    .navigationBarHidden(true)
                NavigationLink(
                    destination: view
                        .navigationBarTitle("")
                        .navigationBarHidden(true),
                    isActive: binding
                ) {
                    EmptyView()
                }
            }
            .background(Color.black.opacity(0.0))
        }
    }
}

//MARK:- pop to rootview behavior

// @source: https://stackoverflow.com/questions/57334455/swiftui-how-to-pop-to-root-view
struct NavigationUtil {

    static func popToRootView() {
        findNavigationController(viewController: UIApplication.shared.windows.filter { $0.isKeyWindow }.first?.rootViewController)?
            .popToRootViewController(animated: true)
    }

    static func findNavigationController(viewController: UIViewController?) -> UINavigationController? {
        guard let viewController = viewController else {
                return nil
        }

        if let navigationController = viewController as? UINavigationController {
            return navigationController
        }

        for childViewController in viewController.children {
            return findNavigationController(viewController: childViewController)
        }

        return nil
    }
}

//MARK:- Extension to modify navigation bar

//@use: modify app navigation bar appearence
//reference: https://swiftuirecipes.com/blog/navigation-bar-styling-in-swiftui
struct NavigationBarModifier: ViewModifier {
  var backgroundColor: UIColor
  var textColor: UIColor

  init(backgroundColor: UIColor, textColor: UIColor) {
    self.backgroundColor = backgroundColor
    self.textColor = textColor
    let coloredAppearance = UINavigationBarAppearance()
    coloredAppearance.configureWithTransparentBackground()
    coloredAppearance.backgroundColor = .clear
    coloredAppearance.titleTextAttributes = [.foregroundColor: textColor]
    coloredAppearance.largeTitleTextAttributes = [.foregroundColor: textColor]

    UINavigationBar.appearance().standardAppearance = coloredAppearance
    UINavigationBar.appearance().compactAppearance = coloredAppearance
    UINavigationBar.appearance().scrollEdgeAppearance = coloredAppearance
    UINavigationBar.appearance().tintColor = textColor
  }

  func body(content: Content) -> some View {
    ZStack{
       content
        VStack {
          GeometryReader { geometry in
             Color(self.backgroundColor)
                .frame(height: geometry.safeAreaInsets.top)
                .edgesIgnoringSafeArea(.top)
              Spacer()
          }
        }
     }
  }
}


extension View {

    func navigationBarColor(_ backgroundColor: UIColor, textColor: UIColor) -> some View {
        self.modifier(NavigationBarModifier(backgroundColor: backgroundColor, textColor: textColor))
    }
}



//MARK:- override native `scene` hosting controller

class AppHostingController<Content> : UIHostingController<Content> where Content : View {
    @objc override dynamic open var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
}
