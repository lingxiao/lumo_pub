/**
 *
 *
 * @Package: CubeTableFileUploadView
 * @Date   : Jan 18th, 2022
 * @Author : Xiao Ling   
 * @Doc: 
 *   - https://stackoverflow.com/questions/38049966/get-image-preview-before-uploading-in-react
 *   - https://codesandbox.io/s/patient-pond-0ech0?fontsize=14&hidenavigation=1&theme=dark&file=/src/AvatarPicker.js
 *   - https://stackoverflow.com/questions/54932711/display-and-play-audio-file-selected-in-input-javascript
 *
 *
*/


import React, {useState, useEffect, useRef} from 'react'
import { createStyles, makeStyles } from "@material-ui/core/styles";

import AppImageView from './AppImageView'
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import CubeTable, { mobile_R, desktop_R, useStyles as useCubeStyles } from './CubeTable'
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import static8 from './../assets/static2.gif'

import { trivialString, trivialProps, illValued, } from './../model/utils';
import { urlToFileExtension, toTokenContentKind, TokenContentKind } from './../model/core';
import DragToSave from './DragToSave';
import { COLORS } from './constants'


/******************************************************
    @styles + constants
******************************************************/

// cube table params

const collab_img_width = (isOnMobile) =>  isOnMobile ? `${(mobile_R-4.2)*0.4}vw` : `${(desktop_R-4.2)*0.4}vw`
const collab_img_width_tall = (isOnMobile) => isOnMobile ? `${(mobile_R-4.2)*0.9}vw` : `${(desktop_R-4.2)*0.85}vw`

const useStyles = (isOnMobile) =>  makeStyles((theme) => createStyles({

    // collab cube view
    collab_outer_container : {
        display: "flex",          
        justifyContent: 'center',        
        alignItems: 'center',
        flexDirection: 'row',        
    },

    collab_image_container : {
        display: "flex",          
        justifyContent: 'center',        
        alignItems: 'center',
        flexDirection: 'column',        
    },



}));


/******************************************************
    @cube table child views
******************************************************/



/**
 *
 * @Use: upload image/gif only
 *
 *
**/
function UploadOneOf(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile)();
    const cube_classes = useCubeStyles(isOnMobile, false)();

    let img_width  = collab_img_width(isOnMobile);
    let img_height_tall = collab_img_width_tall(isOnMobile);

    const { 
        kind,
        imgSrc,
        preview_url, 
        previewGif,        
        previewMusic,
        previewMp4,
        imageRef,
        musicRef,
        mp4Ref,
        handleSetMP4,
        handleSetMusic,
        handleSetImage,
        onClickUploadImage,
        onClickUploadMusic
    } = props;    


    function onClickUploadArea(){
        if (kind === TokenContentKind.MP3){
            onClickUploadMusic();
        } else {
            onClickUploadImage();
        }
    }

    var src = previewGif;
    if ( kind === TokenContentKind.MP3 ){
        src = previewMusic        
    } else if ( kind === TokenContentKind.MP4 ){
        src = previewMp4;
    }

    return (
        <div className={cube_classes.blockOverlay}>
            <div className={classes.collab_outer_container}>

                {/* base token preview image */}
                <div className={classes.collab_image_container}>
                    <AppImageView 
                        showStatic                            
                        imgSrc      = {imgSrc} 
                        preview_url = {preview_url}
                        width       = {img_width}
                        height      = {img_height_tall}
                        videoSrc = {imgSrc}
                        type     = {urlToFileExtension(imgSrc)}                        
                    />
                </div>

                <div style={{width:'30px'}}/>                        

                {/*  upload preview image  */}
                <div style={{cursor:'pointer'}} onClick={onClickUploadArea}>
                    <AppImageView 
                        showStatic
                        imgSrc      = {src}
                        preview_url = {src}
                        width       = {img_width}
                        height      = {img_height_tall}
                        imgStyle    = {{cursor: 'pointer'}}
                    />    
                    { kind === TokenContentKind.MP3 
                        ?
                        <input
                            ref      = {musicRef}
                            type     = "file"
                            style    = {{ display: "none" }}
                            accept   = {"audio/mpeg"}
                            onChange = {handleSetMusic}
                        />    
                        :
                        kind === TokenContentKind.MP4
                        ? 
                        <input
                            ref      = {mp4Ref}
                            type     = "file"
                            style    = {{ display: "none" }}
                            accept   = {"video/mpeg"}
                            onChange = {handleSetMP4}
                        />
                        :                          
                        <input
                            ref      = {imageRef}
                            type     = "file"
                            style    = {{ display: "none" }}
                            accept   = {'image/*'}
                            onChange = {handleSetImage}
                        />
                    }
                </div>

            </div>
        </div>
    )
}


