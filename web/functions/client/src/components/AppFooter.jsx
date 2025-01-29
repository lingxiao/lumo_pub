/**
 * @Package: Footer
 * @Date   : Dec 22nd, 2021
 * @Author : Xiao Ling   
 * @Docs:
 *   - chat style: https://codesandbox.io/s/material-ui-chat-drh4l?file=/src/App.js
 *   - chat full: https://github.com/Wolox/react-chat-widget
 *   - the console used: https://github.com/linuswillner/react-console-emulator
 *   - other console: https://github.com/webscopeio/react-console
 *   - mui lib: https://mui.com/components/text-fields/
 *
*/


import React, {Component, useState, useEffect} from 'react'
import { createStyles, makeStyles } from "@material-ui/core/styles";
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';


import { COLORS, getCube, getRandomInt } from './constants'
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import CubeTable, { CubeProgressView, RED_FILTER } from './CubeTable';

/******************************************************
    @styles
******************************************************/


const useStyles = (isOnMobile, num_cubes) => makeStyles((theme) => createStyles({

    footer : {
        position: 'absolute',
        bottom: '0px',
        width: '96vw',
        height: '70px',
        borderTop  : `0.8px solid ${COLORS.translucent}`,
        display: "flex",          
        justifyContent: 'center',

    },

    cubeTable: {
        width: '96vw',
        height: '50px',
        justifyItems: 'center',
        alignItems  : 'center',
        paddingTop  : theme.spacing(2),
        // marginBottom: theme.spacing(0.5),
        // background: 'blue',
    },

    cubeRow : {
        width: '96vw',        
        marginTop: theme.spacing(0.4),
    },

    cubeBlock: {
        width : '1.2vw', // '20px',
        display: 'flex',
        alignItems  : 'center',
        justifyItems: 'center',
        justifyContent: 'center',
    },

    cubeStyle: {
        height: '8px',
        display: 'flex',
        alignItems  : 'center',
        justifyItems: 'center',
        filter:  'brightness(0) invert(15%)',
    },

    incompleteTrue: {
        height: '8px',
        display: 'flex',
        alignItems  : 'center',
        justifyItems: 'center',
        filter: 'brightness(0) invert(1)',
    },

    incompleteFalse: {
        height: '8px',
        display: 'flex',
        alignItems  : 'center',
        justifyItems: 'center',
        filter: RED_FILTER,
    },        

}));



/******************************************************
    @View: cube footer row
******************************************************/


/**
 *
 * @Use: rows of cubes
 *
 **/
function CubeRows(props){

    const [width] = useState(window.innerWidth);
    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile, 0)();    

    const { show_progress } = props;

    const [ animate, eanimate ] = useState(false)

    useEffect(() => {
        eanimate(show_progress);
    },[ show_progress ])

    return (
        <Stack direction={'column'} spacing={0} className={classes.cubeTable}>
            <CubeRowComponent {...props} isBlurred={!animate} animateCubes={animate} />
            <CubeRowComponent {...props} isBlurred={!animate} animateCubes={animate} />
        </Stack>

    )
}


function goSetRandomCubes(litThreshold){
    let randomArray = [];
    for (var i = 0; i < 80; i++) {
        randomArray.push({ number: getRandomInt(50) + 1, isLit: Math.random() < litThreshold });
    }
    return randomArray;
}    


/**
 *
 * @use: cube table with animation
 *
 **/
class CubeRowComponent extends Component {

    state = {
        cubes: goSetRandomCubes(0),
        timer: false,
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
        },600)
        this.setState({
            timer: timer
        })
    }

    render(){
        return (
            <CubeRowView {...this.props} cubes={this.state.cubes} />
        )
    }
}


/**
 *
 * @Use: cube table with incomplete cubes
 *       laid out in rune format
 *
 **/
function CubeRowView({  isBlurred, cubes }){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile)() 

    return (
        <Stack direction={'row'} className={classes.cubeRow}>
            <Box sx={{flexGrow:1}}/>
            { cubes.map((elem, idx) => (
                <div key={idx} className={classes.cubeBlock}>
                    <img
                        className={ isBlurred ? classes.cubeStyle : (elem.isLit ? classes.incompleteTrue : classes.incompleteFalse) }
                        src={getCube(elem.number)} 
                        alt={""}
                    />                
                </div>
            ))}
            <Box sx={{flexGrow:1}}/>
        </Stack>        
    )
    
}


/******************************************************
    @View: exported
******************************************************/


/**
 *
 * @Use: app footer
 *
 *
 **/
export default function AppFooter(props) {

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile)();    

    return (
      <div className={classes.footer}> 
        <div style={{display:'flex', justifyContent: 'center', alignItems:'center'}}>
            <CubeRows {...props}/>
        </div>
      </div>    

    )
}