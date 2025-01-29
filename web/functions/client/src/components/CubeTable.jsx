/**
 * @Package: CubeTableView
 * @Date   : Dec 26th, 2021
 * @Author : Xiao Ling   
 *
 *
*/


import React, {Component, useState, useEffect} from 'react'
import { createStyles, makeStyles } from "@material-ui/core/styles";
import CircularProgress from '@mui/material/CircularProgress';

import { getCube, getRandomInt } from './constants'
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import AppImageView from './AppImageView'
import { COLORS } from './constants'
import { trivialString } from './../model/utils';
import { identicon } from 'minidenticons';

/******************************************************
    @styles + constants
******************************************************/

// cube table params
const mobile_R = 70;
const desktop_R = 32;
const num_cubes = 50;
const cube_ratio = 2/3;
const RED_FILTER = 'invert(15%) sepia(99%) saturate(6825%) hue-rotate(359deg) brightness(97%) contrast(111%)'
const BORDER_white = COLORS.translucent;
const border_width = 240;

const useStyles = (isOnMobile, hideBlackBackground) =>  makeStyles((theme) => createStyles({

    // cube table elements

    cubeTable: {
        width  : isOnMobile ? `${mobile_R}vw` : `${desktop_R}vw`,
        height : isOnMobile ? `${mobile_R}vw` : `${desktop_R}vw`,
        display: 'grid',
        gridTemplateColumns: 'repeat(30, 1fr)',
        gridTemplateRows: 'repeat(30, 1fr)',
        justifyItems: 'center',
        alignItems: 'center',
        padding: '20px',
    },

    // @source: https://stackoverflow.com/questions/14387690/how-can-i-show-only-corner-borders
    cubeTableBorder: {
        boxShadow: `-${border_width}px -${border_width}px 0 -${border_width-3}px ${BORDER_white},${border_width}px -${border_width}px 0 -${border_width-3}px ${BORDER_white}, -${border_width}px  ${border_width}px 0 -${border_width-3}px ${BORDER_white},  ${border_width}px  ${border_width}px 0 -${border_width-3}px ${BORDER_white};`,
    },

    cubeBlock: {
        width  :  isOnMobile ? `${mobile_R/num_cubes}vw` : `${desktop_R/num_cubes}vw`,
        height :  isOnMobile ? `${mobile_R/num_cubes}vw` : `${desktop_R/num_cubes}vw`,
        display: 'flex',
        justifyContent: 'center',        
        alignItems: 'center',
    },

    incompleteTrue: {
        height: isOnMobile ? `${mobile_R/num_cubes*cube_ratio*cube_ratio}vw` : `${desktop_R/num_cubes*cube_ratio}vw`,
        filter: 'brightness(0) invert(1)',
        position: 'absolute'
    },

    incompleteFalse: {
        height: isOnMobile ? `${mobile_R/num_cubes*cube_ratio}vw` : `${desktop_R/num_cubes*cube_ratio}vw`,
        filter: RED_FILTER,
        position: 'absolute'
    },

    blurredCubes: {
        height: isOnMobile ? `${mobile_R/num_cubes*cube_ratio}vw` : `${desktop_R/num_cubes*cube_ratio}vw`,
        filter: `brightness(0.7) invert(0.25)  blur(${isOnMobile ? '3px' : '7px'})`,
    },


    cubeTableWithImageContainer : {
        width  : isOnMobile ? `${mobile_R}vw` : `${desktop_R}vw`,
        height : isOnMobile ? `${mobile_R}vw` : `${desktop_R}vw`,
        display: "flex",          
        justifyContent: 'center',        
        alignItems: 'center',
        flexDirection: 'column',
        position: 'relative',
    },


    blockOverlay: {
        width : isOnMobile ? `${mobile_R-4.2}vw` : `${desktop_R-4.2}vw`,
        height: isOnMobile ? `${mobile_R-4.2}vw` : `${desktop_R-4.2}vw`,
        position: 'absolute',
        background: hideBlackBackground !== undefined 
            && hideBlackBackground !== null 
            && hideBlackBackground 
                ? COLORS.transparent 
                : COLORS.black,
        display: "flex",          
        justifyContent: 'center',        
        alignItems: 'center',
        flexDirection: 'column',        
    },

    // progress view with cube

    progressContainer : {
        width  : '34px',
        height : '34px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '17px',
    },

    progressIncompleteTrue: {
        height: '12px', 
        filter: 'brightness(0) invert(1)',
        position: 'absolute'
    },

    progressIncompleteFalse: {
        height: '12px',
        filter: RED_FILTER,
        position: 'absolute'
    },


}));


function goSetRandomCubes(litThreshold){
    let randomArray = [];
    for (var i = 0; i < 900; i++) {
        randomArray.push({ number: getRandomInt(50) + 1, isLit: Math.random() < litThreshold });
    }
    return randomArray;
}    


function randomCubeArray() {
    return goSetRandomCubes(0.08)
}