/**
 *
 * @Use: upload gif and mp3
 *
 *
 **/
function UploadVisualSound(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile)();
    const cube_classes = useCubeStyles(isOnMobile, false)();

    let img_width  = collab_img_width(isOnMobile);
    let img_height_tall = collab_img_width_tall(isOnMobile);

    const { 
        imgSrc,
        preview_url, 
        previewGif,
        previewMusic,
        imageRef,
        musicRef,
        handleSetMusic,
        handleSetImage,
        onClickUploadImage,
        onClickUploadMusic
    } = props;    


    return (
        <div className={cube_classes.blockOverlay}>
            <div className={classes.collab_outer_container}>
                <div className={classes.collab_image_container}>

                    <AppImageView 
                        showStatic                            
                        imgSrc={imgSrc} 
                        preview_url = {preview_url}
                        width  = {img_width}
                        height = {img_width}
                        videoSrc = {imgSrc}
                        type     = {urlToFileExtension(imgSrc)}                        
                    />
                    <div style={{height:'30px'}}/>

                    <div style={{cursor:'pointer'}} onClick={onClickUploadImage}>
                        <AppImageView 
                            showStatic
                            imgSrc={previewGif}
                            preview_url= {previewGif}
                            width  = {img_width}
                            height = {img_width}
                            imgStyle={{cursor: 'pointer'}}
                        />            
                        <input
                            ref={imageRef}
                            type="file"
                            style={{ display: "none" }}
                            accept="image/*"
                            onChange={handleSetImage}
                        />                                
                    </div>
                </div>

                <div style={{width:'30px'}}/>                        

                <div style={{cursor:'pointer'}} onClick={onClickUploadMusic}>
                    <AppImageView 
                        showStatic
                        imgSrc = {previewMusic}
                        preview_url= {previewMusic}
                        width  = {img_width}
                        height = {img_height_tall}
                        imgStyle={{cursor: 'pointer'}}
                    />    
                    <input
                        ref={musicRef}
                        type="file"
                        style={{ display: "none" }}
                        accept="audio/mpeg"
                        onChange={handleSetMusic}
                    />                                 
                </div>
            </div>
        </div>
    )
}

/******************************************************
    @cube table for uploading original view
******************************************************/


/**
 *
 * @Use: upload and original image
 *
 *
**/
function UploadOriginal(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile)();
    const cube_classes = useCubeStyles(isOnMobile, false)();

    let img_height_tall = collab_img_width_tall(isOnMobile);

    const { 
        previewGif,
        imageRef,
        handleSetImage,
        onClickUploadImage,
        content_kinds,
    } = props;    

    const [ url, seturl ] = useState("")
    useEffect(() => {
        seturl(previewGif);
    },[previewGif])

    // get the selected file extension
    var ext = ""   
    var _type = TokenContentKind.PNG;
    if ( illValued(content_kinds) || trivialProps(content_kinds,'length') || content_kinds.length === 0 ){
        ext = "image/*"                
    } else if ( content_kinds[0] === TokenContentKind.MP4 ){
        ext  = "video/mp4,video/x-m4v,video/*"
        _type = TokenContentKind.MP4;
    } else {
        ext = 'image/*'
    }

    return (
        <div className={cube_classes.blockOverlay}>
            <div className={classes.collab_outer_container}>
                <div style={{cursor:'pointer'}} onClick={onClickUploadImage}>
                    <AppImageView 
                        imgSrc      = {url}
                        preview_url = {url}
                        videoSrc    = {url}
                        width       = {img_height_tall}
                        height      = {img_height_tall}
                        imgStyle    = {{cursor: 'pointer'}}
                        type        = {_type}
                    />    
                    <input
                        ref      = {imageRef}
                        type     = "file"
                        style    = {{ display: "none" }}
                        accept   = {ext}
                        onChange = {handleSetImage}
                    />
                </div>
            </div>
        </div>
    )
    
}

