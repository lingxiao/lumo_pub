/**
 * @Package: VideoBackground
 * @Date   : Dec 22nd, 2021
 * @Author : Xiao Ling   
 * @Doc: https://frontend-digest.com/responsive-and-progressive-video-loading-in-react-e8753315af51
 *       render from one img: https://codepen.io/anatravas/pen/vyOwOZ
 *       convert on console: https://medium.com/@patdugan/converting-a-mov-to-a-gif-6bb055e54230
 *       convert yt to mp4: https://loader.to/en52/youtube-mp4-downloader.html
 *
*/


import React, {useState, useRef, useEffect} from 'react'
import { createStyles, makeStyles } from "@material-ui/core/styles";
import { COLORS } from './constants'
import Stack from '@mui/material/Stack';

import tattoo_vid from './../assets/tattoo_short.mov';

import { trivialString, trivialProps } from './../model/utils';


/******************************************************
    @styles
******************************************************/

const EASE = 800

const useStyles = makeStyles((theme) => createStyles({
    /**
     * 
     * @Use: full screen video
     * @Doc:  https://css-tricks.com/full-page-background-video-styles/
     *        https://stackoverflow.com/questions/36230522/adding-a-background-video-with-react/36230644
     *        https://frontend-digest.com/responsive-and-progressive-video-loading-in-react-e8753315af51
     * 
    **/
    bg_video_left: {
      objectFit: `cover`,
      width : `100vw`,
      height: `100vh`,
      position: `fixed`,
      top: `0`,
      left: `-60vw`,
      zIndex:  `-100`,
      opacity: `1.0`,
      background: COLORS.offBlack,
      transition: `opacity ${EASE}ms ease 0ms`,
    },

    bg_video_right: {
      objectFit: `cover`,
      width : `100vw`,
      height: `100vh`,
      position: `fixed`,
      top: `0`,
      left: `40vw`,
      zIndex:  `-100`,
      opacity: `1.0`,
      background: 'black',
      transition: `opacity ${EASE}ms ease 0ms`,
    },    

    bg_video: {
      objectFit: `cover`,
      width : `100vw`,
      height: `100vh`,
      position: `fixed`,
      top: `0`,
      left: `0`,
      zIndex:  `-100`,
      opacity: `1.0`,
      background: COLORS.offBlack,
      transition: `opacity ${EASE}ms ease 0ms`,
    },    

    overLayContainer: {
        display: 'grid',
    },

    overLayContainerInner: {
        gridArea: '1 / 1',
    },      


}));


/******************************************************
    @simple View
******************************************************/


export function VideoBackgroundViewSimple(props){

    const classes = useStyles();    

    return (
        <video className={classes.bg_video} autoPlay loop muted>
            <source src={tattoo_vid} type='video/mp4'/>
        </video>               
    )
} 


/******************************************************
    @Static video view for the app
******************************************************/


/**
 *
 * @Use: video background view where video appears after n seconds
 *
 **/
export default function StaticVideoBackgroundView(props){

    const classes = useStyles();    

    return (
        <video
            autoPlay
            loop
            muted
            src={tattoo_vid}
            className={classes.bg_video}
        />            
    )

}


/******************************************************
    @Gif view
******************************************************/

/**
 * @use: render `gif` in fullscreen background
 **/
