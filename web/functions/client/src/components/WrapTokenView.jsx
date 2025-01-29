/**
 * @Package: WrapTokenView
 * @Date   : Dec 24th, 2021
 * @Author : Xiao Ling   
 *
 *
*/


import React, {Component} from 'react'
import Box from '@mui/material/Box';
import { createStyles, makeStyles } from "@material-ui/core/styles";
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';

import cube2 from './../assets/3.jpg';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import { SubmitTokenInput } from './CreditCardInput';
import {CubeTableShadow, CubeTableWithImage} from './CubeTable';

/******************************************************
    @styles
******************************************************/

const mobile_R = 70;
const desktop_R = 32;


const useStyles = (isOnMobile) =>  makeStyles((theme) => createStyles({

    container : {
        height: 'calc(100vh - 200px)', 
        display: "flex",          
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
    },

    cubeTablePadding : {
        paddingTop: theme.spacing(3),
    },

    cubeTableWithImageContainer : {
        width  : isOnMobile ? `${mobile_R}vw` : `${desktop_R}vw`,
        height : isOnMobile ? `${mobile_R}vw` : `${desktop_R}vw`,
        display: "flex",          
        justifyContent: 'center',        
        alignItems: 'center',
        flexDirection: 'column',
    },

    box : {
        width: isOnMobile ? `${mobile_R}vw` : `${desktop_R}vw`,
        textAlign: 'center',
        alignItems: 'center',
        display: 'grid'
    },

    boxContainer: {
        display: 'grid',
    },

    boxInner: {
        gridArea: '1 / 1',
    },

    // wrappedToken: {
    //     width: isOnMobile ? '50vw' : '20vw',
    //     position: 'absolute',
    // },

    mintButton :{
        height: '50px',
        width : isOnMobile ? `${mobile_R}vw` : `${desktop_R}vw`,
    },

    padding_top :{
        marginTop: theme.spacing(3),
        marginBottom: isOnMobile ?  theme.spacing(0.1) : theme.spacing(1) 
    },


}));



/******************************************************
    @View base
******************************************************/


/**
 *
 * @Use: display a table of incomplete cubes
 * @Ref:
 *
 *
 **/
function WrapTokenViewBase(props) {

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile)() 

    const { onTapMintBtn, showInputContractForm, btnLabel } = props;

    return (
        <div className={classes.container}>

            <div className={classes.cubeTablePadding}>

                <Box className={classes.box}>
                    <div className={classes.boxInner}>
                        <Fade in={showInputContractForm} timeout={600} unmountOnExit>
                            <div>
                                <SubmitTokenInput notConnected={false} {...props} />
                            </div>
                        </Fade>
                    </div>
                    <div className={classes.boxInner}>
                        <Fade in={!showInputContractForm} timeout={600} unmountOnExit>
                            <div>
                                <CubeTableWithImage 
                                    {...props}
                                    imgSrc={cube2} 
                                    hideBlackBackground
                                />
                            </div>
                        </Fade>
                    </div>
                </Box>
            </div>

            <div className={classes.padding_top}>
                <Button 
                    variant="outlined" 
                    color="error" 
                    className={classes.mintButton} 
                    sx={ { borderRadius: 30 } }
                    onClick = {onTapMintBtn}
                >
                    <h4 style={{fontFamily: 'NeueMachina-Black'}}>
                        {btnLabel}
                    </h4>
                </Button>        
            </div>

        </div>
    )
}


/******************************************************
    @views
******************************************************/


/**
 *
 * @use: laod wrap token view with base shadow
 *       that disappear
 *       includes other views for wrapping token
 *
 **/
function WrapTokenViewPackage(props) {

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile)();    
    const { showImg } = props;

    return (
        <Box className={classes.container}>
            <Box className={classes.box}>
                <div className={classes.boxInner}>
                    <Fade in={!showImg} timeout={1600} unmountOnExit>
                        <div><CubeTableShadow {...props} /></div>
                    </Fade>
                </div>
                <div className={classes.boxInner}>
                    <Fade in={showImg} timeout={800} unmountOnExit>
                        <div>
                            <WrapTokenViewBase {...props}/>
                        </div>
                    </Fade>
                </div>
            </Box>
        </Box>
    )

}


/**
 *
 * @Use: nonfungible view with perspective container
 *       this element tracks mouse pose and change 
 *       perspective per mouse position
 * 
 */ 
class WrapTokenView extends Component {

    state = {
        showImg: false,
        showInputField: false,
        showInputContractForm: false,
        btnLabel: 'TOUR HOUSE',
    }

    async componentDidMount(){      
        setTimeout(() => {
            this.setState({ showImg: true })
        },10)
    }

    onTapMintBtn = () => {
        const { showInputContractForm } = this.state;
        this.setState({
            // btnLabel: !showInputContractForm ? 'Go to room' : 'Go to room',
            showInputContractForm: !showInputContractForm
        })
    }

    render(){
        return (
            <WrapTokenViewPackage
                {...this.props}
                btnLabel = {this.state.btnLabel}
                onTapMintBtn = {this.onTapMintBtn}
                showInputContractForm = {this.state.showInputContractForm}
                showInputField = {this.state.showInputField}
                showImg = {this.state.showImg}
            />
        )
    }
}



export default WrapTokenView;
export { WrapTokenViewBase }
