/** 
 *
 * @Use: drag and drop to upload
 *
 **/
function UploadByDragAndSave(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const cube_classes = useCubeStyles(isOnMobile, false)();
    let img_height_tall = collab_img_width_tall(isOnMobile);

    const { 
        handle_did_drop,
        default_url,
        disabled,
        bordered,
        label,
        cubeBackgroundColor,
        custom_children,
        style,
    } = props;    

    // get drag and drop files
    const [ url, seturl ] = useState(default_url ?? "")
    const [ uploadfiles, setfiles ] = useState({});
    const [ type, setType ] = useState(TokenContentKind.PNG);

    function handleFileDrop(inputs){
        
        let _fs =  Object.values(inputs).filter(f => {
            return !trivialString(f.type) && !trivialString(f.name)
        })

        if ( _fs.length > 0 ){

            let file = _fs[0];
            let url  = URL.createObjectURL(file);   
            let type = toTokenContentKind(file.type);

            setfiles(file);
            setType (type);
            seturl  (url);

            if ( typeof handle_did_drop === 'function' ){
                handle_did_drop(file);
            }
        }
    }

    var blank_style = {
        height: '100%'
    }

    if ( cubeBackgroundColor ){
        blank_style['background'] = cubeBackgroundColor;
    }

    if ( custom_children ){

        if ( disabled ){
            return (
                <div>
                    {props.children}
                </div>
            )
        } else {
            return (
                <DragToSave handleDrop={handleFileDrop}>
                    {props.children}
                </DragToSave>
            )
        }

    } else {

        if ( disabled ){
            return (
            <div className={cube_classes.cubeTableWithImageContainer} style={ style ?? {}}>
                <CubeTable {...props} bordered={bordered} />     
                <div className={cube_classes.blockOverlay} style={cubeBackgroundColor ? {background:cubeBackgroundColor}:{} }>
                    <AppImageView 
                        imgSrc      = {url}
                        preview_url = {url}
                        videoSrc    = {url}
                        width       = {img_height_tall}
                        height      = {img_height_tall}
                        type        = {type}
                    />
                    { trivialString(url) ?

                        <Stack direction="column" style={{height:'100%'}} className={cube_classes.blockOverlay}>
                            <Box sx={{ flexGrow: 1 }} />
                            <h3 style={{color:COLORS.surface3}}>
                                { label ?? 'Drag and drop image here'}
                            </h3>
                            <Box sx={{ flexGrow: 1 }} />
                        </Stack>                                            

                        :
                        <div/>
                    }
                </div>
            </div>
            )
        } else {
            return (
                <DragToSave handleDrop={handleFileDrop}>
                    <div className={cube_classes.cubeTableWithImageContainer} style={ style ?? {}}>
                        <CubeTable {...props} bordered={bordered} />     
                        <div className={cube_classes.blockOverlay} style={cubeBackgroundColor ? {background:cubeBackgroundColor}:{} }>
                            <AppImageView 
                                imgSrc      = {url}
                                preview_url = {url}
                                videoSrc    = {url}
                                width       = {img_height_tall}
                                height      = {img_height_tall}
                                type        = {type}
                            />
                            { trivialString(url) ?

                                <Stack direction="column" style={{height:'100%'}} className={cube_classes.blockOverlay}>
                                    <Box sx={{ flexGrow: 1 }} />
                                    <h3 style={{color:COLORS.surface3}}>
                                        { label ?? 'Drag and drop image here'}
                                    </h3>
                                    <Box sx={{ flexGrow: 1 }} />
                                </Stack>                                            

                                :
                                <div/>
                            }
                        </div>
                    </div>
                </DragToSave>
            )
        }
    }

}