export function GiphBackgroundView(props){

    const { 
        image_url, 
        preview_url, 
        showCRTLines,
        showVignette, 
        no_delay, 
        darken, 
        pushLeft, 
        no_video_bg,
        containerStyle ,
        on_image_did_load,
    } = props;

    const classes = useStyles();    

    const [showGif, setShowGif] = useState(false);
    const [ loaded, setLoaded  ] = useState(false);

    let standard_gif = 'https://media0.giphy.com/media/8F62ttKOw1FlXLn0QC/giphy.gif?cid=ecf05e47zy3y2srzw3eo88q9vhkay13nfib9x98d8yscsdax&rid=giphy.gif&ct=g';
    let gif =  image_url ?? standard_gif;

    useEffect(() => {
        if ( no_delay ){
            setShowGif(true)
        } else {
            setTimeout(() => {
                setShowGif(true)
            },800)
        }
    },[]);

    function onImageLoad(){
        setTimeout(() => {
            setLoaded(true);        
            if ( typeof on_image_did_load === 'function' ){
                on_image_did_load();
            }
        },700)
    }    

    if ( pushLeft ){
        return (
            <Stack direction="row" style={{}}>
                <div className={ pushLeft ? classes.bg_video_left : classes.bg_video}>
                    { showGif && !trivialString(image_url)
                        ?  
                        <div style={{...(containerStyle ?? {})}}>
                            { loaded || trivialString(preview_url)
                                ?
                                <div/>
                                :
                                <img src={preview_url} alt={""} onLoad={onImageLoad} className={ pushLeft ? classes.bg_video_left : classes.bg_video}/>
                            }
                            <img 
                                src={gif} 
                                alt={""} 
                                className={ classes.bg_video_left }
                                style={ loaded || trivialString(preview_url) ? {} : {display:'none'} }
                            />
                            { showVignette ? <div id="crt-lines" /> : <div/> }
                            { darken       ? <div id="darken" />    : <div/> }
                            { showVignette ? <div id="vignette" />  : <div/> }
                        </div>                        
                        :  <StaticVideoBackgroundView {...props}/>
                    }
                </div>
                <div className={classes.bg_video_right}/>
            </Stack>
        )
    } else {
        return (
            <div className={classes.bg_video} style={{...(containerStyle ?? {})}}>
                { showGif && !trivialString(image_url)
                    ?  
                    <div style={{...(containerStyle ?? {})}}>
                        { loaded || trivialString(preview_url)
                            ?
                            <div style={{...(containerStyle ?? {})}}/>
                            :
                            <img 
                                src={preview_url} 
                                alt={""} 
                                onLoad={onImageLoad} 
                                className={classes.bg_video}
                            />
                        }
                        <img 
                            src={gif} 
                            alt={""} 
                            className={ classes.bg_video}
                            style={ loaded || trivialString(preview_url) ? {} : {display:'none'} }
                        />
                        { showVignette ? <div id="crt-lines" /> : <div/> }
                        { darken       ? <div id="darken" />    : <div/> }
                        { showVignette ? <div id="vignette" />  : <div/> }
                    </div>                    
                    :  
                    no_video_bg
                    ?
                    <div/>
                    :
                    <StaticVideoBackgroundView {...props}/>
                }
            </div>
        )    
    }
}




/******************************************************
    @Video View
******************************************************/


/**
 *
 * @Use: video background view where video appears after n seconds
 * 
 *
 **/
export function RemoteVideoBackgroundView(props){

    const classes = useStyles();    

    const [ showVideo, setVideo ] = useState(false)
    const { video_url, is_paused } = props

    const { showVignette } = props;

    function setDidLoadData(){
        setVideo(true);       
    }    

    const video_ref = useRef(null);

    useEffect(() => {
        if ( is_paused ){
            if ( !trivialProps(video_ref, 'current') ){
                video_ref.current.pause();
            }
        } else {
            if ( !trivialProps(video_ref, 'current') ){
                video_ref.current.play();
            }
        }
    },[is_paused])


    return (
        <div>
            <video
                loop
                autoPlay
                src = {video_url}
                ref = {video_ref} 
                onLoadedData={setDidLoadData}
                className={classes.bg_video}                
                style = { showVideo ? {} : {display:'none'}}
            />
            { showVignette ? <div id="crt-lines" /> : <div/> }
            { showVignette ? <div id="vignette" /> : <div/> }
            { showVideo ? <div/> : <StaticVideoBackgroundView/>  }
         </div>
    )
}










