/**
 * @Package: AppImageView
 * @Date   : Dec 27th, 2021
 * @Author : Xiao Ling   
 * @Doc: https://stackoverflow.com/questions/43115246/how-to-detect-when-a-image-is-loaded-that-is-provided-via-props-and-change-sta
 *
*/


import React, {useState} from 'react'
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { createStyles, makeStyles } from "@material-ui/core/styles";
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import { trivialString, illValued } from './../model/utils';
import { TokenContentKind, urlToFileExtension } from './../model/core';
import gif from './../assets/static2.gif';



const useStyles = (isOnMobile, width,height, corner) =>  makeStyles((theme) => createStyles({

    container: {
        width      : width,
        height     : height,
        alignItems : 'center',
    },

    imgContainer : {
        width     : width,
        height    : height,
        objectFit : 'cover',
        overflow: 'hidden',
        borderRadius: corner ?? '0px',
    },

}));


const useOverlayStyles = (fontSize) =>  makeStyles((theme) => createStyles({

    text_overlay: {
        color     : 'white',
        fontFamily: 'NeueMachina-Bold',        
        fontSize  : fontSize,
        height    : '100%',
        textAlign : 'center',
        transform : `translate(0%, 25%)`,
        overflow: 'wrap',
    },    

    overLayContainer: {
        display: 'grid',
    },

    overLayContainerInner: {
        gridArea: '1 / 1',
    },  


}));




/**
 *
 * @use: AppImageView that shows the image
 *       when its loaded, otherwise it shows 
 *       a preview
 *
 **/
export default function AppImageView(props){

    const isOnMobile = useCheckMobileScreen(1000);

    const { 
        imgSrc,
        preview_url,
        width, 
        height, 
        corner, 
        showStatic,
        imgStyle, 
        imageDidLoad,
        type,
        videoSrc,
        not_muted
    } = props;
    const classes = useStyles(isOnMobile, width, height, corner ?? "0px" )() 

    const [ loaded, setLoaded  ] = useState(false);
    const [ previewLoaded, setPreviewLoaded  ] = useState(false);

    function onImageLoad(){
        if (typeof imageDidLoad === 'function'){
            imageDidLoad();
        }
        setLoaded(true);        
    }

    function onPreviewLoaded(){
        if ( typeof preview_url === 'string' && preview_url !== "" ){
            setPreviewLoaded(true)
        }
    }

    let _vid_type = urlToFileExtension(videoSrc ?? "")
    // let _img_type = urlToFileExtension(imgSrc);

    let is_vid_1 = !illValued(type) && (type === TokenContentKind.MP4) && !trivialString(videoSrc)
    let is_vid_2 = _vid_type === TokenContentKind.MP4 && !trivialString(videoSrc)

    if ( is_vid_2 || is_vid_1 ){
        return (
            <div>
                <video
                    loop
                    autoPlay
                    playsinline
                    playsInline
                    src={videoSrc}
                    onLoadedData={onImageLoad}
                    className={classes.imgContainer}
                    style = { loaded ? {} : {display:'none'}}
                    muted = { typeof not_muted === 'boolean' && not_muted ? false : true }
                />
                { loaded ? <div/> : <img src={gif} alt={""} className={classes.imgContainer}/>  }
             </div>
        )             
    } else {
        return (
            <div className={classes.container} style={imgStyle ?? {}}>
                { loaded || previewLoaded || !showStatic ? <div/> :
                    <img className={classes.imgContainer} src={gif} alt="" />
                }
                { loaded 
                    ? 
                    <div/>
                    :
                    <img
                        alt       = {""}
                        src       = {preview_url}
                        className = {classes.imgContainer}
                        onLoad    = {onPreviewLoaded}
                        style     = {previewLoaded ? {...(imgStyle ?? {})} : {display: 'none'}}
                    />      
                }
                <img
                    alt       = {""}
                    src       = {imgSrc}
                    className = {classes.imgContainer}
                    onLoad    = {onImageLoad}
                    style     = {loaded ? {...(imgStyle ?? {})} : {display: 'none'}}
                />  
            </div>
        )
    }

}


/**
 * 
 * @use: center chilren
 *
 **/
export function CenterChildView(props){
    
    return (
        <Stack direction='row' style={{height:'100%'}}>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction='column'>
                <Box sx={{ flexGrow: 1 }} />
                {props.children}
                <Box sx={{ flexGrow: 1 }} />
            </Stack>
            <Box sx={{ flexGrow: 1 }} />
        </Stack>
    )
}