/******************************************************
    @cube table upload image + mp3 view
******************************************************/


/**
 *
 * @Use: cube table w/ nft on top
 *
 **/
export default function CubeTableFileUpload(props){

    const isOnMobile   = useCheckMobileScreen(1000);
    const cube_classes = useCubeStyles(isOnMobile, false)();


    const { 
        imgSrc,
        on_did_load_gif,
        on_did_load_music,
        on_did_load_mp4,
        is_closed,
        content_kinds,
        is_root,
    } = props;    


    // preview images for music and gif
    const [ previewGif, setPreviewGif     ] = useState(static8)
    const [ previewMusic, setPreviewMusic ] = useState(static8)
    const [ previewMp4  , setPreviewMp4   ] = useState(static8);
    const [ audio, setAudio ]  = useState(false);

    // fileinput refs
    const imageRef = useRef();
    const musicRef = useRef();
    const mp4Ref   = useRef();

    // on click bottom left image, 
    // open select image picker
    function onClickUploadImage(){
        imageRef.current.click();
    }

    // on click upload music, open music
    function onClickUploadMusic(){
        musicRef.current.click()
    }

    // get file object from dropped file
    // create url to show preview and
    // begin uploading file to remote
    const handleSetImage = (event) => {

        const fileObject = event.target.files[0];
        if (!fileObject) return;

        let url = URL.createObjectURL(fileObject)

        if ( !trivialString(url) ){
            setPreviewGif(url)
        }

        if ( typeof on_did_load_gif === 'function'){
            on_did_load_gif(fileObject)
        }        

    };

    // set mp4 file
    const handleSetMP4 = (event) => {

        const fileObject = event.target.files[0];
        if (!fileObject) return;

        let url = URL.createObjectURL(fileObject)

        if ( !trivialString(url) ){
            setPreviewMp4(url)
        }


        if ( typeof on_did_load_mp4 === 'function'){
            on_did_load_mp4(fileObject)
        }

    };


    // set music file
    const handleSetMusic = (event) => {

        const fileObject = event.target.files[0];
        if (!fileObject) return;

        let url = URL.createObjectURL(fileObject)

        if ( !trivialString(url) ){

            if ( !trivialProps(audio, 'pause') ){
                audio.pause();                
            }

            let new_audio = new Audio(url);            
            new_audio.play();
            setAudio(new_audio);
            setPreviewMusic(static8);
        }

        if ( typeof on_did_load_music === 'function' ){
            on_did_load_music(fileObject)
        }
    }

    // stop music on exit
    // and remove audio instance
    useEffect(() => {
        if ( !trivialProps(audio,'pause') ){
            audio.pause();
            setAudio(false);
        }
    }, [is_closed])

    // choose the correct upload file
    function UpLoadFileView(props){
        if (is_root){
            return <UploadOriginal {...props}/> 
        } else if ( content_kinds.length === 1){
            return <UploadOneOf {...props} kind = {content_kinds[0]}/>
        } else {
            return <UploadVisualSound {...props}/>
        }
    }

    return (
        <div className={cube_classes.cubeTableWithImageContainer}>
            <CubeTable {...props}  />
            { trivialString(imgSrc) && !is_root
                ? 
                <div/> 
                :
                <UpLoadFileView
                    {...props}
                    previewGif         = {previewGif}
                    previewMusic       = {previewMusic}
                    previewMp4         = {previewMp4}
                    imageRef           = {imageRef}
                    musicRef           = {musicRef}
                    mp4Ref             = {mp4Ref}
                    handleSetMusic     = {handleSetMusic}
                    handleSetImage     = {handleSetImage}
                    handleSetMP4       = {handleSetMP4}
                    onClickUploadImage = {onClickUploadImage}
                    onClickUploadMusic = {onClickUploadMusic}
                />
            }
        </div>

    )
}


export { UploadByDragAndSave  }
































