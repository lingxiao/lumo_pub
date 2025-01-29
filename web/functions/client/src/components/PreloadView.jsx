/**
 * @Package: preload view
 * @Date   : 1/3/2022
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useState, useEffect} from 'react'
import { createStyles, makeStyles } from "@material-ui/core/styles";
import Fade from '@mui/material/Fade';
import Box from '@mui/material/Box';
import CubeTable from './CubeTable';
import { COLORS } from './constants'


const useStyles = makeStyles((theme) => createStyles({
    container: {
        background: COLORS.offBlack,
        display: "flex",          
        justifyContent: 'center',
        alignItems: 'center',
        width: '100vw',
        height: '100vh'
    },

}));




/**
 *
 * @Use: video background view where video appears after n seconds
 *
 **/
export default function PreloadView(props){

    const classes = useStyles();    
    const [ animateCubes, setAnimate ] = useState(false)
    const [ showCube, setShow ] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setShow(true)
        },100)
        setTimeout(() => {
            setAnimate(true)
        },300)
    },[])


    return (
        <div className={classes.container}>
            <Box>
                <Fade in={showCube} unmountOnExit >
                <div>
                <CubeTable animateCubes={animateCubes} {...props}/>
                </div>
                </Fade>
            </Box>
        </div>
    )
}



