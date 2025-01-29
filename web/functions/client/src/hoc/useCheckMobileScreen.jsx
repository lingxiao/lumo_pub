/**
 * @Package: useMobileScreen.jsx
 * @Date   : Dec 23rdd, 2021
 * @Author : Xiao Ling   
 * @Docs   : https://stackoverflow.com/questions/39435395/reactjs-how-to-determine-if-the-application-is-being-viewed-on-mobile-or-deskto
 *
 *
*/



import {useEffect, useState} from "react";
import { trivialNum } from './../model/utils';
const { browserName } = require('react-device-detect');


/**
 * 
 * @use: compute width of the window
 * 
 */ 
const useCheckMobileScreen = (maxWidth) => {

    const [width, setWidth] = useState(window.innerWidth);

    const handleWindowSizeChange = () => {
        setWidth(window.innerWidth);
    }

    useEffect(() => {
        window.addEventListener('resize', handleWindowSizeChange);
        return () => {
            window.removeEventListener('resize', handleWindowSizeChange);
        }
    }, []);

    let wd = trivialNum(maxWidth) ? 768 : maxWidth
    // return (width <= maxWidth);
    return (width <= wd);
}



const useHeight = () => {

    const [height, setHeight] = useState(window.innerHeight);
    const handleWindowSizeChange = () => {
            setHeight(window.innerHeight);
    }

    useEffect(() => {
        window.addEventListener('resize', handleWindowSizeChange);
        return () => {
            window.removeEventListener('resize', handleWindowSizeChange);
        }
    }, []);

    return height;

}


const useWidth = () => {

    const [width, setWidth] = useState(window.innerWidth);
    const handleWindowSizeChange = () => {
            setWidth(window.innerWidth);
    }

    useEffect(() => {
        window.addEventListener('resize', handleWindowSizeChange);
        return () => {
            window.removeEventListener('resize', handleWindowSizeChange);
        }
    }, []);

    return width;


}

const useSafari = () => {
    return browserName === 'Safari';
}


// Use: check brosr
// @Doc: https://stackoverflow.com/questions/49328382/browser-detection-in-reactjs
const useCheckBrowser = () => {

    // Opera 8.0+
    // var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

    // Firefox 1.0+
    var isFirefox = typeof InstallTrigger !== 'undefined';

    // Safari 3.0+ "[object HTMLElementConstructor]" 
    var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && window['safari'].pushNotification));

    // Internet Explorer 6-11
    var isIE = /*@cc_on!@*/false || !!document.documentMode;

    // Edge 20+
    var isEdge = !isIE && !!window.StyleMedia;

    // Chrome 1 - 79
    var isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

    // Edge (based on chromium) detection
    var isEdgeChromium = isChrome && (navigator.userAgent.indexOf("Edg") != -1);

    // Blink engine detection
    var isBlink = (isChrome) && !!window.CSS;
    // var isBlink = (isChrome || isOpera) && !!window.CSS;


    return { isFirefox, isSafari, isIE, isEdge, isChrome, isBlink }
}


export { useHeight, useSafari, useWidth, useCheckBrowser }












export default useCheckMobileScreen