const _RANDOM_CUBES_ = randomCubeArray();




/******************************************************
    @View base
******************************************************/


/**
 *
 * @Use: cube table with incomplete cubes
 *       laid out in rune format
 *
 **/
function CubeTableView(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile)() 
    const { isBlurred, cubes, bordered } = props;

    function CubeViewInner(props){
        return (
            <div className={classes.cubeTable}>
                {
                    cubes.map((elem, idx) => (
                        <div key={idx} className={classes.cubeBlock}>
                            <img
                                className={ isBlurred ? classes.blurredCubes : (elem.isLit ? classes.incompleteTrue : classes.incompleteFalse) }
                                src={getCube(elem.number)} 
                                alt={""}
                            />
                        </div>)
                    )
                }
            </div>                        
        )        
    }
    
    if ( bordered ){
        return (
            <div className={classes.cubeTableBorder}>
                <CubeViewInner/>
            </div>            
        )
    } else {
        return (<CubeViewInner/>)
    }
}


/**
 *
 * @use: cube table with animation
 *
 **/
class CubeTable extends Component {

    state = {
        cubes: _RANDOM_CUBES_,
        timer: false,
    }

    async componentDidMount(props){
        // this.loop()
    }

    // @Use: when parent tell child to `animateCubes`
    //       go animate cubes 
    async componentDidUpdate(prevProps) {
        const { animateCubes } = this.props;
        if ( prevProps.animateCubes && animateCubes === false ){            
            clearTimeout(this.state.timer)
        } else if (prevProps.animateCubes === false && animateCubes ) {
            this.loop()
        }
    }

    // @Use: loop and animate
    loop = () => {
        let cubes = goSetRandomCubes(0.15);
        this.setState({ cubes: cubes })
        let timer = setTimeout(() => {
            this.loop();
        },500)
        this.setState({
            timer: timer
        })
    }


    render(){
        return (
            <CubeTableView {...this.props} cubes={this.state.cubes} />
        )
    }
}

/******************************************************
    @View: derived
******************************************************/

/**
 *
 * @Use: blurred out cube to be used as 
 *       preload image
 *
 **/
export function CubeTableShadow(props){
    return (
        <CubeTable {...props} isBlurred={true}/>
    )
}


/**
 *
 * @Use: cube table w/ nft on top
 *
 *
 **/
export function CubeTableWithImage(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const { 
        imgSrc, 
        preview_url, 
        bordered, 
        hideBlackBackground, 
        showImagePreview,
        overlay_style,
    } = props;

    const classes = useStyles(isOnMobile, hideBlackBackground)();

    return (
        <div className={classes.cubeTableWithImageContainer}>
            <CubeTable {...props} bordered />
            { (trivialString(imgSrc) || trivialString(preview_url)) 
                ? 
                <div/> 
                :
                <div className={classes.blockOverlay} style={overlay_style ?? {}}>
                    <AppImageView 
                        imgSrc={imgSrc} 
                        preview_url = {preview_url}
                        videoSrc={imgSrc}
                        width={isOnMobile ? '50vw' : '20vw'}
                        height={isOnMobile ? '50vw' : '20vw'}
                        showStatic = {showImagePreview === true}
                    />
                </div>
            }
        </div>

    )
}

// @use: cube table with sprite generated fromseed
export function CubeTableWithSprite(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const { 
        seed,
        hideBlackBackground, 
    } = props;

    const classes = useStyles(isOnMobile, hideBlackBackground)();
    return (
        <div className={classes.cubeTableWithImageContainer}>
            <CubeTable {...props} bordered />
            <div className={classes.blockOverlay} style={{background:COLORS.offBlack}}>
                <div style={{width: isOnMobile ? '50vw' : '30vw',  height: isOnMobile ? '50vw' : '30vw'}}>
                    <identicon-svg username={seed ?? ""} saturation="95" lightness="60"/> 
                </div>
            </div>
        </div>

    )
}


/******************************************************
    @Animated cube icon 
******************************************************/

/**
 *
 * @use: app progress view measured in cube
 *
 **/
function CubeProgressView(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile, true)();

    const [ isLit, setIsLit ] = useState(false);
    const [ num, setNum ] = useState(4)

    useEffect(() => {
        animate();
    },[])

    function animate(){
        setNum( getRandomInt(50) + 1  )
        setIsLit(Math.random(0,1) < 0.7 )
        setTimeout(() => {
            animate()
        },1000)        
    }

    return (
        <div className={classes.progressContainer}>
            <CircularProgress
                size={'34px'}
                style={{'color': COLORS.red_1}}
            />
            <img
                className={ isLit ? classes.progressIncompleteTrue : classes.progressIncompleteFalse }
                src={getCube(num)} 
                alt={""}
            />
        </div>
    )
}


/******************************************************
    @export
******************************************************/

export default CubeTable;
export {
    useStyles,
    mobile_R,
    desktop_R,
    randomCubeArray,
    CubeProgressView,
    RED_FILTER,
}


































